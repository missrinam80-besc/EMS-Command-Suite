import Link from "next/link";
import { notFound } from "next/navigation";
import { FeedbackBanner } from "@/components/feedback-banner";
import { requirePermission } from "@/lib/auth";
import { readFeedback } from "@/lib/feedback";
import { getPatientDetail } from "@/lib/patients";
import { createTraumaReportAction } from "../actions";

type NewTraumaReportPageProps = {
  params: Promise<{ patientId: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
};

const triageOptions = ["Rood", "Oranje", "Geel", "Groen", "Zwart"];

export default async function NewTraumaReportPage({
  params,
  searchParams,
}: NewTraumaReportPageProps) {
  await requirePermission("reports.create");

  const { patientId } = await params;
  const feedback = readFeedback(await searchParams);
  const patient = await getPatientDetail(patientId);

  if (!patient) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 lg:px-12">
      {feedback ? <FeedbackBanner type={feedback.type} message={feedback.message} /> : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Trauma
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
            Nieuw traumarapport
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {patient.fullName} · {patient.citizenId}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/zorg/patienten/${patient.id}`}
            className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
          >
            Terug naar dossier
          </Link>
          <Link
            href="/zorg/patienten"
            className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
          >
            Naar register
          </Link>
        </div>
      </div>

      <form
        action={createTraumaReportAction}
        className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]"
      >
        <input type="hidden" name="patientId" value={patient.id} />

        <aside className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-[var(--color-ink)]">
              Rapportkop
            </h2>
            <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink)]">
              Stap 1
            </span>
          </div>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Titel
              <input
                name="title"
                required
                minLength={4}
                defaultValue={`Traumarapport ${patient.fullName}`}
                className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Gekoppelde case
              <select
                name="caseId"
                defaultValue={patient.cases[0]?.id ?? ""}
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
                placeholder="Korte medische samenvatting van het incident en de toestand."
                className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Incidentlocatie
              <input
                name="incidentLocation"
                placeholder="Bijv. Havengebied, Pier 4"
                className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Mechanisme
              <input
                name="mechanism"
                placeholder="Bijv. Val van hoogte, mesletsel, aanrijding"
                className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Triage
              <select
                name="triageLevel"
                defaultValue="Oranje"
                className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              >
                {triageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </aside>

        <section className="grid gap-6">
          <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-[var(--color-ink)]">
                Klinische informatie
              </h2>
              <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink)]">
                Stap 2
              </span>
            </div>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Bewustzijn
                <textarea
                  name="consciousness"
                  rows={3}
                  placeholder="Bijv. wakker, verbaal aanspreekbaar, GCS 14"
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Letselsamenvatting
                <textarea
                  name="injuriesSummary"
                  rows={5}
                  placeholder="Beschrijf de primaire letsels, pijnpunten en observaties."
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Vitals
                <textarea
                  name="vitals"
                  rows={4}
                  placeholder="Bijv. Pols 90, BP 128/82, saturatie 98%"
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-[linear-gradient(180deg,_var(--color-surface-alt),_var(--color-panel-strong))] p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-[var(--color-ink)]">
                Interventie en vervolg
              </h2>
              <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink)]">
                Stap 3
              </span>
            </div>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Interventies
                <textarea
                  name="interventions"
                  rows={4}
                  placeholder="Welke handelingen zijn uitgevoerd?"
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Transportbeslissing
                <textarea
                  name="transportDecision"
                  rows={3}
                  placeholder="Bijv. transport naar spoed, observatie ter plaatse"
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Follow-up
                <textarea
                  name="followUp"
                  rows={3}
                  placeholder="Aanbevolen opvolging, opname of herbeoordeling"
                  className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-6 rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
            >
              Traumarapport opslaan
            </button>
          </article>
        </section>
      </form>
    </main>
  );
}
