"use client";

import {
  createFormFieldAction,
  createFormTemplateAction,
  createReportTypeAction,
  deleteFormFieldAction,
  deleteFormTemplateAction,
  deleteReportTypeAction,
  updateFormFieldAction,
  updateFormTemplateAction,
  updateReportTypeAction,
} from "@/app/(protected)/beheer/actions";
import type { ManagedCatalogItem, ManagedFormField, ManagedFormTemplate } from "@/lib/admin";

type AdminReportFormBuilderProps = {
  reportTypes: ManagedCatalogItem[];
  templates: ManagedFormTemplate[];
  fields: ManagedFormField[];
};

const fieldTypes: ManagedFormField["fieldType"][] = [
  "text",
  "textarea",
  "number",
  "date",
  "datetime",
  "select",
  "multiselect",
  "checkbox",
  "radio",
];

const bindingSources = [
  { value: "custom", label: "Nieuw veld (custom)" },
  { value: "medical_reports", label: "Bestaand veld: medical_reports" },
  { value: "patients", label: "Bestaand veld: patients" },
  { value: "patient_cases", label: "Bestaand veld: patient_cases" },
] as const;

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

export function AdminReportFormBuilder({
  reportTypes,
  templates,
  fields,
}: AdminReportFormBuilderProps) {
  const fieldsByTemplate = new Map<string, ManagedFormField[]>();
  for (const field of fields) {
    const current = fieldsByTemplate.get(field.templateId) ?? [];
    fieldsByTemplate.set(field.templateId, [...current, field]);
  }

  return (
    <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
      <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
        Rapporten en formulieren
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">Builder</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
        Beheer template types op een plaats. Werk met secties, validaties en conditionele logica.
      </p>

      <details open className="mt-6 rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <summary className="cursor-pointer text-lg font-semibold text-[var(--color-ink)]">
          Rapporttypen beheren
        </summary>
        <form action={createReportTypeAction} className="mt-4 grid gap-3">
          <div className="grid gap-3 md:grid-cols-3">
            <input name="code" required placeholder="spoed_observatie" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
            <input name="label" required placeholder="Spoedobservatie" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
            <input name="colorHex" placeholder="#0f5f8f" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
          </div>
          <textarea name="description" rows={2} placeholder="Beschrijving" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <input type="checkbox" name="isActive" defaultChecked />
              Actief
            </label>
            <button type="submit" className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold">
              Rapporttype aanmaken
            </button>
          </div>
        </form>

        <div className="mt-4 grid gap-3">
          {reportTypes.map((type) => (
            <article key={type.id} className="rounded-xl border border-[var(--color-line)] bg-white p-4">
              <form action={updateReportTypeAction} className="grid gap-3">
                <input type="hidden" name="id" value={type.id} />
                <div className="grid gap-3 md:grid-cols-3">
                  <input readOnly value={type.code} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm" />
                  <input name="label" defaultValue={type.label} className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
                  <input name="colorHex" defaultValue={type.colorHex ?? ""} className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
                </div>
                <textarea name="description" rows={2} defaultValue={type.description ?? ""} className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                    <input type="checkbox" name="isActive" defaultChecked={type.isActive} />
                    Actief
                  </label>
                  <button type="submit" className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold">
                    Opslaan
                  </button>
                </div>
              </form>
              {!type.isSystem ? (
                <form action={deleteReportTypeAction} className="mt-2">
                  <input type="hidden" name="id" value={type.id} />
                  <button type="submit" className="rounded-full border border-[#ef4444] px-4 py-2 text-sm font-semibold text-[#b91c1c]">
                    Verwijderen
                  </button>
                </form>
              ) : null}
            </article>
          ))}
        </div>
      </details>

      <details open className="mt-4 rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <summary className="cursor-pointer text-lg font-semibold text-[var(--color-ink)]">
          Template types beheren (formulier + rapport)
        </summary>

        <form action={createFormTemplateAction} className="mt-4 grid gap-3">
          <div className="grid gap-3 md:grid-cols-3">
            <input name="code" required placeholder="medicatie_registratie" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
            <input name="label" required placeholder="Medicatieregistratie" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
            <select name="templateKind" defaultValue="form" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm">
              <option value="form">Formulier</option>
              <option value="report">Rapport</option>
            </select>
          </div>
          <select name="reportTypeCode" defaultValue="" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm">
            <option value="">Geen rapporttype gekoppeld</option>
            {reportTypes.map((type) => (
              <option key={type.id} value={type.code}>
                {type.label} ({type.code})
              </option>
            ))}
          </select>
          <textarea name="description" rows={2} placeholder="Beschrijving" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <input type="checkbox" name="isActive" defaultChecked />
              Actief
            </label>
            <button type="submit" className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold">
              Template aanmaken
            </button>
          </div>
        </form>
      </details>

      <details open className="mt-4 rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <summary className="cursor-pointer text-lg font-semibold text-[var(--color-ink)]">
          Builder: velden toevoegen en bewerken
        </summary>

        <form action={createFormFieldAction} className="mt-4 grid gap-3">
          <div className="grid gap-3 md:grid-cols-3">
            <select name="templateId" required defaultValue="" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm">
              <option value="">Kies template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.label} ({template.code})
                </option>
              ))}
            </select>
            <input name="fieldKey" required placeholder="klinische_status" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
            <input name="label" required placeholder="Klinische status" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <select name="fieldType" defaultValue="text" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm">
              {fieldTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select name="bindingSource" defaultValue="custom" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm">
              {bindingSources.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
            <input
              name="bindingColumn"
              list="known-db-columns"
              placeholder="bv. medical_reports.summary"
              className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm"
            />
          </div>
          <input name="sectionKey" defaultValue="general" placeholder="Sectie key (bv. intake)" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
          <input name="placeholder" placeholder="Placeholder" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
          <textarea name="helpText" rows={2} placeholder="Hulptekst" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
          <textarea name="options" rows={3} placeholder="Meerkeuzeopties (1 per lijn)" className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
          <textarea name="validationRules" rows={2} defaultValue="{}" placeholder='Validatie JSON, bv. {"min":1,"max":10}' className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
          <textarea name="conditionalLogic" rows={2} defaultValue="{}" placeholder='Conditional JSON, bv. {"when":{"field":"prioriteit","equals":"P1"}}' className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
          <div className="grid gap-3 md:grid-cols-3">
            <input type="number" name="sortOrder" defaultValue={100} className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <input type="checkbox" name="isRequired" />
              Verplicht
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <input type="checkbox" name="isActive" defaultChecked />
              Actief
            </label>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold">
              Veld aanmaken
            </button>
          </div>
        </form>
        <datalist id="known-db-columns">
          {knownDatabaseColumns.map((column) => (
            <option key={column} value={column} />
          ))}
        </datalist>

        <div className="mt-5 grid gap-4">
          {templates.map((template) => {
            const templateFields = fieldsByTemplate.get(template.id) ?? [];
            return (
              <article key={template.id} className="rounded-xl border border-[var(--color-line)] bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-[var(--color-ink)]">
                    {template.label} ({template.code}) · {template.templateKind}
                  </h3>
                </div>
                <form action={updateFormTemplateAction} className="mt-3 grid gap-2">
                  <input type="hidden" name="id" value={template.id} />
                  <input name="label" defaultValue={template.label} className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
                  <select name="templateKind" defaultValue={template.templateKind} className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm">
                    <option value="form">Formulier</option>
                    <option value="report">Rapport</option>
                  </select>
                  <select name="reportTypeCode" defaultValue={template.reportTypeCode ?? ""} className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm">
                    <option value="">Geen rapporttype gekoppeld</option>
                    {reportTypes.map((type) => (
                      <option key={type.id} value={type.code}>
                        {type.label} ({type.code})
                      </option>
                    ))}
                  </select>
                  <textarea name="description" rows={2} defaultValue={template.description ?? ""} className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
                  <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                    <input type="checkbox" name="isActive" defaultChecked={template.isActive} />
                    Actief
                  </label>
                  <div className="flex gap-2">
                    <button type="submit" className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold">
                      Template opslaan
                    </button>
                    {!template.isSystem ? (
                      <button formAction={deleteFormTemplateAction} className="rounded-full border border-[#ef4444] px-4 py-2 text-sm font-semibold text-[#b91c1c]">
                        Template verwijderen
                      </button>
                    ) : null}
                  </div>
                </form>

                <div className="mt-4 grid gap-3">
                  {templateFields.length ? (
                    templateFields.map((field) => (
                      <form key={field.id} action={updateFormFieldAction} className="grid gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
                        <input type="hidden" name="id" value={field.id} />
                        <div className="grid gap-2 md:grid-cols-3">
                          <input readOnly value={field.fieldKey} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs" />
                          <input name="label" defaultValue={field.label} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs" />
                          <input type="number" name="sortOrder" defaultValue={field.sortOrder} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs" />
                        </div>
                        <input name="sectionKey" defaultValue={field.sectionKey} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs" />
                        <select name="fieldType" defaultValue={field.fieldType} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs">
                          {fieldTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        <div className="grid gap-2 md:grid-cols-2">
                          <select name="bindingSource" defaultValue={field.bindingSource} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs">
                            {bindingSources.map((source) => (
                              <option key={source.value} value={source.value}>
                                {source.label}
                              </option>
                            ))}
                          </select>
                          <input
                            name="bindingColumn"
                            list="known-db-columns"
                            defaultValue={field.bindingColumn ?? ""}
                            placeholder="Kolomnaam (bij binding)"
                            className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs"
                          />
                        </div>
                        <textarea name="placeholder" defaultValue={field.placeholder ?? ""} rows={1} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs" />
                        <textarea name="helpText" defaultValue={field.helpText ?? ""} rows={1} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs" />
                        <textarea name="options" defaultValue={field.options.join("\n")} rows={2} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs" />
                        <textarea name="validationRules" defaultValue={JSON.stringify(field.validationRules)} rows={2} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs" />
                        <textarea name="conditionalLogic" defaultValue={JSON.stringify(field.conditionalLogic)} rows={2} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-xs" />
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                            <input type="checkbox" name="isRequired" defaultChecked={field.isRequired} />
                            Verplicht
                          </label>
                          <label className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                            <input type="checkbox" name="isActive" defaultChecked={field.isActive} />
                            Actief
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-semibold">
                            Veld opslaan
                          </button>
                          <button formAction={deleteFormFieldAction} className="rounded-full border border-[#ef4444] px-3 py-1 text-xs font-semibold text-[#b91c1c]">
                            Veld verwijderen
                          </button>
                        </div>
                      </form>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--color-muted)]">Nog geen velden gekoppeld.</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </details>
    </section>
  );
}
