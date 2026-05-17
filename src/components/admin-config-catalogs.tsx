"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  createPatientStatusAction,
  createReportTypeAction,
  createWarningBadgeAction,
  updatePatientStatusAction,
  updateReportTypeAction,
  updateWarningBadgeAction,
} from "@/app/(protected)/beheer/actions";
import type { ManagedCatalogItem } from "@/lib/admin";

type CatalogKind = "report-types" | "warning-badges" | "patient-statuses";
type ModalKey =
  | null
  | `create:${CatalogKind}`
  | `view:${CatalogKind}:${string}`
  | `edit:${CatalogKind}:${string}`;

type CatalogDescriptor = {
  kind: CatalogKind;
  title: string;
  subtitle: string;
  items: ManagedCatalogItem[];
};

type AdminConfigCatalogsProps = {
  reportTypes: ManagedCatalogItem[];
  warningBadges: ManagedCatalogItem[];
  patientStatuses: ManagedCatalogItem[];
};

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-[#061521]/55 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex min-h-[calc(100vh-3rem)] items-start justify-center pt-8 md:items-center md:pt-0">
        <div
          role="dialog"
          aria-modal="true"
          className="w-full max-w-4xl rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[0_30px_80px_rgba(4,28,44,0.28)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Configuratie
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">{title}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[var(--color-line)] px-3 py-1 text-sm text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
            >
              Sluiten
            </button>
          </div>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function getCreateAction(kind: CatalogKind) {
  switch (kind) {
    case "report-types":
      return createReportTypeAction;
    case "warning-badges":
      return createWarningBadgeAction;
    case "patient-statuses":
      return createPatientStatusAction;
  }
}

function getUpdateAction(kind: CatalogKind) {
  switch (kind) {
    case "report-types":
      return updateReportTypeAction;
    case "warning-badges":
      return updateWarningBadgeAction;
    case "patient-statuses":
      return updatePatientStatusAction;
  }
}

function itemDescription(kind: CatalogKind, item: ManagedCatalogItem) {
  if (kind === "report-types") {
    return item.description || "Geen extra beschrijving ingesteld.";
  }
  return item.colorHex || "Geen kleur ingesteld.";
}

export function AdminConfigCatalogs({
  reportTypes,
  warningBadges,
  patientStatuses,
}: AdminConfigCatalogsProps) {
  const [openModal, setOpenModal] = useState<ModalKey>(null);

  useEffect(() => {
    if (!openModal) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenModal(null);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [openModal]);

  const catalogs = useMemo<CatalogDescriptor[]>(
    () => [
      {
        kind: "report-types",
        title: "Rapporttypen",
        subtitle: "Beheer medische formuliertypen en hun zichtbaarheid.",
        items: reportTypes,
      },
      {
        kind: "warning-badges",
        title: "Tags en badges",
        subtitle: "Beheer waarschuwingsbadges voor medische dossiers.",
        items: warningBadges,
      },
      {
        kind: "patient-statuses",
        title: "Patiëntstatussen",
        subtitle: "Beheer de statuslabels die op patiëntfiches zichtbaar zijn.",
        items: patientStatuses,
      },
    ],
    [patientStatuses, reportTypes, warningBadges],
  );

  const modalParts = openModal?.split(":");
  const selectedKind = (modalParts?.[1] as CatalogKind | undefined) ?? null;
  const selectedId = modalParts?.[2] ?? null;
  const selectedCatalog = catalogs.find((catalog) => catalog.kind === selectedKind) ?? null;
  const selectedItem =
    selectedCatalog && selectedId
      ? selectedCatalog.items.find((item) => item.id === selectedId) ?? null
      : null;

  return (
    <>
      <section className="grid gap-6 xl:grid-cols-3">
        {catalogs.map((catalog) => (
          <section
            key={catalog.kind}
            className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Configuratie
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
              {catalog.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
              {catalog.subtitle}
            </p>

            <div className="mt-5 space-y-3">
              {catalog.items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-[var(--color-ink)]">{item.label}</h3>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        {item.code}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                        item.isActive
                          ? "bg-[#ddf7e5] text-[#1f7a3a]"
                          : "bg-[#e5e7eb] text-[#374151]"
                      }`}
                    >
                      {item.isActive ? "Actief" : "Inactief"}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenModal(`view:${catalog.kind}:${item.id}`)}
                      className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
                    >
                      Snelle weergave
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpenModal(`edit:${catalog.kind}:${item.id}`)}
                      className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
                    >
                      Bewerken
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setOpenModal(`create:${catalog.kind}`)}
              className="mt-5 rounded-full border border-[var(--color-line)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
            >
              Nieuw item aanmaken
            </button>
          </section>
        ))}
      </section>

      {selectedCatalog && openModal === `create:${selectedCatalog.kind}` ? (
        <ModalShell title={`Nieuw item · ${selectedCatalog.title}`} onClose={() => setOpenModal(null)}>
          <form action={getCreateAction(selectedCatalog.kind)} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Code
                <input
                  name="code"
                  required
                  className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Label
                <input
                  name="label"
                  required
                  className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)]"
                />
              </label>
            </div>
            {selectedCatalog.kind === "report-types" ? (
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Beschrijving
                <textarea
                  name="description"
                  rows={3}
                  className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)]"
                />
              </label>
            ) : null}
            <div className="grid gap-4 md:grid-cols-[1fr_120px_auto] md:items-end">
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Kleur
                <input
                  name="colorHex"
                  placeholder="#52d2ff"
                  className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Volgorde
                <input
                  type="number"
                  name="sortOrder"
                  defaultValue={100}
                  className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)]"
                />
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-ink)]">
                <input type="checkbox" name="isActive" defaultChecked />
                Actief
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpenModal(null)}
                className="rounded-full border border-[var(--color-line)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
              >
                Annuleer
              </button>
              <button
                type="submit"
                className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
              >
                Opslaan
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {selectedCatalog && selectedItem && openModal === `view:${selectedCatalog.kind}:${selectedItem.id}` ? (
        <ModalShell title={`Snelle weergave · ${selectedItem.label}`} onClose={() => setOpenModal(null)}>
          <div className="grid gap-4">
            <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink)]">
                  {selectedItem.code}
                </span>
                {selectedItem.isSystem ? (
                  <span className="rounded-full bg-[#efeaff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#5f43b2]">
                    Systeem
                  </span>
                ) : null}
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                    selectedItem.isActive
                      ? "bg-[#ddf7e5] text-[#1f7a3a]"
                      : "bg-[#e5e7eb] text-[#374151]"
                  }`}
                >
                  {selectedItem.isActive ? "Actief" : "Inactief"}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">
                {itemDescription(selectedCatalog.kind, selectedItem)}
              </p>
              <p className="mt-4 text-sm text-[var(--color-muted)]">
                Sorteervolgorde: {selectedItem.sortOrder}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpenModal(null)}
                className="rounded-full border border-[var(--color-line)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
              >
                Annuleer
              </button>
              <button
                type="button"
                onClick={() => setOpenModal(`edit:${selectedCatalog.kind}:${selectedItem.id}`)}
                className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
              >
                Bewerken
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {selectedCatalog && selectedItem && openModal === `edit:${selectedCatalog.kind}:${selectedItem.id}` ? (
        <ModalShell title={`Bewerken · ${selectedItem.label}`} onClose={() => setOpenModal(null)}>
          <form action={getUpdateAction(selectedCatalog.kind)} className="grid gap-4">
            <input type="hidden" name="id" value={selectedItem.id} />
            <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-muted)]">
              Code: <span className="font-semibold text-[var(--color-ink)]">{selectedItem.code}</span>
            </div>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Label
              <input
                name="label"
                defaultValue={selectedItem.label}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)]"
              />
            </label>
            {selectedCatalog.kind === "report-types" ? (
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Beschrijving
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={selectedItem.description ?? ""}
                  className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)]"
                />
              </label>
            ) : null}
            <div className="grid gap-4 md:grid-cols-[1fr_120px_auto] md:items-end">
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Kleur
                <input
                  name="colorHex"
                  defaultValue={selectedItem.colorHex ?? ""}
                  className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Volgorde
                <input
                  type="number"
                  name="sortOrder"
                  defaultValue={selectedItem.sortOrder}
                  className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)]"
                />
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-ink)]">
                <input type="checkbox" name="isActive" defaultChecked={selectedItem.isActive} />
                Actief
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpenModal(null)}
                className="rounded-full border border-[var(--color-line)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
              >
                Annuleer
              </button>
              <button
                type="submit"
                className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
              >
                Opslaan
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </>
  );
}
