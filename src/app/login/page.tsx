import Link from "next/link";
import { FeedbackBanner } from "@/components/feedback-banner";
import { getAppSession } from "@/lib/auth";
import { isDemoAuthEnabled } from "@/lib/env";
import { readFeedback } from "@/lib/feedback";
import { signInAction } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

const accessNotes = [
  "Toegang tot patiëntendossiers en rapporten",
  "Personeelsmodule met evaluaties en afwezigheden",
  "Kalender, meetings en interne communicatie",
  "Handboek en operationele richtlijnen",
];

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [resolvedSearchParams, session] = await Promise.all([searchParams, getAppSession()]);
  const feedback = readFeedback(resolvedSearchParams);
  const demoMode = isDemoAuthEnabled();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-7xl items-center px-6 py-10 md:px-10 lg:px-12">
      <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[2rem] border border-[var(--color-line-strong)] bg-[radial-gradient(circle_at_top_left,_rgba(82,210,255,0.22),_transparent_30%),linear-gradient(145deg,_var(--color-hero-start),_var(--color-hero-end))] p-8 text-[var(--color-hero-ink)] shadow-[0_30px_80px_rgba(4,28,44,0.28)] md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/66">
            Login
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">
            Beveiligde toegang voor EMS personeel.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-cyan-50/84">
            Meld je aan om toegang te krijgen tot dossiers, personeelsopvolging,
            planning en interne richtlijnen binnen het portaal.
          </p>

          <div className="mt-8 rounded-[1.5rem] border border-white/12 bg-white/8 p-5 backdrop-blur">
            <p className="text-sm font-semibold text-white">Beschikbaar na aanmelding</p>
            <ul className="mt-3 space-y-2 text-sm text-cyan-50/82">
              {accessNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-8 shadow-[var(--shadow-soft)] md:p-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Aanmelden
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                EMS toegang
              </h2>
            </div>
            {session ? (
              <Link
                href="/"
                className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
              >
                Ga naar dashboard
              </Link>
            ) : null}
          </div>

          {feedback ? (
            <div className="mt-6">
              <FeedbackBanner type={feedback.type} message={feedback.message} />
            </div>
          ) : null}

          {demoMode ? (
            <div className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-muted)]">
              Demo-auth is actief. Dit formulier opent het dashboard met lokale voorbeelddata.
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-alt)] px-4 py-3 text-sm text-[var(--color-muted)]">
              Gebruik je toegewezen e-mail en wachtwoord om aan te melden.
            </div>
          )}

          <form action={signInAction} className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              E-mail
              <input
                type="email"
                name="email"
                defaultValue={demoMode ? "demo@ems.local" : ""}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Wachtwoord
              <input
                type="password"
                name="password"
                defaultValue={demoMode ? "demodemo" : ""}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
              />
            </label>
            <button
              type="submit"
              className="mt-2 rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
            >
              Aanmelden
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
