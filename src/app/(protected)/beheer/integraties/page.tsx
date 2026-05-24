import Link from "next/link";
import { FeedbackBanner } from "@/components/feedback-banner";
import { requireAnyPermission } from "@/lib/auth";
import { readFeedback } from "@/lib/feedback";
import {
  getAutomationJobs,
  getRecentAutomationRuns,
  getIntegrationEndpoints,
  getRecentIntegrationDeliveries,
} from "@/lib/integrations";
import {
  createIntegrationEndpointAction,
  runAutomationJobAction,
  testIntegrationDispatchAction,
  updateIntegrationEndpointAction,
} from "./actions";

type IntegratiesPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function IntegratiesPage({ searchParams }: IntegratiesPageProps) {
  await requireAnyPermission(["config.database.read", "config.tenants.manage"]);
  const feedback = readFeedback(await searchParams);
  const [endpoints, deliveries, jobs, runs] = await Promise.all([
    getIntegrationEndpoints(),
    getRecentIntegrationDeliveries(80),
    getAutomationJobs(),
    getRecentAutomationRuns(80),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 lg:px-12">
      {feedback ? <FeedbackBanner type={feedback.type} message={feedback.message} /> : null}

      <section className="rounded-[1.75rem] border border-[var(--color-line-strong)] bg-[radial-gradient(circle_at_top_left,_rgba(82,210,255,0.16),_transparent_34%),linear-gradient(145deg,_var(--color-hero-start),_var(--color-hero-end))] p-8 text-[var(--color-hero-ink)] shadow-[0_30px_80px_rgba(4,28,44,0.24)]">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-50/70">Fase 9 · Integraties</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">Integraties en automatisatie</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-cyan-50/84">
          Beheer webhooks, automation jobs, retries en replay-achtige testdispatches centraal vanuit deze pagina.
        </p>
        <div className="mt-5">
          <Link href="/beheer" className="inline-flex rounded-full border border-cyan-100/40 px-4 py-2 text-sm font-semibold text-cyan-50">
            Terug naar beheer
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">Endpoint aanmaken</h2>
          <form action={createIntegrationEndpointAction} className="mt-4 grid gap-3">
            <input name="code" placeholder="discord_ops" className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm" required />
            <input name="label" placeholder="Discord Ops" className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm" required />
            <input name="targetUrl" placeholder="https://example.com/webhook" className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm" required />
            <input name="signingSecret" placeholder="signing secret" className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm" required />
            <div className="grid gap-3 md:grid-cols-2">
              <input type="number" name="retryLimit" defaultValue={3} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm" />
              <input type="number" name="timeoutMs" defaultValue={7000} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm" />
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked />Actief</label>
            <button type="submit" className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]">Endpoint opslaan</button>
          </form>
        </article>

        <article className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">Handmatige dispatch</h2>
          <form action={testIntegrationDispatchAction} className="mt-4 grid gap-3">
            <input name="eventType" defaultValue="manual.test" className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm" />
            <button type="submit" className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]">
              Test webhook dispatch
            </button>
          </form>

          <h3 className="mt-6 text-lg font-semibold text-[var(--color-ink)]">Automation jobs triggeren</h3>
          <div className="mt-3 space-y-2">
            <form action={runAutomationJobAction}>
              <input type="hidden" name="jobCode" value="daily_kpi_digest" />
              <button type="submit" className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]">Run daily_kpi_digest</button>
            </form>
            <form action={runAutomationJobAction}>
              <input type="hidden" name="jobCode" value="open_cases_reminder" />
              <button type="submit" className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]">Run open_cases_reminder</button>
            </form>
          </div>
        </article>
      </section>

      <section className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
        <h2 className="text-xl font-semibold text-[var(--color-ink)]">Endpoints</h2>
        <div className="mt-4 space-y-3">
          {endpoints.map((endpoint) => (
            <form key={endpoint.id} action={updateIntegrationEndpointAction} className="rounded-xl border border-[var(--color-line)] bg-white p-3">
              <input type="hidden" name="id" value={endpoint.id} />
              <div className="grid gap-2 md:grid-cols-2">
                <input name="code" defaultValue={endpoint.code} className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
                <input name="label" defaultValue={endpoint.label} className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
              </div>
              <input name="targetUrl" defaultValue={endpoint.targetUrl} className="mt-2 w-full rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
              <input name="signingSecret" defaultValue={endpoint.signingSecret} className="mt-2 w-full rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <input type="number" name="retryLimit" defaultValue={endpoint.retryLimit} className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
                <input type="number" name="timeoutMs" defaultValue={endpoint.timeoutMs} className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm" />
              </div>
              <div className="mt-2 flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={endpoint.isActive} />Actief</label>
                <span className="text-xs text-[var(--color-muted)]">Laatste status: {endpoint.lastStatus}</span>
                <button type="submit" className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]">Update</button>
              </div>
            </form>
          ))}
          {endpoints.length === 0 ? <p className="text-sm text-[var(--color-muted)]">Nog geen endpoints.</p> : null}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">Recente webhook deliveries</h2>
          <div className="mt-4 space-y-2 text-sm">
            {deliveries.map((item) => (
              <p key={item.id} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2">
                <strong>{item.endpointCode}</strong> · {item.eventType} · {item.status} · poging {item.attempt}
                {item.httpStatus ? ` · HTTP ${item.httpStatus}` : ""}
              </p>
            ))}
            {deliveries.length === 0 ? <p className="text-[var(--color-muted)]">Nog geen delivery logs.</p> : null}
          </div>
        </article>

        <article className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">Automation jobs & runs</h2>
          <div className="mt-4 space-y-2 text-sm">
            {jobs.map((job) => (
              <p key={job.id} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2">
                <strong>{job.jobCode}</strong> · {job.lastStatus} · laatste run: {job.lastRunAt ? new Date(job.lastRunAt).toLocaleString("nl-BE") : "-"}
              </p>
            ))}
          </div>
          <div className="mt-4 space-y-2 text-sm">
            {runs.slice(0, 12).map((run) => (
              <p key={run.id} className="rounded-xl border border-[var(--color-line)] bg-white px-3 py-2">
                {run.jobCode} · {run.status} · {new Date(run.startedAt).toLocaleString("nl-BE")}
              </p>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
