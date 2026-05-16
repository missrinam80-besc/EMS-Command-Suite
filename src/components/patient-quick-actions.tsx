"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createPatientAction } from "@/app/(protected)/zorg/patienten/actions";

type QuickPatient = {
  id: string;
  fullName: string;
  citizenId: string;
};

type ModalKey = null | "new-patient" | "new-report";

type PatientQuickActionsProps = {
  patients: QuickPatient[];
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
          className="w-full max-w-2xl rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[0_30px_80px_rgba(4,28,44,0.28)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Snellink
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

export function PatientQuickActions({ patients }: PatientQuickActionsProps) {
  const [openModal, setOpenModal] = useState<ModalKey>(null);
  const [reportType, setReportType] = useState<"trauma" | "opname">("trauma");
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id ?? "");
  const router = useRouter();
  const activePatientId =
    patients.some((patient) => patient.id === selectedPatientId)
      ? selectedPatientId
      : (patients[0]?.id ?? "");

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

  function openReportFlow(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activePatientId) return;

    router.push(`/zorg/patienten/${activePatientId}/rapporten/${reportType}/nieuw`);
    setOpenModal(null);
  }

  return (
    <>
      <aside className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
          Snellinks
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
          Registreer of start een rapport
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
          Gebruik deze acties om snel een nieuw patiëntendossier aan te maken of direct
          door te gaan naar een nieuw rapport.
        </p>

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={() => setOpenModal("new-patient")}
            className="inline-flex justify-center rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
          >
            Nieuwe patiënt toevoegen
          </button>
          <button
            type="button"
            onClick={() => setOpenModal("new-report")}
            className="inline-flex justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
          >
            Nieuw rapport toevoegen
          </button>
        </div>
      </aside>

      {openModal === "new-patient" ? (
        <ModalShell title="Nieuwe patiënt toevoegen" onClose={() => setOpenModal(null)}>
          <form action={createPatientAction} className="grid gap-4">
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Volledige naam
              <input
                name="fullName"
                required
                minLength={3}
                placeholder="Bijv. Elias Van Hove"
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Citizenid
              <input
                name="citizenId"
                required
                minLength={1}
                placeholder="Bijv. CIT-30210"
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Geboortedatum
              <input
                type="date"
                name="birthDate"
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Telefoon
              <input
                name="phone"
                placeholder="Bijv. 0470 00 00 00"
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Notities
              <textarea
                name="notes"
                rows={4}
                placeholder="Allergieën, aandachtspunten of eerste context..."
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
              >
                Dossier aanmaken
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

      {openModal === "new-report" ? (
        <ModalShell title="Nieuw rapport toevoegen" onClose={() => setOpenModal(null)}>
          <form onSubmit={openReportFlow} className="grid gap-4">
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Patiënt
              <select
                value={activePatientId}
                onChange={(event) => setSelectedPatientId(event.target.value)}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              >
                {patients.length ? null : <option value="">Geen patiënt beschikbaar</option>}
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.fullName} · {patient.citizenId}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Rapporttype
              <select
                value={reportType}
                onChange={(event) => setReportType(event.target.value as "trauma" | "opname")}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              >
                <option value="trauma">Traumarapport</option>
                <option value="opname">Opnamerapport</option>
              </select>
            </label>
            <p className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-muted)]">
              Na bevestiging ga je direct naar het juiste rapportformulier.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={!activePatientId}
                className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Open rapportformulier
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
