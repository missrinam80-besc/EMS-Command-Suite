import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import { getAppSession, hasPermission } from "@/lib/auth";
import { AuthStatusButton } from "@/components/auth-status-button";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "EMS Command Suite",
  description:
    "Zelfstandige EMS webapp voor dossiers, personeel, organisatie en handboek, gebouwd op Next.js en Supabase.",
};

function ShellHeader({ session }: { session: Awaited<ReturnType<typeof getAppSession>> }) {
  return (
    <header className="border-b border-[var(--color-line)] bg-[color:var(--color-panel)]/92 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-4 px-6 py-4 md:px-10 lg:flex-row lg:items-center lg:px-12">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-accent-strong)]">
            EMS Command Suite
          </p>
          <p className="mt-1 text-sm leading-6 text-[var(--color-muted)] max-sm:hidden">
            Externe browserapp met Supabase-auth en rangafhankelijke toegang
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto lg:justify-end">
          <Link
            href="/"
            className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]"
          >
            Dashboard
          </Link>
          {session && hasPermission(session, "config.panel.read") ? (
            <Link
              href="/beheer"
              className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]"
            >
              Beheer
            </Link>
          ) : null}
          <AuthStatusButton session={session} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function ShellFooter() {
  return (
    <footer className="border-t border-[var(--color-line)] bg-[var(--color-panel)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-6 py-5 text-sm text-[var(--color-muted)] md:px-10 lg:px-12">
        <p>Startbasis voor v1: dossiers, rapporten, personeel, meetings en handboek.</p>
        <p>
          Technische documentatie staat in <code>docs/</code> en het datamodel
          in <code>supabase/schema.sql</code>.
        </p>
      </div>
    </footer>
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAppSession();

  return (
    <html
      lang="nl"
      suppressHydrationWarning
      className={`${manrope.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--color-bg)] text-[var(--color-ink)]">
        <div className="relative flex min-h-screen flex-col overflow-x-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_var(--color-glow),_transparent_26%),linear-gradient(180deg,_transparent,_transparent)]" />
          <ShellHeader session={session} />
          <div className="flex-1">{children}</div>
          <ShellFooter />
        </div>
      </body>
    </html>
  );
}
