"use client";

import { useState } from "react";
import { requestDatabaseRestartAction } from "@/app/(protected)/beheer/actions";
import type { InfrastructureHealth } from "@/lib/admin";

type AdminInfrastructureBoardProps = {
  health: InfrastructureHealth;
};

function statusTone(ok: boolean) {
  return ok
    ? "border-[#bde7ca] bg-[#edf9f1] text-[#1f6a3b]"
    : "border-[#f2d294] bg-[#fff6e3] text-[#9a5b00]";
}

function blurValue(value: string | null, revealed: boolean) {
  if (!value) return "Niet beschikbaar";
  return revealed ? value : "Verborgen";
}

export function AdminInfrastructureBoard({ health }: AdminInfrastructureBoardProps) {
  const [showSensitive, setShowSensitive] = useState(false);

  const cards = [
    {
      title: "Database",
      value: health.databaseHealthy ? "Gezond" : "Controle nodig",
      detail: health.databaseMessage,
      tone: statusTone(health.databaseHealthy),
    },
    {
      title: "Databron",
      value: health.dataModeLabel,
      detail: health.supabaseConfigured ? "Live koppeling beschikbaar" : "Configuratie ontbreekt",
      tone: statusTone(health.supabaseConfigured),
    },
    {
      title: "Accountbeheer",
      value: health.serviceRoleConfigured ? "Volledig actief" : "Beperkt",
      detail: health.serviceRoleConfigured
        ? "Accounts en wachtwoorden kunnen via de UI beheerd worden."
        : "Voeg een server-side service role key toe voor accountbeheer.",
      tone: statusTone(health.serviceRoleConfigured),
    },
    {
      title: "Runtime",
      value: health.runtimeLabel,
      detail: `${health.vercelEnv} omgeving`,
      tone: "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)]",
    },
  ];

  return (
    <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
      <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
        Databasebeheer
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
        Infrastructuur en gezondheid
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
        Dit overzicht werkt als een compacte monitortool: live datalaag, accountbeheer en
        runtime-status worden hier visueel samengebracht zonder technische ruis.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.title} className={`rounded-[1.25rem] border px-5 py-5 ${card.tone}`}>
            <p className="text-sm uppercase tracking-[0.18em] opacity-75">{card.title}</p>
            <p className="mt-3 text-2xl font-semibold">{card.value}</p>
            <p className="mt-2 text-sm leading-6 opacity-80">{card.detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <h3 className="text-lg font-semibold text-[var(--color-ink)]">Live datastanden</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#bde7ca] bg-[#edf9f1] px-4 py-3 text-[#1f6a3b]">
              <p className="text-xs uppercase tracking-[0.16em] opacity-70">Patiëntenfiches</p>
              <p className="mt-2 text-xl font-semibold">{health.patientCount}</p>
            </div>
            <div className="rounded-2xl border border-[#d7ebf7] bg-[#eef8fd] px-4 py-3 text-[#0f5f8f]">
              <p className="text-xs uppercase tracking-[0.16em] opacity-70">Rapporten</p>
              <p className="mt-2 text-xl font-semibold">{health.reportCount}</p>
            </div>
            <div className="rounded-2xl border border-[#ede2ff] bg-[#f7f1ff] px-4 py-3 text-[#5f43b2]">
              <p className="text-xs uppercase tracking-[0.16em] opacity-70">Gebruikers</p>
              <p className="mt-2 text-xl font-semibold">{health.profileCount}</p>
            </div>
            <div className="rounded-2xl border border-[#f6dfba] bg-[#fff5e8] px-4 py-3 text-[#9a5b00]">
              <p className="text-xs uppercase tracking-[0.16em] opacity-70">Auditregels</p>
              <p className="mt-2 text-xl font-semibold">{health.auditLogCount}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-ink)]">
                Deploy- en beheerinfo
              </h3>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                Gevoelige deployinformatie blijft standaard vervaagd.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSensitive((current) => !current)}
              className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
            >
              {showSensitive ? "Verberg" : "Zichtbaar maken"}
            </button>
          </div>

          <div className="mt-4 grid gap-3 text-sm text-[var(--color-muted)]">
            {[
              { label: "Vercel URL", value: health.vercelUrl },
              { label: "Commit", value: health.gitCommitSha },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3"
              >
                <span className="block text-xs uppercase tracking-[0.16em]">{item.label}</span>
                <span
                  className={`mt-2 block font-medium text-[var(--color-ink)] ${
                    showSensitive ? "" : "select-none blur-sm"
                  }`}
                >
                  {blurValue(item.value, showSensitive)}
                </span>
              </div>
            ))}
            <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3">
              <span className="block text-xs uppercase tracking-[0.16em]">
                Handmatige beheeracties
              </span>
              <span className="mt-2 block text-[var(--color-ink)]">
                Een volledige Supabase herstart vereist nog steeds een externe actie. Deze knop
                registreert wel een herstartverzoek en forceert een nieuwe health-check in de app.
              </span>
              <form action={requestDatabaseRestartAction} className="mt-3">
                <button
                  type="submit"
                  className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
                >
                  Database herstartverzoek registreren
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
