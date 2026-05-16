import Link from "next/link";
import type { ReactNode } from "react";
import type { AppSession } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";

const sections = [
  { href: "/zorg", label: "Zorg" },
  { href: "/zorg/patienten", label: "Patiënten" },
  { href: "/personeel", label: "Personeel" },
  { href: "/organisatie", label: "Organisatie" },
  { href: "/handboek", label: "Handboek" },
];

type AppShellProps = {
  session: AppSession;
  children: ReactNode;
  signOutAction: () => Promise<void>;
};

export function AppShell({ session, children, signOutAction }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <div className="border-b border-[var(--color-line)] bg-[var(--color-panel)]/92 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-5 md:px-10 lg:px-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-accent-strong)]">
                Beveiligde EMS omgeving
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-[var(--color-ink)]">
                Operationele werkruimte
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-sm text-[var(--color-muted)] shadow-[var(--shadow-soft)]">
                <span className="font-semibold text-[var(--color-ink)]">{session.fullName}</span>
                {" · "}
                {session.rankLabel}
                {" · "}
                {session.citizenId}
              </div>
              <ThemeToggle />
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
                >
                  Afmelden
                </button>
              </form>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]"
              >
                {section.label}
              </Link>
            ))}
          </nav>

          {session.mode === "demo" ? (
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-muted)]">
              Demo-auth is actief omdat Supabase nog niet is ingevuld. De app gebruikt nu lokale voorbeelddata.
            </div>
          ) : null}
        </div>
      </div>

      {children}
    </div>
  );
}
