"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PatientWorkspaceRow } from "@/lib/patients";

type PatientWorkspaceProps = {
  patients: PatientWorkspaceRow[];
};

function formatDateTime(date: string | null) {
  if (!date) return "Nog geen rapport";
  return new Date(date).toLocaleString("nl-BE");
}

export function PatientWorkspace({ patients }: PatientWorkspaceProps) {
  const [query, setQuery] = useState("");

  const filteredPatients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return patients;

    return patients.filter((patient) =>
      [patient.fullName, patient.citizenId, patient.phone ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [patients, query]);

  return (
    <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--color-ink)]">
            Patiëntenregister
          </h2>
        </div>

        <label className="flex w-full max-w-sm flex-col gap-2 text-sm text-[var(--color-muted)]">
          Zoek op naam, citizenid of telefoon
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Bijv. CIT-22014"
            className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
          />
        </label>
      </div>

      <div className="mt-6 overflow-x-auto rounded-[1.25rem] border border-[var(--color-line)]">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[1.35fr_0.8fr_1fr_0.9fr] gap-3 bg-[var(--color-surface-alt)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
            <span>Naam patiënt</span>
            <span>Aantal rapporten</span>
            <span>Datum laatste rapport</span>
            <span>Acties</span>
          </div>

          <div className="divide-y divide-[var(--color-line)] bg-[var(--color-surface)]">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="grid grid-cols-[1.35fr_0.8fr_1fr_0.9fr] gap-3 px-4 py-4 transition hover:bg-[var(--color-accent-wash)]"
              >
                <div className="text-left">
                  <span className="block font-semibold text-[var(--color-ink)]">
                    {patient.fullName}
                  </span>
                  <span className="mt-1 block text-sm text-[var(--color-muted)]">
                    {patient.citizenId}
                  </span>
                </div>
                <div className="text-sm font-medium text-[var(--color-ink)]">
                  {patient.reportCount}
                </div>
                <div className="text-sm text-[var(--color-muted)]">
                  {formatDateTime(patient.latestReportAt)}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/zorg/patienten/${patient.id}`}
                    className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
                  >
                    Dossier openen
                  </Link>
                </div>
              </div>
            ))}

            {!filteredPatients.length ? (
              <div className="px-4 py-6 text-sm text-[var(--color-muted)]">
                Geen patiënten gevonden voor deze zoekopdracht.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
