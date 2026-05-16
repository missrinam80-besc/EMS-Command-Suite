import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getPatientCaseDetail, getPatientDetail } from "@/lib/patients";

type PatientCasePageProps = {
  params: Promise<{ patientId: string; caseId: string }>;
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

export default async function PatientCasePage({ params }: PatientCasePageProps) {
  await requirePermission("cases.read");

  const { patientId, caseId } = await params;
  const [patient, patientCase] = await Promise.all([
    getPatientDetail(patientId),
    getPatientCaseDetail(patientId, caseId),
  ]);

  if (!patient || !patientCase) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8 md:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">Case</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
            {patientCase.title}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {patient.fullName} · {patient.citizenId}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/zorg/patienten/${patient.id}/cases/${patientCase.id}/bewerken`}
            className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
          >
            Case bewerken
          </Link>
          <Link
            href={`/zorg/patienten/${patient.id}`}
            className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
          >
            Terug naar patiënt
          </Link>
        </div>
      </div>

      <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-[#d1c3f7] bg-[#efeaff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#5f43b2]">
            case
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getCaseStatusClass(patientCase.status)}`}
          >
            {getCaseStatusLabel(patientCase.status)}
          </span>
        </div>

        <div className="mt-6 grid gap-4">
          <div className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Geopend op
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
              {new Date(patientCase.openedAt).toLocaleString("nl-BE")}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Samenvatting
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
              {patientCase.summary || "Geen samenvatting toegevoegd."}
            </p>
          </div>
        </div>
      </article>
    </main>
  );
}
