"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { AppSession } from "@/lib/auth";
import { signInAction, signOutAction } from "@/app/login/actions";

type AuthStatusButtonProps = {
  session: AppSession | null;
};

export function AuthStatusButton({ session }: AuthStatusButtonProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open]);

  const modal = open ? (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-[#061521]/55 px-4 py-6 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div className="flex min-h-[calc(100vh-3rem)] items-start justify-center pt-8 md:items-center md:pt-0">
        <div
          role="dialog"
          aria-modal="true"
          className="w-full max-w-md rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[0_30px_80px_rgba(4,28,44,0.28)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Account
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                {session ? "Sessiestatus" : "Aanmelden"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-[var(--color-line)] px-3 py-1 text-sm text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
            >
              Sluiten
            </button>
          </div>

          {session ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  {session.fullName}
                </p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  {session.rankLabel} | {session.citizenId}
                </p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{session.email}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full rounded-full border border-[var(--color-line)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
                >
                  Annuleren
                </button>
                <form action={signOutAction} className="w-full">
                  <button
                    type="submit"
                    className="w-full rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
                  >
                    Afmelden
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <form action={signInAction} className="mt-6 grid gap-4">
              <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-muted)]">
                Meld je aan via de popup om toegang te krijgen tot het dashboard.
              </div>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                E-mail
                <input
                  type="email"
                  name="email"
                  defaultValue="demo@ems.local"
                  className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Wachtwoord
                <input
                  type="password"
                  name="password"
                  defaultValue="demodemo"
                  className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full rounded-full border border-[var(--color-line)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="w-full rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
                >
                  Aanmelden
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={
          session
            ? `${session.fullName} | ${session.rankLabel} | ${session.citizenId}`
            : "Niet ingelogd"
        }
        className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]"
      >
        {session ? "Ingelogd" : "Niet ingelogd"}
      </button>

      {typeof document !== "undefined" ? createPortal(modal, document.body) : null}
    </>
  );
}
