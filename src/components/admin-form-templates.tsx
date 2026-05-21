"use client";

import { useMemo } from "react";
import {
  createFormFieldAction,
  createFormTemplateAction,
} from "@/app/(protected)/beheer/actions";
import type { ManagedCatalogItem, ManagedFormField, ManagedFormTemplate } from "@/lib/admin";

type AdminFormTemplatesProps = {
  templates: ManagedFormTemplate[];
  fields: ManagedFormField[];
  reportTypes: ManagedCatalogItem[];
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

export function AdminFormTemplates({
  templates,
  fields,
  reportTypes,
}: AdminFormTemplatesProps) {
  const fieldsPerTemplate = useMemo(() => {
    const map = new Map<string, ManagedFormField[]>();
    for (const field of fields) {
      const current = map.get(field.templateId) ?? [];
      map.set(field.templateId, [...current, field]);
    }
    return map;
  }, [fields]);

  return (
    <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
      <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
        Formulierbeheer
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
        Formulieren en invulvelden
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
        Maak hier formulieren aan en koppel invulvelden. Elke wijziging wordt via audit logging
        geregistreerd.
      </p>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <form action={createFormTemplateAction} className="grid gap-4 rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <h3 className="text-lg font-semibold text-[var(--color-ink)]">Nieuw formulier</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Code
              <input
                name="code"
                required
                placeholder="medicatie_registratie"
                className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Label
              <input
                name="label"
                required
                placeholder="Medicatieregistratie"
                className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)]"
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm text-[var(--color-muted)]">
            Gekoppeld rapporttype (optioneel)
            <select
              name="reportTypeCode"
              defaultValue=""
              className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)]"
            >
              <option value="">Geen koppeling</option>
              {reportTypes.map((type) => (
                <option key={type.id} value={type.code}>
                  {type.label} ({type.code})
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-[var(--color-muted)]">
            Beschrijving
            <textarea
              name="description"
              rows={3}
              className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)]"
            />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-ink)]">
            <input type="checkbox" name="isActive" defaultChecked />
            Actief
          </label>
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
            >
              Formulier aanmaken
            </button>
          </div>
        </form>

        <form action={createFormFieldAction} className="grid gap-4 rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <h3 className="text-lg font-semibold text-[var(--color-ink)]">Nieuw invulveld</h3>
          <label className="grid gap-2 text-sm text-[var(--color-muted)]">
            Formulier
            <select
              name="templateId"
              required
              defaultValue=""
              className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)]"
            >
              <option value="">Kies formulier</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.label} ({template.code})
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Field key
              <input
                name="fieldKey"
                required
                placeholder="medicatie_naam"
                className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Label
              <input
                name="label"
                required
                placeholder="Naam medicatie"
                className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)]"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Veldtype
              <select
                name="fieldType"
                required
                defaultValue="text"
                className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)]"
              >
                {fieldTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Volgorde
              <input
                type="number"
                name="sortOrder"
                defaultValue={100}
                className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)]"
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm text-[var(--color-muted)]">
            Placeholder
            <input
              name="placeholder"
              className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)]"
            />
          </label>
          <label className="grid gap-2 text-sm text-[var(--color-muted)]">
            Hulptekst
            <textarea
              name="helpText"
              rows={2}
              className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)]"
            />
          </label>
          <label className="grid gap-2 text-sm text-[var(--color-muted)]">
            Select-opties (1 per lijn)
            <textarea
              name="options"
              rows={3}
              className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)]"
            />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-ink)]">
              <input type="checkbox" name="isRequired" />
              Verplicht veld
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm text-[var(--color-ink)]">
              <input type="checkbox" name="isActive" defaultChecked />
              Actief
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
            >
              Veld aanmaken
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 grid gap-4">
        {templates.map((template) => {
          const templateFields = fieldsPerTemplate.get(template.id) ?? [];
          return (
            <article
              key={template.id}
              className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-ink)]">{template.label}</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    {template.code}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink)]">
                    {template.fieldCount} velden
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                      template.isActive ? "bg-[#ddf7e5] text-[#1f7a3a]" : "bg-[#e5e7eb] text-[#374151]"
                    }`}
                  >
                    {template.isActive ? "Actief" : "Inactief"}
                  </span>
                </div>
              </div>
              {template.description ? (
                <p className="mt-3 text-sm text-[var(--color-muted)]">{template.description}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {templateFields.length ? (
                  templateFields.map((field) => (
                    <span
                      key={field.id}
                      className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink)]"
                    >
                      {field.label} · {field.fieldType}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[var(--color-muted)]">
                    Nog geen velden gekoppeld.
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

