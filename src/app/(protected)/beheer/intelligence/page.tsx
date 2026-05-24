import Link from "next/link";
import { requireAnyPermission } from "@/lib/auth";
import { getIntelligenceSnapshot } from "@/lib/intelligence";

export default async function BeheerIntelligencePage() {
  await requireAnyPermission(["config.database.read", "config.tenants.manage"]);
  const snapshot = await getIntelligenceSnapshot(30);

  const kpiCards = [
    { label: "Actieve patienten", value: snapshot.kpis.patientsTotal },
    { label: "Totaal rapporten", value: snapshot.kpis.reportsTotal },
    { label: "Open cases", value: snapshot.kpis.casesOpen },
    { label: "Actief personeel", value: snapshot.kpis.staffActive },
    { label: "Toekomstige meetings", value: snapshot.kpis.meetingsUpcoming },
    { label: "Audit laatste 24u", value: snapshot.kpis.auditLast24h },
  ];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 lg:px-12">
      <section className="rounded-[1.75rem] border border-[var(--color-line-strong)] bg-[radial-gradient(circle_at_top_left,_rgba(82,210,255,0.16),_transparent_34%),linear-gradient(145deg,_var(--color-hero-start),_var(--color-hero-end))] p-8 text-[var(--color-hero-ink)] shadow-[0_30px_80px_rgba(4,28,44,0.24)]">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-50/70">Fase 8 · Intelligence</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">Data intelligence en beslissingsondersteuning</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-cyan-50/84">
          KPI-overzicht, trends, datakwaliteit en operationele alerts op basis van de laatste 30 dagen.
        </p>
        <p className="mt-2 text-sm text-cyan-50/80">
          Tenant: {snapshot.tenantLabel} ({snapshot.tenantCode})
        </p>
        <div className="mt-5">
          <Link href="/beheer" className="inline-flex rounded-full border border-cyan-100/40 px-4 py-2 text-sm font-semibold text-cyan-50">
            Terug naar beheer
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {kpiCards.map((card) => (
          <article key={card.label} className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">{card.label}</p>
            <p className="mt-2 text-4xl font-semibold text-[var(--color-ink)]">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">Datakwaliteit</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Detectie van ontbrekende kernvelden voor rapportering en governance.
          </p>
          <div className="mt-4 space-y-3 text-sm text-[var(--color-ink)]">
            <p>Rapporten zonder samenvatting: <strong>{snapshot.dataQuality.reportsMissingSummary}</strong></p>
            <p>Actieve patienten zonder citizenid: <strong>{snapshot.dataQuality.patientsMissingCitizenId}</strong></p>
            <p>Profielen zonder rank: <strong>{snapshot.dataQuality.profilesMissingRank}</strong></p>
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">Alerts</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Auto-signalen op basis van data-anomalieen en auditactiviteit.
          </p>
          <ul className="mt-4 space-y-2">
            {snapshot.alerts.map((alert) => (
              <li key={alert.code} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm">
                <span className="mr-2 inline-flex rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-xs font-semibold uppercase">{alert.severity}</span>
                {alert.message}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">Trend rapporten (30d)</h2>
          <div className="mt-4 space-y-1 text-sm">
            {snapshot.trends.reportsByDay.slice(-10).map((point) => (
              <p key={point.date} className="flex justify-between">
                <span>{point.date}</span>
                <strong>{point.count}</strong>
              </p>
            ))}
          </div>
        </article>
        <article className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">Trend audit-events (30d)</h2>
          <div className="mt-4 space-y-1 text-sm">
            {snapshot.trends.auditsByDay.slice(-10).map((point) => (
              <p key={point.date} className="flex justify-between">
                <span>{point.date}</span>
                <strong>{point.count}</strong>
              </p>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
        <h2 className="text-xl font-semibold text-[var(--color-ink)]">Export 2.0</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Gebruik datumfilters via query params `from` en `to` (YYYY-MM-DD).
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={`/api/exports/audit?from=${snapshot.rangeFrom}&to=${snapshot.rangeTo}`} className="inline-flex rounded-full border border-[var(--color-line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-ink)]">
            Exporteer audit (30d)
          </Link>
          <Link href={`/api/exports/reports?from=${snapshot.rangeFrom}&to=${snapshot.rangeTo}`} className="inline-flex rounded-full border border-[var(--color-line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-ink)]">
            Exporteer rapporten (30d)
          </Link>
          <Link href={`/api/exports/kpi?from=${snapshot.rangeFrom}&to=${snapshot.rangeTo}`} className="inline-flex rounded-full border border-[var(--color-line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-ink)]">
            Exporteer KPI snapshot (CSV)
          </Link>
        </div>
      </section>
    </main>
  );
}
