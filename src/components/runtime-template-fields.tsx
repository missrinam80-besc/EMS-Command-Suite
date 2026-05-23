"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RuntimeReportField } from "@/lib/report-template-runtime";

type RuntimeTemplateFieldsProps = {
  fields: RuntimeReportField[];
  initialValues?: Record<string, unknown>;
};

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeValues(
  fields: RuntimeReportField[],
  baseValues: Record<string, unknown>,
): Record<string, unknown> {
  const values = { ...baseValues };

  for (const field of fields) {
    const current = values[field.fieldKey];
    if (field.fieldType === "multiselect") {
      values[field.fieldKey] = Array.isArray(current)
        ? current.map((entry) => String(entry))
        : typeof current === "string" && current.length > 0
          ? [current]
          : [];
      continue;
    }

    if (field.fieldType === "checkbox") {
      values[field.fieldKey] = current === true || current === "true" || current === "on";
      continue;
    }

    values[field.fieldKey] = toStringValue(current);
  }

  return values;
}

function evaluateVisibility(field: RuntimeReportField, values: Record<string, unknown>): boolean {
  const rawWhen = field.conditionalLogic?.when;
  if (!rawWhen || typeof rawWhen !== "object") {
    return true;
  }

  const when = rawWhen as { field?: unknown; operator?: unknown; value?: unknown };
  const targetField = typeof when.field === "string" ? when.field : "";
  if (!targetField) return true;

  const operator = typeof when.operator === "string" ? when.operator : "equals";
  const expected = when.value;
  const actual = values[targetField];

  if (operator === "not_equals") return actual !== expected;
  if (operator === "truthy") return Boolean(actual);
  if (operator === "falsy") return !actual;

  if (operator === "contains") {
    if (Array.isArray(actual)) return actual.map(String).includes(String(expected ?? ""));
    return String(actual ?? "").includes(String(expected ?? ""));
  }

  if (operator === "not_contains") {
    if (Array.isArray(actual)) return !actual.map(String).includes(String(expected ?? ""));
    return !String(actual ?? "").includes(String(expected ?? ""));
  }

  if (operator === "gt" || operator === "lt") {
    const actualNumber = Number(actual);
    const expectedNumber = Number(expected);
    if (!Number.isFinite(actualNumber) || !Number.isFinite(expectedNumber)) return false;
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

function collectFormValues(form: HTMLFormElement): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  const formData = new FormData(form);

  for (const [key, value] of formData.entries()) {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      const current = values[key];
      if (Array.isArray(current)) {
        current.push(String(value));
      } else {
        values[key] = [String(current), String(value)];
      }
    } else {
      values[key] = String(value);
    }
  }

  const elements = Array.from(form.elements);
  for (const element of elements) {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement)) {
      continue;
    }

    const name = element.name;
    if (!name) continue;

    if (element instanceof HTMLInputElement && element.type === "checkbox") {
      values[name] = element.checked;
      continue;
    }

    if (element instanceof HTMLSelectElement && element.multiple) {
      values[name] = Array.from(element.selectedOptions).map((option) => option.value);
    }
  }

  return values;
}

export function RuntimeTemplateFields({ fields, initialValues = {} }: RuntimeTemplateFieldsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    normalizeValues(fields, initialValues),
  );

  useEffect(() => {
    const form = containerRef.current?.closest("form");
    if (!form) return;

    const syncFromForm = () => {
      setValues((current) => ({ ...current, ...collectFormValues(form) }));
    };

    syncFromForm();
    form.addEventListener("input", syncFromForm);
    form.addEventListener("change", syncFromForm);

    return () => {
      form.removeEventListener("input", syncFromForm);
      form.removeEventListener("change", syncFromForm);
    };
  }, []);

  const visibleFields = useMemo(
    () => fields.filter((field) => evaluateVisibility(field, values)),
    [fields, values],
  );

  if (visibleFields.length === 0) return null;

  return (
    <article
      ref={containerRef}
      className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
    >
      <h2 className="text-2xl font-semibold text-[var(--color-ink)]">Templatevelden</h2>
      <div className="mt-5 grid gap-4">
        {visibleFields.map((field) => {
          const currentValue = values[field.fieldKey];
          const stringValue = typeof currentValue === "string" ? currentValue : "";
          const selectedValues = Array.isArray(currentValue)
            ? currentValue.map((entry) => String(entry))
            : [];
          const checked = currentValue === true;

          return (
            <label key={field.id} className="grid gap-2 text-sm text-[var(--color-muted)]">
              {field.label}
              {field.fieldType === "textarea" ? (
                <textarea
                  name={field.fieldKey}
                  rows={4}
                  required={field.isRequired}
                  defaultValue={stringValue}
                  placeholder={field.placeholder ?? ""}
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              ) : field.fieldType === "select" || field.fieldType === "radio" ? (
                <select
                  name={field.fieldKey}
                  required={field.isRequired}
                  defaultValue={stringValue}
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                >
                  <option value="">Selecteer...</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : field.fieldType === "multiselect" ? (
                <select
                  name={field.fieldKey}
                  multiple
                  defaultValue={selectedValues}
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                >
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : field.fieldType === "checkbox" ? (
                <input
                  type="checkbox"
                  name={field.fieldKey}
                  defaultChecked={checked}
                  className="h-5 w-5 rounded border border-[var(--color-line)]"
                />
              ) : (
                <input
                  type={
                    field.fieldType === "number"
                      ? "number"
                      : field.fieldType === "date"
                        ? "date"
                        : field.fieldType === "datetime"
                          ? "datetime-local"
                          : "text"
                  }
                  name={field.fieldKey}
                  required={field.isRequired}
                  defaultValue={stringValue}
                  placeholder={field.placeholder ?? ""}
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              )}
              {field.helpText ? <span className="text-xs">{field.helpText}</span> : null}
            </label>
          );
        })}
      </div>
    </article>
  );
}
