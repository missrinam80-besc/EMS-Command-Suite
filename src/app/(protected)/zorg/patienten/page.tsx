import { requirePermission } from "@/lib/auth";
import { FeedbackBanner } from "@/components/feedback-banner";
import { PatientQuickActions } from "@/components/patient-quick-actions";
import { PatientWorkspace } from "@/components/patient-workspace";
import { readFeedback } from "@/lib/feedback";
import { getPatientWorkspaceRows } from "@/lib/patients";

type PatientenPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function PatientenPage({ searchParams }: PatientenPageProps) {
  await requirePermission("patients.read");
  const feedback = readFeedback(await searchParams);

  const patients = await getPatientWorkspaceRows();
  const totalReports = patients.reduce((total, patient) => total + patient.reportCount, 0);
  const latestReportAt = patients
    .map((patient) => patient.latestReportAt)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => right.localeCompare(left))[0];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 lg:px-12">
      {feedback ? <FeedbackBanner type={feedback.type} message={feedback.message} /> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Patiënten
          </p>
          <p className="mt-2 text-4xl font-semibold text-[var(--color-ink)]">
            {patients.length}
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Rapporten
          </p>
          <p className="mt-2 text-4xl font-semibold text-[var(--color-ink)]">
            {totalReports}
          </p>
        </article>
        <article className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Laatste rapport
          </p>
          <p className="mt-2 text-lg font-semibold text-[var(--color-ink)]">
            {latestReportAt
              ? new Date(latestReportAt).toLocaleString("nl-BE")
              : "Nog geen rapport"}
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <PatientWorkspace patients={patients} />
        <PatientQuickActions
          patients={patients.map((patient) => ({
            id: patient.id,
            fullName: patient.fullName,
            citizenId: patient.citizenId,
          }))}
        />
      </section>
    </main>
  );
}
