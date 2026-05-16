"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  deletePatientAction,
  updatePatientProfileAction,
} from "@/app/(protected)/zorg/patienten/actions";
import type { Patient } from "@/types/domain";

type PatientDetailActionsProps = {
  patient: Patient;
};

type ModalKey = null | "edit" | "delete";

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
          className="w-full max-w-3xl rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[0_30px_80px_rgba(4,28,44,0.28)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Fichebeheer
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

function splitList(values?: string[] | null) {
  return values?.length ? values.join("\n") : "";
}

export function PatientDetailActions({ patient }: PatientDetailActionsProps) {
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

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setOpenModal("edit")}
          className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
        >
          Patiëntgegevens aanpassen
        </button>
      </div>

      <div className="mt-8 border-t border-[var(--color-line)] pt-6">
        <button
          type="button"
          onClick={() => setOpenModal("delete")}
          className="rounded-full border border-[#8e1f35] px-5 py-3 text-sm font-semibold text-[#8e1f35] transition hover:bg-[#ffe4e8]"
        >
          Volledige patiënt verwijderen
        </button>
      </div>

      {openModal === "edit" ? (
        <ModalShell title="Patiëntgegevens aanpassen" onClose={() => setOpenModal(null)}>
          <form action={updatePatientProfileAction} className="grid gap-4">
            <input type="hidden" name="patientId" value={patient.id} />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Naam
                <input
                  name="fullName"
                  required
                  minLength={3}
                  defaultValue={patient.fullName}
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                ID
                <input
                  name="citizenId"
                  required
                  defaultValue={patient.citizenId}
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Geboortedatum
                <input
                  type="date"
                  name="birthDate"
                  defaultValue={patient.birthDate ?? ""}
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Telefoon
                <input
                  name="phone"
                  defaultValue={patient.phone ?? ""}
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Noodcontact naam
                <input
                  name="emergencyContactName"
                  defaultValue={patient.emergencyContactName ?? ""}
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Noodcontact telefoon
                <input
                  name="emergencyContactPhone"
                  defaultValue={patient.emergencyContactPhone ?? ""}
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Bloedgroep
                <input
                  name="bloodType"
                  defaultValue={patient.bloodType ?? ""}
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Status
                <select
                  name="status"
                  defaultValue={patient.status ?? "observatie"}
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                >
                  <option value="actief_in_behandeling">Actief in behandeling</option>
                  <option value="opgenomen">Opgenomen</option>
                  <option value="observatie">Observatie</option>
                  <option value="stabiel_ontslagen">Stabiel / ontslagen</option>
                  <option value="overleden">Overleden</option>
                  <option value="forensisch_politie">Forensisch / politie</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Allergieën
                <textarea
                  name="allergies"
                  rows={3}
                  defaultValue={splitList(patient.allergies)}
                  placeholder="Eén item per lijn"
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Medicatie
                <textarea
                  name="medications"
                  rows={3}
                  defaultValue={splitList(patient.medications)}
                  placeholder="Eén item per lijn"
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Chronische aandoeningen
                <textarea
                  name="chronicConditions"
                  rows={3}
                  defaultValue={splitList(patient.chronicConditions)}
                  placeholder="Eén item per lijn"
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Medische waarschuwingen
                <textarea
                  name="medicalWarnings"
                  rows={3}
                  defaultValue={splitList(patient.medicalWarnings)}
                  placeholder="Eén item per lijn"
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Waarschuwingsbadges
                <textarea
                  name="warningBadges"
                  rows={3}
                  defaultValue={splitList(patient.warningBadges)}
                  placeholder="Eén item per lijn, bijvoorbeeld ALLERGIE"
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
              >
                Gegevens opslaan
              </button>
              <button
                type="button"
                onClick={() => setOpenModal(null)}
                className="rounded-full border border-[var(--color-line)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
              >
                Annuleren
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {openModal === "delete" ? (
        <ModalShell title="Patiëntenfiche verwijderen" onClose={() => setOpenModal(null)}>
          <form action={deletePatientAction} className="grid gap-4">
            <input type="hidden" name="patientId" value={patient.id} />
            <p className="text-sm leading-6 text-[var(--color-muted)]">
              Ben je zeker dat je deze patiëntenfiche wil verwijderen? Deze actie verwijdert
              ook gekoppelde cases, rapporten en auditgegevens uit de demo-omgeving.
            </p>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Typ <span className="font-semibold text-[var(--color-ink)]">VERWIJDER</span> om te bevestigen
              <input
                name="confirmDelete"
                required
                pattern="VERWIJDER"
                className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[#8e1f35]"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-full border border-[#8e1f35] bg-[#ffe4e8] px-5 py-3 text-sm font-semibold text-[#8e1f35] transition hover:brightness-95"
              >
                Ja, verwijder deze fiche
              </button>
              <button
                type="button"
                onClick={() => setOpenModal(null)}
                className="rounded-full border border-[var(--color-line)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
              >
                Annuleren
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </>
  );
}
