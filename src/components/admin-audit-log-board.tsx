"use client";

import { useMemo, useState } from "react";
import type { AdminAuditLogRow } from "@/lib/admin";

type AdminAuditLogBoardProps = {
  logs: AdminAuditLogRow[];
};

function getActionLabel(action: string) {
  switch (action) {
    case "profile_created":
      return "Gebruiker aangemaakt";
    case "profile_updated":
      return "Gebruiker bijgewerkt";
    case "profile_permissions_updated":
      return "Directe rechten bijgewerkt";
    case "rank_permissions_updated":
      return "Rechtengroep bijgewerkt";
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

function getActionClass(action: string) {
  switch (action) {
    case "profile_created":
      return "bg-[#ddf7e5] text-[#1f7a3a]";
    case "profile_updated":
    case "profile_permissions_updated":
    case "rank_permissions_updated":
      return "bg-[#dff6ff] text-[#0f5f8f]";
    case "patient_deleted":
      return "bg-[#ffe3e3] text-[#9b2020]";
    case "report_created":
      return "bg-[#fff1db] text-[#9a5b00]";
    case "report_updated":
      return "bg-[#ffe8d5] text-[#a14f00]";
    case "case_created":
      return "bg-[#efeaff] text-[#5f43b2]";
    case "case_updated":
      return "bg-[#e9f2ff] text-[#2d5c9c]";
    default:
      return "bg-[var(--color-surface-alt)] text-[var(--color-ink)]";
  }
}

function getTargetTypeLabel(targetType: string) {
  switch (targetType) {
    case "profile":
      return "Gebruiker";
    case "profile_permissions":
      return "Gebruikersrechten";
    case "rank_permissions":
      return "Rechtengroep";
    case "patient":
      return "Patiënt";
    case "patient_case":
      return "Case";
    case "medical_report":
      return "Rapport";
    default:
      return targetType;
  }
}

export function AdminAuditLogBoard({ logs }: AdminAuditLogBoardProps) {
  const [query, setQuery] = useState("");

  const filteredLogs = useMemo(() => {
    return logs.filter((entry) => {
      const haystack = [
        entry.summary,
        entry.targetType,
        entry.targetLabel ?? "",
        entry.actorName ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return !query.trim() || haystack.includes(query.trim().toLowerCase());
    });
  }, [logs, query]);

  return (
    <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Auditlog
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
            Beheeracties en operationele wijzigingen
          </h2>
        </div>

        <label className="grid gap-2 text-sm text-[var(--color-muted)]">
          Zoek
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Gebruiker, target of samenvatting"
            className="min-w-[240px] rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
          />
        </label>
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
                      {entry.targetLabel || getTargetTypeLabel(entry.targetType)}
                    </h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getActionClass(entry.action)}`}
                    >
                      {getActionLabel(entry.action)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">{entry.summary}</p>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">
                    Type: {getTargetTypeLabel(entry.targetType)} · Door{" "}
                    {entry.actorName || entry.actorProfileId || "Onbekend"} op{" "}
                    {new Date(entry.createdAt).toLocaleString("nl-BE")}
                  </p>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--color-line)] px-4 py-6 text-sm text-[var(--color-muted)]">
            Geen auditlog-items gevonden voor deze zoekopdracht.
          </div>
        )}
      </div>
    </section>
  );
}
