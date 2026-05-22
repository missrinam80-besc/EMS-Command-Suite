"use client";

import {
  createFormFieldAction,
  createFormTemplateAction,
  createReportTypeAction,
  deleteFormFieldAction,
  deleteFormSectionAction,
  deleteFormTemplateAction,
  moveFormFieldAction,
  renameFormSectionAction,
  updateFormFieldAction,
  updateFormTemplateAction,
} from "@/app/(protected)/beheer/actions";
import type { ManagedCatalogItem, ManagedFormField, ManagedFormTemplate } from "@/lib/admin";

type AdminReportFormBuilderProps = {
  reportTypes: ManagedCatalogItem[];
  templates: ManagedFormTemplate[];
  fields: ManagedFormField[];
};

const fieldTypes: ManagedFormField["fieldType"][] = ["text", "textarea", "number", "date", "datetime", "select", "multiselect", "checkbox", "radio"];
const knownDatabaseColumns = [
  "medical_reports.title",
  "medical_reports.summary",
  "medical_reports.content",
  "medical_reports.case_id",
  "patients.full_name",
  "patients.citizenid",
  "patients.phone",
  "patients.status_code",
  "patient_cases.title",
  "patient_cases.summary",
  "patient_cases.status",
];

function safeJsonString(value: unknown) {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return "{}";
  }
}

function normalizedSectionKey(input: string) {
  return input.trim().toLowerCase().replace(/\s+/g, "_") || "general";
}

export function AdminReportFormBuilder({ reportTypes, templates, fields }: AdminReportFormBuilderProps) {
  const fieldsByTemplate = new Map<string, ManagedFormField[]>();
  for (const field of fields) {
    const current = fieldsByTemplate.get(field.templateId) ?? [];
    fieldsByTemplate.set(field.templateId, [...current, field].sort((a, b) => a.sortOrder - b.sortOrder));
  }

  return (
    <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
      <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">Rapporten en formulieren</p>
      <h1 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">Builder</h1>

      <details open className="mt-6 rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <summary className="cursor-pointer text-lg font-semibold text-[var(--color-ink)]">Rapporttypen beheren</summary>
        <form action={createReportTypeAction} className="mt-4 grid gap-3">
          <div className="grid gap-3 md:grid-cols-3">
            <input name="code" required placeholder="spoed_observatie" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
            <input name="label" required placeholder="Spoedobservatie" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
            <input name="colorHex" placeholder="#0f5f8f" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
          </div>
          <textarea name="description" rows={2} placeholder="Beschrijving" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]"><input type="checkbox" name="isActive" defaultChecked />Actief</label>
            <button type="submit" className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold">Rapporttype aanmaken</button>
          </div>
        </form>
      </details>

      <details open className="mt-4 rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <summary className="cursor-pointer text-lg font-semibold text-[var(--color-ink)]">Template types beheren (formulier + rapport)</summary>
        <form action={createFormTemplateAction} className="mt-4 grid gap-3">
          <div className="grid gap-3 md:grid-cols-3">
            <input name="code" required placeholder="medicatie_registratie" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
            <input name="label" required placeholder="Medicatieregistratie" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
            <select name="templateKind" defaultValue="form" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm"><option value="form">Formulier</option><option value="report">Rapport</option></select>
          </div>
          <select name="reportTypeCode" defaultValue="" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm">
            <option value="">Geen rapporttype gekoppeld</option>
            {reportTypes.map((type) => <option key={type.id} value={type.code}>{type.label} ({type.code})</option>)}
          </select>
          <textarea name="description" rows={2} placeholder="Beschrijving" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]"><input type="checkbox" name="isActive" defaultChecked />Actief</label>
            <button type="submit" className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold">Template aanmaken</button>
          </div>
        </form>
      </details>

      <details open className="mt-4 rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <summary className="cursor-pointer text-lg font-semibold text-[var(--color-ink)]">Builder: secties en velden</summary>

        <form action={createFormFieldAction} className="mt-4 grid gap-3">
          <div className="grid gap-3 md:grid-cols-3">
            <select name="templateId" required defaultValue="" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm">
              <option value="">Kies template</option>
              {templates.map((template) => <option key={template.id} value={template.id}>{template.label} ({template.code})</option>)}
            </select>
            <input name="fieldKey" required placeholder="klinische_status" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
            <input name="label" required placeholder="Klinische status" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <select name="fieldType" defaultValue="text" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm">{fieldTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select>
            <select name="bindingSource" defaultValue="custom" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm"><option value="custom">Nieuw veld (custom)</option><option value="medical_reports">Bestaand veld: medical_reports</option><option value="patients">Bestaand veld: patients</option><option value="patient_cases">Bestaand veld: patient_cases</option></select>
            <input name="bindingColumn" list="known-db-columns" placeholder="bv. medical_reports.summary" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
          </div>
          <input name="sectionKey" defaultValue="general" placeholder="Sectie key (bv. intake)" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
          <input name="placeholder" placeholder="Placeholder" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
          <textarea name="helpText" rows={2} placeholder="Hulptekst" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
          <textarea name="options" rows={3} placeholder="Meerkeuzeopties (1 per lijn)" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
          <textarea name="validationRules" rows={2} defaultValue="{}" placeholder='Validatie JSON, bv. {"min":1,"max":10}' className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
          <textarea name="conditionalLogic" rows={2} defaultValue="{}" placeholder='Conditional JSON, bv. {"when":{"field":"prioriteit","equals":"P1"}}' className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
          <div className="grid gap-3 md:grid-cols-3">
            <input type="number" name="sortOrder" defaultValue={100} className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]"><input type="checkbox" name="isRequired" />Verplicht</label>
            <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]"><input type="checkbox" name="isActive" defaultChecked />Actief</label>
          </div>
          <div className="flex justify-end"><button type="submit" className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold">Veld aanmaken</button></div>
        </form>

        <datalist id="known-db-columns">{knownDatabaseColumns.map((column) => <option key={column} value={column} />)}</datalist>

        <div className="mt-5 grid gap-4">
          {templates.map((template) => {
            const templateFields = fieldsByTemplate.get(template.id) ?? [];
            const fieldsBySection = new Map<string, ManagedFormField[]>();
            for (const field of templateFields) {
              const key = field.sectionKey || "general";
              const current = fieldsBySection.get(key) ?? [];
              fieldsBySection.set(key, [...current, field].sort((a, b) => a.sortOrder - b.sortOrder));
            }

            return (
              <article key={template.id} className="rounded-xl border border-[var(--color-line)] bg-white p-4">
                <h3 className="text-base font-semibold text-[var(--color-ink)]">{template.label} ({template.code}) · {template.templateKind}</h3>
                <form action={updateFormTemplateAction} className="mt-3 grid gap-2">
                  <input type="hidden" name="id" value={template.id} />
                  <input name="label" defaultValue={template.label} className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
                  <select name="templateKind" defaultValue={template.templateKind} className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm"><option value="form">Formulier</option><option value="report">Rapport</option></select>
                  <select name="reportTypeCode" defaultValue={template.reportTypeCode ?? ""} className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm"><option value="">Geen rapporttype gekoppeld</option>{reportTypes.map((type) => <option key={type.id} value={type.code}>{type.label} ({type.code})</option>)}</select>
                  <textarea name="description" rows={2} defaultValue={template.description ?? ""} className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
                  <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]"><input type="checkbox" name="isActive" defaultChecked={template.isActive} />Actief</label>
                  <div className="flex gap-2"><button type="submit" className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold">Template opslaan</button>{!template.isSystem ? <button formAction={deleteFormTemplateAction} className="rounded-full border border-[#ef4444] px-4 py-2 text-sm font-semibold text-[#b91c1c]">Template verwijderen</button> : null}</div>
                </form>

                {[...fieldsBySection.entries()].map(([sectionKey, sectionFields]) => (
                  <section key={`${template.id}-${sectionKey}`} className="mt-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-[var(--color-ink)]">Sectie: {sectionKey}</h4>
                      <div className="flex flex-wrap gap-2">
                        <form action={renameFormSectionAction} className="flex items-center gap-2">
                          <input type="hidden" name="templateId" value={template.id} />
                          <input type="hidden" name="fromSectionKey" value={sectionKey} />
                          <input name="toSectionKey" defaultValue={sectionKey} className="rounded-lg border border-[var(--color-line)] bg-white px-2 py-1 text-xs" onBlur={(e) => { e.currentTarget.value = normalizedSectionKey(e.currentTarget.value); }} />
                          <button type="submit" className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-semibold">Hernoem</button>
                        </form>
                        {sectionKey !== "general" ? (
                          <form action={deleteFormSectionAction} className="flex items-center gap-2">
                            <input type="hidden" name="templateId" value={template.id} />
                            <input type="hidden" name="sectionKey" value={sectionKey} />
                            <input name="targetSectionKey" defaultValue="general" className="rounded-lg border border-[var(--color-line)] bg-white px-2 py-1 text-xs" />
                            <button type="submit" className="rounded-full border border-[#ef4444] px-3 py-1 text-xs font-semibold text-[#b91c1c]">Verwijder sectie</button>
                          </form>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3">
                      {sectionFields.map((field) => {
                        const rule = (field.conditionalLogic?.when ?? {}) as { field?: string; operator?: string; value?: string };
                        const validation = field.validationRules as { min?: number; max?: number; pattern?: string; requiredIf?: string };
                        return (
                          <form key={field.id} action={updateFormFieldAction} className="grid gap-2 rounded-xl border border-[var(--color-line)] bg-white p-3">
                            <input type="hidden" name="id" value={field.id} />
                            <div className="grid gap-2 md:grid-cols-4">
                              <input readOnly value={field.fieldKey} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-xs" />
                              <input name="label" defaultValue={field.label} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs" />
                              <input name="sectionKey" defaultValue={field.sectionKey} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs" onBlur={(e) => { e.currentTarget.value = normalizedSectionKey(e.currentTarget.value); }} />
                              <input type="number" name="sortOrder" defaultValue={field.sortOrder} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs" />
                            </div>

                            <div className="grid gap-2 md:grid-cols-3">
                              <select name="fieldType" defaultValue={field.fieldType} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs">{fieldTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select>
                              <select name="bindingSource" defaultValue={field.bindingSource} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs"><option value="custom">custom</option><option value="medical_reports">medical_reports</option><option value="patients">patients</option><option value="patient_cases">patient_cases</option></select>
                              <input name="bindingColumn" list="known-db-columns" defaultValue={field.bindingColumn ?? ""} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs" />
                            </div>

                            <textarea name="placeholder" defaultValue={field.placeholder ?? ""} rows={1} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs" />
                            <textarea name="helpText" defaultValue={field.helpText ?? ""} rows={1} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs" />
                            <textarea name="options" defaultValue={field.options.join("\n")} rows={2} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs" />

                            <div className="grid gap-2 md:grid-cols-4">
                              <input defaultValue={validation.min ?? ""} placeholder="min" className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs" onChange={(e) => {
                                const form = e.currentTarget.form as HTMLFormElement;
                                const max = (form.elements.namedItem("_max") as HTMLInputElement)?.value;
                                const pattern = (form.elements.namedItem("_pattern") as HTMLInputElement)?.value;
                                const requiredIf = (form.elements.namedItem("_requiredIf") as HTMLInputElement)?.value;
                                const minVal = e.currentTarget.value;
                                const payload: Record<string, unknown> = {};
                                if (minVal) payload.min = Number(minVal);
                                if (max) payload.max = Number(max);
                                if (pattern) payload.pattern = pattern;
                                if (requiredIf) payload.requiredIf = requiredIf;
                                (form.elements.namedItem("validationRules") as HTMLTextAreaElement).value = safeJsonString(payload);
                              }} />
                              <input name="_max" defaultValue={validation.max ?? ""} placeholder="max" className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs" onChange={(e) => {
                                const form = e.currentTarget.form as HTMLFormElement;
                                const min = (form.elements.namedItem("_min") as HTMLInputElement)?.value || "";
                                const pattern = (form.elements.namedItem("_pattern") as HTMLInputElement)?.value;
                                const requiredIf = (form.elements.namedItem("_requiredIf") as HTMLInputElement)?.value;
                                const payload: Record<string, unknown> = {};
                                if (min) payload.min = Number(min);
                                if (e.currentTarget.value) payload.max = Number(e.currentTarget.value);
                                if (pattern) payload.pattern = pattern;
                                if (requiredIf) payload.requiredIf = requiredIf;
                                (form.elements.namedItem("validationRules") as HTMLTextAreaElement).value = safeJsonString(payload);
                              }} />
                              <input name="_pattern" defaultValue={validation.pattern ?? ""} placeholder="regex" className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs" onChange={(e) => {
                                const form = e.currentTarget.form as HTMLFormElement;
                                const min = (form.elements.namedItem("_min") as HTMLInputElement)?.value || "";
                                const max = (form.elements.namedItem("_max") as HTMLInputElement)?.value || "";
                                const requiredIf = (form.elements.namedItem("_requiredIf") as HTMLInputElement)?.value;
                                const payload: Record<string, unknown> = {};
                                if (min) payload.min = Number(min);
                                if (max) payload.max = Number(max);
                                if (e.currentTarget.value) payload.pattern = e.currentTarget.value;
                                if (requiredIf) payload.requiredIf = requiredIf;
                                (form.elements.namedItem("validationRules") as HTMLTextAreaElement).value = safeJsonString(payload);
                              }} />
                              <input name="_requiredIf" defaultValue={validation.requiredIf ?? ""} placeholder="requiredIf" className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs" onChange={(e) => {
                                const form = e.currentTarget.form as HTMLFormElement;
                                const min = (form.elements.namedItem("_min") as HTMLInputElement)?.value || "";
                                const max = (form.elements.namedItem("_max") as HTMLInputElement)?.value || "";
                                const pattern = (form.elements.namedItem("_pattern") as HTMLInputElement)?.value;
                                const payload: Record<string, unknown> = {};
                                if (min) payload.min = Number(min);
                                if (max) payload.max = Number(max);
                                if (pattern) payload.pattern = pattern;
                                if (e.currentTarget.value) payload.requiredIf = e.currentTarget.value;
                                (form.elements.namedItem("validationRules") as HTMLTextAreaElement).value = safeJsonString(payload);
                              }} />
                            </div>
                            <input type="hidden" name="_min" defaultValue={validation.min ?? ""} />

                            <div className="grid gap-2 md:grid-cols-3">
                              <input name="_condField" defaultValue={rule.field ?? ""} placeholder="conditional field" className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs" onChange={(e) => {
                                const form = e.currentTarget.form as HTMLFormElement;
                                const op = (form.elements.namedItem("_condOp") as HTMLSelectElement)?.value || "equals";
                                const val = (form.elements.namedItem("_condVal") as HTMLInputElement)?.value || "";
                                const payload = e.currentTarget.value ? { when: { field: e.currentTarget.value, operator: op, value: val } } : {};
                                (form.elements.namedItem("conditionalLogic") as HTMLTextAreaElement).value = safeJsonString(payload);
                              }} />
                              <select name="_condOp" defaultValue={rule.operator ?? "equals"} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs" onChange={(e) => {
                                const form = e.currentTarget.form as HTMLFormElement;
                                const fld = (form.elements.namedItem("_condField") as HTMLInputElement)?.value || "";
                                const val = (form.elements.namedItem("_condVal") as HTMLInputElement)?.value || "";
                                const payload = fld ? { when: { field: fld, operator: e.currentTarget.value, value: val } } : {};
                                (form.elements.namedItem("conditionalLogic") as HTMLTextAreaElement).value = safeJsonString(payload);
                              }}>
                                <option value="equals">equals</option>
                                <option value="not_equals">not_equals</option>
                                <option value="contains">contains</option>
                              </select>
                              <input name="_condVal" defaultValue={rule.value ?? ""} placeholder="conditional value" className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs" onChange={(e) => {
                                const form = e.currentTarget.form as HTMLFormElement;
                                const fld = (form.elements.namedItem("_condField") as HTMLInputElement)?.value || "";
                                const op = (form.elements.namedItem("_condOp") as HTMLSelectElement)?.value || "equals";
                                const payload = fld ? { when: { field: fld, operator: op, value: e.currentTarget.value } } : {};
                                (form.elements.namedItem("conditionalLogic") as HTMLTextAreaElement).value = safeJsonString(payload);
                              }} />
                            </div>

                            <textarea name="validationRules" defaultValue={safeJsonString(field.validationRules)} rows={2} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs" />
                            <textarea name="conditionalLogic" defaultValue={safeJsonString(field.conditionalLogic)} rows={2} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs" />

                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 text-xs text-[var(--color-muted)]"><input type="checkbox" name="isRequired" defaultChecked={field.isRequired} />Verplicht</label>
                              <label className="flex items-center gap-2 text-xs text-[var(--color-muted)]"><input type="checkbox" name="isActive" defaultChecked={field.isActive} />Actief</label>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button type="submit" className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-semibold">Veld opslaan</button>
                              <button formAction={deleteFormFieldAction} className="rounded-full border border-[#ef4444] px-3 py-1 text-xs font-semibold text-[#b91c1c]">Veld verwijderen</button>
                              <button formAction={moveFormFieldAction} name="direction" value="up" className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-semibold">Omhoog</button>
                              <button formAction={moveFormFieldAction} name="direction" value="down" className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-semibold">Omlaag</button>
                              <input type="hidden" name="fieldId" value={field.id} />
                            </div>
                          </form>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </article>
            );
          })}
        </div>
      </details>
    </section>
  );
}
