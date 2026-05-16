"use client";

import { useMemo, useState } from "react";
import type { PatientAuditLogRow } from "@/lib/patients";

type PatientAuditLogBoardProps = {
  logs: PatientAuditLogRow[];
};

function getActionLabel(action: PatientAuditLogRow["action"]) {
  switch (action) {
    case "patient_created":
      return "Patiënt aangemaakt";
    case "patient_updated":
      return "Patiënt bijgewerkt";
    case "patient_deleted":
      return "Patiënt gedeactiveerd";
    case "notes_updated":
      return "Notities bijgewerkt";
    case "case_created":
      return "Case aangemaakt";
    case "case_updated":
      return "Case bijgewerkt";
    case "report_created":
      return "Rapport aangemaakt";
    case "report_updated":
      return "Rapport bijgewerkt";
    default:
      return action;
  }
}

function getActionClass(action: PatientAuditLogRow["action"]) {
  switch (action) {
    case "patient_created":
      return "bg-[#ddf7e5] text-[#1f7a3a]";
    case "patient_updated":
    case "notes_updated":
      return "bg-[#dff6ff] text-[#0f5f8f]";
    case "patient_deleted":
      return "bg-[#ffe3e3] text-[#9b2020]";
    case "case_created":
      return "bg-[#efeaff] text-[#5f43b2]";
    case "case_updated":
      return "bg-[#e9f2ff] text-[#2d5c9c]";
    case "report_created":
      return "bg-[#fff1db] text-[#9a5b00]";
    case "report_updated":
      return "bg-[#ffe8d5] text-[#a14f00]";
    default:
      return "bg-[var(--color-surface-alt)] text-[var(--color-ink)]";
  }
}

export function PatientAuditLogBoard({ logs }: PatientAuditLogBoardProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"alles" | PatientAuditLogRow["action"]>("alles");

  const filteredLogs = useMemo(() => {
    return logs.filter((entry) => {
      const matchesFilter = filter === "alles" || entry.action === filter;
      const haystack = [
        entry.patientName,
        entry.patientCitizenId,
        entry.actorName ?? "",
        entry.summary,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [logs, filter, query]);

  return (
    <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Auditlog
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
            Patiëntfiches en medische acties
          </h2>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <label className="grid gap-2 text-sm text-[var(--color-muted)]">
            Zoek
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Patiënt, actor of samenvatting"
              className="min-w-[240px] rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
            />
          </label>
          <label className="grid gap-2 text-sm text-[var(--color-muted)]">
            Filter
            <select
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value as "alles" | PatientAuditLogRow["action"])
              }
              className="min-w-[220px] rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
            >
              <option value="alles">Alle acties</option>
              <option value="patient_created">Patiënt aangemaakt</option>
              <option value="patient_updated">Patiënt bijgewerkt</option>
              <option value="patient_deleted">Patiënt gedeactiveerd</option>
              <option value="notes_updated">Notities bijgewerkt</option>
              <option value="case_created">Case aangemaakt</option>
              <option value="case_updated">Case bijgewerkt</option>
              <option value="report_created">Rapport aangemaakt</option>
              <option value="report_updated">Rapport bijgewerkt</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {filteredLogs.length ? (
          filteredLogs.map((entry) => (
            <article
              key={entry.id}
              className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-[var(--color-ink)]">
                      {entry.patientName}
                    </h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getActionClass(entry.action)}`}
                    >
                      {getActionLabel(entry.action)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">
                    {entry.patientCitizenId} · {entry.summary}
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">
                    Door {entry.actorName || entry.actorProfileId} op{" "}
                    {new Date(entry.createdAt).toLocaleString("nl-BE")}
                  </p>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--color-line)] px-4 py-6 text-sm text-[var(--color-muted)]">
            Geen auditlog-items gevonden voor deze filter.
          </div>
        )}
      </div>
    </section>
  );
}
