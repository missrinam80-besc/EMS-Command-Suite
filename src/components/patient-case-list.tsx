"use client";

import Link from "next/link";
import type { PatientCase } from "@/types/domain";

type PatientCaseListProps = {
  patientId: string;
  cases: PatientCase[];
};

function getCaseStatusClass(status: string) {
  switch (status) {
    case "open":
      return "bg-[#ddf7e5] text-[#1f7a3a]";
    case "afgesloten":
      return "bg-[#ffe3e3] text-[#9b2020]";
    case "in_onderzoek":
      return "bg-[#efeaff] text-[#5f43b2]";
    case "in_wacht":
      return "bg-[#fff7cc] text-[#8a6b00]";
    default:
      return "bg-[#e5e7eb] text-[#3f4652]";
  }
}

function getCaseStatusLabel(status: string) {
  switch (status) {
    case "open":
      return "Open";
    case "afgesloten":
      return "Gesloten";
    case "gearchiveerd":
      return "Gearchiveerd";
    case "in_onderzoek":
      return "In onderzoek";
    case "in_wacht":
      return "In wacht";
    default:
      return status;
  }
}

export function PatientCaseList({ patientId, cases }: PatientCaseListProps) {
  return (
    <div className="mt-6 grid gap-4">
      {cases.length ? (
        cases.map((patientCase) => (
          <article
            key={patientCase.id}
            className="rounded-2xl border border-[var(--color-line)] bg-white px-5 py-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-[var(--color-ink)]">
                    {patientCase.title}
                  </h3>
                  <span className="rounded-full border border-[#d1c3f7] bg-[#efeaff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#5f43b2]">
                    case
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getCaseStatusClass(patientCase.status)}`}
                  >
                    {getCaseStatusLabel(patientCase.status)}
                  </span>
                </div>
                {patientCase.summary ? (
                  <p className="mt-2 text-sm text-[var(--color-muted)]">{patientCase.summary}</p>
                ) : null}
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  Geopend op {new Date(patientCase.openedAt).toLocaleString("nl-BE")}
                </p>
              </div>

              <Link
                href={`/zorg/patienten/${patientId}/cases/${patientCase.id}`}
                className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
              >
                Open
              </Link>
            </div>
          </article>
        ))
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-line)] px-4 py-6 text-sm text-[var(--color-muted)]">
          Nog geen cases voor deze patiënt.
        </div>
      )}
    </div>
  );
}
