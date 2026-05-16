import Link from "next/link";
import { notFound } from "next/navigation";
import { updatePatientCaseAction } from "@/app/(protected)/zorg/patienten/actions";
import { FeedbackBanner } from "@/components/feedback-banner";
import { requireAnyPermission } from "@/lib/auth";
import { readFeedback } from "@/lib/feedback";
import { getPatientCaseDetail, getPatientDetail } from "@/lib/patients";

type EditPatientCasePageProps = {
  params: Promise<{ patientId: string; caseId: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function EditPatientCasePage({
  params,
  searchParams,
}: EditPatientCasePageProps) {
  await requireAnyPermission(["cases.update", "cases.status.update"]);

  const { patientId, caseId } = await params;
  const feedback = readFeedback(await searchParams);
  const [patient, patientCase] = await Promise.all([
    getPatientDetail(patientId),
    getPatientCaseDetail(patientId, caseId),
  ]);

  if (!patient || !patientCase) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8 md:px-10">
      {feedback ? <FeedbackBanner type={feedback.type} message={feedback.message} /> : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Case bewerken
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
            {patientCase.title}
          </h1>
        </div>

        <Link
          href={`/zorg/patienten/${patient.id}/cases/${patientCase.id}`}
          className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
        >
          Terug naar case
        </Link>
      </div>

      <form
        action={updatePatientCaseAction}
        className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
      >
        <input type="hidden" name="patientId" value={patient.id} />
        <input type="hidden" name="caseId" value={patientCase.id} />

        <div className="grid gap-4">
          <label className="grid gap-2 text-sm text-[var(--color-muted)]">
            Titel
            <input
              name="title"
              required
              minLength={3}
              defaultValue={patientCase.title}
              className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
            />
          </label>
          <label className="grid gap-2 text-sm text-[var(--color-muted)]">
            Status
            <select
              name="status"
              defaultValue={patientCase.status}
              className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
            >
              <option value="open">Open</option>
              <option value="afgesloten">Gesloten</option>
              <option value="gearchiveerd">Gearchiveerd</option>
              <option value="in_onderzoek">In onderzoek</option>
              <option value="in_wacht">In wacht</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm text-[var(--color-muted)]">
            Samenvatting
            <textarea
              name="summary"
              rows={6}
              defaultValue={patientCase.summary || ""}
              className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
            />
          </label>
        </div>

        <button
          type="submit"
          className="mt-6 rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
        >
          Case opslaan
        </button>
      </form>
    </main>
  );
}
