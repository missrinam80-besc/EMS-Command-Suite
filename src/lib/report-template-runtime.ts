import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv, shouldUseDemoData } from "@/lib/env";

export type RuntimeReportField = {
  id: string;
  sectionKey: string;
  fieldKey: string;
  label: string;
  fieldType:
    | "text"
    | "textarea"
    | "number"
    | "date"
    | "datetime"
    | "select"
    | "multiselect"
    | "checkbox"
    | "radio";
  placeholder: string | null;
  helpText: string | null;
  options: string[];
  isRequired: boolean;
  sortOrder: number;
  validationRules: Record<string, unknown>;
  conditionalLogic: Record<string, unknown>;
};

export type RuntimeReportTemplate = {
  id: string;
  code: string;
  label: string;
  reportTypeCode: string;
  fields: RuntimeReportField[];
};

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function getStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isConditionMatch(values: Record<string, unknown>, logic: Record<string, unknown>) {
  const when = asObject(logic.when);
  const targetField = getStringValue(when.field);
  if (!targetField) return true;

  const operator = getStringValue(when.operator) || "equals";
  const expected = when.value;
  const actual = values[targetField];

  if (operator === "not_equals") {
    return actual !== expected;
  }

  if (operator === "truthy") {
    return Boolean(actual);
  }

  if (operator === "falsy") {
    return !actual;
  }

  if (operator === "contains") {
    if (Array.isArray(actual)) {
      return actual.map(String).includes(String(expected ?? ""));
    }
    return String(actual ?? "").includes(String(expected ?? ""));
  }

  if (operator === "not_contains") {
    if (Array.isArray(actual)) {
      return !actual.map(String).includes(String(expected ?? ""));
    }
    return !String(actual ?? "").includes(String(expected ?? ""));
  }

  if (operator === "gt" || operator === "lt") {
    const actualNumber = Number(actual);
    const expectedNumber = Number(expected);
    if (!Number.isFinite(actualNumber) || !Number.isFinite(expectedNumber)) {
      return false;
    }
    return operator === "gt" ? actualNumber > expectedNumber : actualNumber < expectedNumber;
  }

  if (operator === "in" || operator === "not_in") {
    const candidates = Array.isArray(expected) ? expected.map(String) : [String(expected ?? "")];
    const actualValues = Array.isArray(actual) ? actual.map(String) : [String(actual ?? "")];
    const hasMatch = actualValues.some((value) => candidates.includes(value));
    return operator === "in" ? hasMatch : !hasMatch;
  }

  return actual === expected;
}

export function evaluateRuntimeFieldVisibility(
  field: Pick<RuntimeReportField, "conditionalLogic">,
  values: Record<string, unknown>,
): boolean {
  return isConditionMatch(values, field.conditionalLogic ?? {});
}

export async function getActiveRuntimeReportTemplate(
  reportTypeCode: string,
): Promise<RuntimeReportTemplate | null> {
  if (shouldUseDemoData() || !hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: template, error: templateError } = await supabase
    .from("form_templates")
    .select("id, code, label, report_type_code")
    .eq("template_kind", "report")
    .eq("report_type_code", reportTypeCode)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (templateError || !template) {
    return null;
  }

  const { data: fields, error: fieldsError } = await supabase
    .from("form_template_fields")
    .select(
      "id, section_key, field_key, label, field_type, placeholder, help_text, options, is_required, sort_order, validation_rules, conditional_logic, is_active",
    )
    .eq("template_id", template.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (fieldsError) {
    return null;
  }

  return {
    id: template.id,
    code: template.code,
    label: template.label,
    reportTypeCode,
    fields: (fields ?? []).map((field) => ({
      id: field.id,
      sectionKey: field.section_key ?? "general",
      fieldKey: field.field_key,
      label: field.label,
      fieldType: field.field_type as RuntimeReportField["fieldType"],
      placeholder: field.placeholder ?? null,
      helpText: field.help_text ?? null,
      options: Array.isArray(field.options)
        ? field.options.filter((entry): entry is string => typeof entry === "string")
        : [],
      isRequired: field.is_required,
      sortOrder: field.sort_order,
      validationRules: asObject(field.validation_rules),
      conditionalLogic: asObject(field.conditional_logic),
    })),
  };
}

export function extractRuntimeFieldValues(
  formData: FormData,
  fields: RuntimeReportField[],
): Record<string, unknown> {
  const values: Record<string, unknown> = {};

  for (const field of fields) {
    if (field.fieldType === "multiselect") {
      values[field.fieldKey] = formData
        .getAll(field.fieldKey)
        .map((entry) => String(entry))
        .filter(Boolean);
      continue;
    }

    if (field.fieldType === "checkbox") {
      values[field.fieldKey] = formData.get(field.fieldKey) !== null;
      continue;
    }

    const rawValue = String(formData.get(field.fieldKey) ?? "").trim();
    values[field.fieldKey] = field.fieldType === "number" ? Number(rawValue || 0) : rawValue;
  }

  return values;
}

export function validateRuntimeFieldValues(
  values: Record<string, unknown>,
  fields: RuntimeReportField[],
): string[] {
  const errors: string[] = [];

  for (const field of fields) {
    if (!isConditionMatch(values, field.conditionalLogic)) {
      continue;
    }

    const value = values[field.fieldKey];
    const asString = typeof value === "string" ? value.trim() : "";
    const validation = field.validationRules;

    if (field.isRequired) {
      const hasValue = Array.isArray(value) ? value.length > 0 : value === true || asString.length > 0;
      if (!hasValue) {
        errors.push(`Veld \"${field.label}\" is verplicht.`);
        continue;
      }
    }

    if (asString) {
      const min = typeof validation.min === "number" ? validation.min : null;
      const max = typeof validation.max === "number" ? validation.max : null;
      const pattern = typeof validation.pattern === "string" ? validation.pattern : null;

      if (min !== null && asString.length < min) {
        errors.push(`Veld \"${field.label}\" moet minimaal ${min} tekens bevatten.`);
      }
      if (max !== null && asString.length > max) {
        errors.push(`Veld \"${field.label}\" mag maximaal ${max} tekens bevatten.`);
      }
      if (pattern) {
        const regex = new RegExp(pattern);
        if (!regex.test(asString)) {
          errors.push(`Veld \"${field.label}\" heeft een ongeldig formaat.`);
        }
      }
    }
  }

  return errors;
}

export function formatRuntimeFieldValue(value: unknown, fieldType?: RuntimeReportField["fieldType"]): string {
  if (fieldType === "checkbox") {
    if (value === true) return "Ja";
    if (value === false) return "Nee";
  }

  if (Array.isArray(value)) {
    const items = value
      .map((entry) => String(entry).trim())
      .filter(Boolean);
    return items.length > 0 ? items.join(", ") : "Niet ingevuld";
  }

  if (value === null || value === undefined) {
    return "Niet ingevuld";
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : "Niet ingevuld";
}
