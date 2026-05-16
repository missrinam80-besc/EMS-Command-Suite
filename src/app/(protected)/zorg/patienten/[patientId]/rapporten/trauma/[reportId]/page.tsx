import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getPatientDetail } from "@/lib/patients";
import { getReportAuthorLabel, getReportById } from "@/lib/reports";
import type { TraumaReportContent } from "@/types/domain";

type TraumaReportDetailPageProps = {
  params: Promise<{ patientId: string; reportId: string }>;
};

const traumaFields: Array<{ label: string; key: keyof TraumaReportContent }> = [
  { label: "Incidentlocatie", key: "incidentLocation" },
  { label: "Mechanisme", key: "mechanism" },
  { label: "Triage", key: "triageLevel" },
  { label: "Bewustzijn", key: "consciousness" },
  { label: "Letselsamenvatting", key: "injuriesSummary" },
  { label: "Vitals", key: "vitals" },
  { label: "Interventies", key: "interventions" },
  { label: "Transportbeslissing", key: "transportDecision" },
  { label: "Follow-up", key: "followUp" },
];

export default async function TraumaReportDetailPage({
  params,
}: TraumaReportDetailPageProps) {
  await requirePermission("reports.read");

  const { patientId, reportId } = await params;
  const [patient, report] = await Promise.all([
    getPatientDetail(patientId),
    getReportById(patientId, "trauma", reportId),
  ]);

  if (!patient || !report) notFound();

  const content = report.content as TraumaReportContent;
  const linkedCase = patient.cases.find((patientCase) => patientCase.id === report.caseId);
  const authorLabel = await getReportAuthorLabel(report.authorProfileId);
  const updatedAt = report.updatedAt ?? report.createdAt;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 md:px-10 lg:px-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Traumarapport
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
            {report.title}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {patient.fullName} · {patient.citizenId}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/zorg/patienten/${patient.id}/rapporten/trauma/${report.id}/bewerken`}
            className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
          >
            Bewerk rapport
          </Link>
          <Link
            href={`/zorg/patienten/${patient.id}`}
            className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
          >
            Terug naar dossier
          </Link>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Metadata
          </p>
          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                Type rapport
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">Trauma</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                Auteur
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">{authorLabel}</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                Gekoppelde case
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                {linkedCase?.title || "Geen case gekoppeld"}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                Aangemaakt op
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                {new Date(report.createdAt).toLocaleString("nl-BE")}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                Laatste wijziging
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                {new Date(updatedAt).toLocaleString("nl-BE")}
              </p>
            </div>
          </div>
        </aside>

        <section className="grid gap-6">
          <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Samenvatting
            </p>
            <p className="mt-3 text-base leading-7 text-[var(--color-ink)]">{report.summary}</p>
          </article>

          <section className="grid gap-4 md:grid-cols-2">
            {traumaFields.map((field) => (
              <article
                key={field.key}
                className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  {field.label}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--color-ink)]">
                  {content[field.key] || "Niet ingevuld"}
                </p>
              </article>
            ))}
          </section>
        </section>
      </section>
    </main>
  );
}
