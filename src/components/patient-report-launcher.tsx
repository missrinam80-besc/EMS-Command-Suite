"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PatientReportLauncherProps = {
  patientId: string;
};

export function PatientReportLauncher({ patientId }: PatientReportLauncherProps) {
  const [reportType, setReportType] = useState<"trauma" | "opname">("trauma");
  const router = useRouter();

  function openReportForm() {
    router.push(`/zorg/patienten/${patientId}/rapporten/${reportType}/nieuw`);
  }

  return (
    <div className="mt-4 flex flex-wrap items-end gap-3">
      <label className="grid min-w-[220px] gap-2 text-sm text-[var(--color-muted)]">
        Type rapport
        <select
          value={reportType}
          onChange={(event) => setReportType(event.target.value as "trauma" | "opname")}
          className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
        >
          <option value="trauma">Traumarapport</option>
          <option value="opname">Opnamerapport</option>
        </select>
      </label>
      <button
        type="button"
        onClick={openReportForm}
        className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
      >
        Nieuw rapport aanmaken
      </button>
    </div>
  );
}
