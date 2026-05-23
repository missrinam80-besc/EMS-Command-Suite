import Link from "next/link";
import { notFound } from "next/navigation";
import { FeedbackBanner } from "@/components/feedback-banner";
import { RuntimeTemplateFields } from "@/components/runtime-template-fields";
import { requireReportEditAccess } from "@/lib/auth";
import { readFeedback } from "@/lib/feedback";
import { getPatientDetail } from "@/lib/patients";
import { getActiveRuntimeReportTemplate } from "@/lib/report-template-runtime";
import { getReportAuthorLabel, getReportById } from "@/lib/reports";
import type { OpnameReportContent } from "@/types/domain";
import { updateOpnameReportAction } from "../actions";

type EditOpnameReportPageProps = {
  params: Promise<{ patientId: string; reportId: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function EditOpnameReportPage({
  params,
  searchParams,
}: EditOpnameReportPageProps) {
  const { patientId, reportId } = await params;
  await requireReportEditAccess({
    patientId,
    reportId,
    reportType: "opname",
    forbiddenRedirectPath: `/zorg/patienten/${patientId}/rapporten/opname/${reportId}`,
  });
  const feedback = readFeedback(await searchParams);
  const [patient, report] = await Promise.all([
    getPatientDetail(patientId),
    getReportById(patientId, "opname", reportId),
  ]);

  if (!patient || !report) notFound();

  const content = report.content as OpnameReportContent;
  const runtimeTemplate = await getActiveRuntimeReportTemplate("opname");
  const legacyFieldKeys = new Set([
    "admissionReason",
    "referringUnit",
    "attendingDoctor",
    "supportingStaff",
    "clinicalStatus",
    "provisionalDiagnosis",
    "startedCare",
    "medicationPlan",
    "admissionPlan",
    "wardNotes",
  ]);
  const dynamicFields = (runtimeTemplate?.fields ?? []).filter(
    (field) => !legacyFieldKeys.has(field.fieldKey),
  );
  const linkedCase = patient.cases.find((patientCase) => patientCase.id === report.caseId);
  const authorLabel = await getReportAuthorLabel(report.authorProfileId);
  const updatedAt = report.updatedAt ?? report.createdAt;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 lg:px-12">
      {feedback ? <FeedbackBanner type={feedback.type} message={feedback.message} /> : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Opname
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
            Bewerk opnamerapport
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {patient.fullName} · {report.title}
          </p>
        </div>

        <Link
          href={`/zorg/patienten/${patient.id}/rapporten/opname/${report.id}`}
          className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
        >
          Terug naar rapport
        </Link>
      </div>

      <form action={updateOpnameReportAction} className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <input type="hidden" name="patientId" value={patient.id} />
        <input type="hidden" name="reportId" value={report.id} />

        <aside className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Metadata
          </p>
          <div className="mt-5 grid gap-3">
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
                Laatste wijziging
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                {new Date(updatedAt).toLocaleString("nl-BE")}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Titel
              <input
                name="title"
                required
                minLength={4}
                defaultValue={report.title}
                className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Gekoppelde case
              <select
                name="caseId"
                defaultValue={report.caseId ?? ""}
                className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              >
                <option value="">Geen case koppelen</option>
                {patient.cases.map((patientCase) => (
                  <option key={patientCase.id} value={patientCase.id}>
                    {patientCase.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Samenvatting
              <textarea
                name="summary"
                rows={5}
                required
                minLength={3}
                defaultValue={report.summary}
                className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Reden opname
              <input
                name="admissionReason"
                defaultValue={content.admissionReason ?? ""}
                className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Verwijzende eenheid
              <input
                name="referringUnit"
                defaultValue={content.referringUnit ?? ""}
                className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
          </div>
        </aside>

        <section className="grid gap-6">
          <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <h2 className="text-2xl font-semibold text-[var(--color-ink)]">Klinische status</h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Behandelend arts
                <input
                  name="attendingDoctor"
                  defaultValue={content.attendingDoctor ?? ""}
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Ondersteunend personeel
                <input
                  name="supportingStaff"
                  defaultValue={content.supportingStaff ?? ""}
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Klinische toestand
                <textarea
                  name="clinicalStatus"
                  rows={4}
                  defaultValue={content.clinicalStatus ?? ""}
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Voorlopige diagnose
                <textarea
                  name="provisionalDiagnosis"
                  rows={4}
                  defaultValue={content.provisionalDiagnosis ?? ""}
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-[linear-gradient(180deg,_var(--color-surface-alt),_var(--color-panel-strong))] p-6 shadow-[var(--shadow-soft)]">
            <h2 className="text-2xl font-semibold text-[var(--color-ink)]">Zorg en opnameplan</h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Opgestarte zorg
                <textarea
                  name="startedCare"
                  rows={4}
                  defaultValue={content.startedCare ?? ""}
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Medicatieplan
                <textarea
                  name="medicationPlan"
                  rows={3}
                  defaultValue={content.medicationPlan ?? ""}
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Opnameplan
                <textarea
                  name="admissionPlan"
                  rows={3}
                  defaultValue={content.admissionPlan ?? ""}
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Afdelingsnotities
                <textarea
                  name="wardNotes"
                  rows={3}
                  defaultValue={content.wardNotes ?? ""}
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
            </div>
            <button
              type="submit"
              className="mt-6 rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
            >
              Wijzigingen opslaan
            </button>
          </article>

          <RuntimeTemplateFields fields={dynamicFields} initialValues={content as Record<string, unknown>} />
        </section>
      </form>
    </main>
  );
}
