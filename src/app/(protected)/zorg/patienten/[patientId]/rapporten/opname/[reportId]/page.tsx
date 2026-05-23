import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getPatientDetail } from "@/lib/patients";
import {
  evaluateRuntimeFieldVisibility,
  formatRuntimeFieldValue,
  getActiveRuntimeReportTemplate,
} from "@/lib/report-template-runtime";
import { getReportAuthorLabel, getReportById } from "@/lib/reports";
import type { OpnameReportContent } from "@/types/domain";

type OpnameReportDetailPageProps = {
  params: Promise<{ patientId: string; reportId: string }>;
};

const opnameFields: Array<{ label: string; key: keyof OpnameReportContent }> = [
  { label: "Reden opname", key: "admissionReason" },
  { label: "Verwijzende eenheid", key: "referringUnit" },
  { label: "Behandelend arts", key: "attendingDoctor" },
  { label: "Ondersteunend personeel", key: "supportingStaff" },
  { label: "Klinische toestand", key: "clinicalStatus" },
  { label: "Voorlopige diagnose", key: "provisionalDiagnosis" },
  { label: "Opgestarte zorg", key: "startedCare" },
  { label: "Medicatieplan", key: "medicationPlan" },
  { label: "Opnameplan", key: "admissionPlan" },
  { label: "Afdelingsnotities", key: "wardNotes" },
];
const legacyFieldTypeByKey: Record<string, "text" | "textarea"> = {
  admissionReason: "text",
  referringUnit: "text",
  attendingDoctor: "text",
  supportingStaff: "text",
  clinicalStatus: "textarea",
  provisionalDiagnosis: "textarea",
  startedCare: "textarea",
  medicationPlan: "textarea",
  admissionPlan: "textarea",
  wardNotes: "textarea",
};

export default async function OpnameReportDetailPage({
  params,
}: OpnameReportDetailPageProps) {
  await requirePermission("reports.read");

  const { patientId, reportId } = await params;
  const [patient, report] = await Promise.all([
    getPatientDetail(patientId),
    getReportById(patientId, "opname", reportId),
  ]);

  if (!patient || !report) notFound();

  const content = report.content as OpnameReportContent;
  const contentRecord = content as Record<string, unknown>;
  const runtimeTemplate = await getActiveRuntimeReportTemplate("opname");
  const fieldConfig = runtimeTemplate?.fields.length
    ? runtimeTemplate.fields.map((field) => ({
        label: field.label,
        key: field.fieldKey,
        fieldType: field.fieldType,
        conditionalLogic: field.conditionalLogic,
      }))
    : opnameFields.map((field) => ({
        label: field.label,
        key: field.key as string,
        fieldType: legacyFieldTypeByKey[field.key as string] ?? "text",
        conditionalLogic: {},
      }));
  const visibleFieldConfig = fieldConfig.filter((field) =>
    evaluateRuntimeFieldVisibility(field, contentRecord),
  );
  const linkedCase = patient.cases.find((patientCase) => patientCase.id === report.caseId);
  const authorLabel = await getReportAuthorLabel(report.authorProfileId);
  const updatedAt = report.updatedAt ?? report.createdAt;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 md:px-10 lg:px-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Opnamerapport
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
            href={`/zorg/patienten/${patient.id}/rapporten/opname/${report.id}/bewerken`}
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
              <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">Opname</p>
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
            {visibleFieldConfig.map((field) => (
              <article
                key={field.key}
                className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  {field.label}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--color-ink)]">
                  {formatRuntimeFieldValue(
                    contentRecord[field.key],
                    field.fieldType,
                  )}
                </p>
              </article>
            ))}
          </section>
        </section>
      </section>
    </main>
  );
}
