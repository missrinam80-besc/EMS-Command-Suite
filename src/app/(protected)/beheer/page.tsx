import { FeedbackBanner } from "@/components/feedback-banner";
import { PatientAuditLogBoard } from "@/components/patient-audit-log-board";
import { AdminUserManagement } from "@/components/admin-user-management";
import { AdminRankGroups } from "@/components/admin-rank-groups";
import { requirePermission } from "@/lib/auth";
import {
  createPatientStatusAction,
  createReportTypeAction,
  createWarningBadgeAction,
  updatePatientStatusAction,
  updateReportTypeAction,
  updateWarningBadgeAction,
} from "@/app/(protected)/beheer/actions";
import {
  getInfrastructureHealth,
  getManagedPatientStatuses,
  getManagedReportTypes,
  getManagedUsers,
  getManagedWarningBadges,
  getPermissionCatalog,
  getRankPermissionGroups,
} from "@/lib/admin";
import { readFeedback } from "@/lib/feedback";
import { getAllPatientAuditLogs } from "@/lib/patients";

type BeheerPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

function formatDateTime(value?: string | null) {
  if (!value) return "Niet beschikbaar";
  return new Date(value).toLocaleString("nl-BE");
}

export default async function BeheerPage({ searchParams }: BeheerPageProps) {
  await requirePermission("config.panel.read");

  const feedback = readFeedback(await searchParams);
  const [
    health,
    users,
    permissions,
    rankGroups,
    reportTypes,
    warningBadges,
    patientStatuses,
    logs,
  ] = await Promise.all([
    getInfrastructureHealth(),
    getManagedUsers(),
    getPermissionCatalog(),
    getRankPermissionGroups(),
    getManagedReportTypes(),
    getManagedWarningBadges(),
    getManagedPatientStatuses(),
    getAllPatientAuditLogs(),
  ]);

  const topCards = [
    {
      title: "Gebruikers",
      value: users.length,
      detail: `${users.filter((user) => user.profileType === "medical_staff").length} medische profielen`,
    },
    {
      title: "Rechtengroepen",
      value: rankGroups.length,
      detail: `${permissions.length} beschikbare permissies`,
    },
    {
      title: "Auditlog-items",
      value: logs.length,
      detail: logs[0] ? `Laatste: ${formatDateTime(logs[0].createdAt)}` : "Nog geen logitems",
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 lg:px-12">
      {feedback ? <FeedbackBanner type={feedback.type} message={feedback.message} /> : null}

      <section className="grid gap-4 md:grid-cols-3">
        {topCards.map((card) => (
          <article
            key={card.title}
            className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]"
          >
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
              {card.title}
            </p>
            <p className="mt-2 text-4xl font-semibold text-[var(--color-ink)]">{card.value}</p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[1.75rem] border border-[var(--color-line-strong)] bg-[radial-gradient(circle_at_top_left,_rgba(82,210,255,0.16),_transparent_34%),linear-gradient(145deg,_var(--color-hero-start),_var(--color-hero-end))] p-8 text-[var(--color-hero-ink)] shadow-[0_30px_80px_rgba(4,28,44,0.24)]">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-50/70">Beheer</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
          Centrale beheerspagina voor accounts, rechten en configuratie
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-cyan-50/84">
          Deze pagina beheert de live infrastructuur van de EMS webapp: gebruikersaccounts,
          ranggebaseerde rechtengroepen, rapporttypen, waarschuwingstags en patiëntstatussen.
          Database- en runtime-status blijven hier ook zichtbaar voor operationele controle.
        </p>
      </section>

      <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
          Databasebeheer
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
          Infrastructuur en gezondheid
        </h2>

        <div className="mt-6 grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
          <article className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-5">
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Runtime
            </p>
            <p className="mt-3 text-2xl font-semibold text-[var(--color-ink)]">
              {health.runtimeLabel}
            </p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {health.vercelEnv} · {health.vercelUrl ?? "geen externe URL"}
            </p>
          </article>

          <article className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-5">
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Datamodus
            </p>
            <p className="mt-3 text-2xl font-semibold text-[var(--color-ink)]">
              {health.dataModeLabel}
            </p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Supabase: {health.supabaseConfigured ? "geconfigureerd" : "ontbreekt"}
            </p>
          </article>

          <article className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-5">
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Service role
            </p>
            <p className="mt-3 text-2xl font-semibold text-[var(--color-ink)]">
              {health.serviceRoleConfigured ? "Actief" : "Ontbreekt"}
            </p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Nodig voor accountcreatie en wachtwoordbeheer via de UI.
            </p>
          </article>

          <article className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-5">
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Databasehealth
            </p>
            <p
              className={`mt-3 text-2xl font-semibold ${
                health.databaseHealthy ? "text-[#1f7a3a]" : "text-[#9a5b00]"
              }`}
            >
              {health.databaseHealthy ? "Gezond" : "Controle nodig"}
            </p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">{health.databaseMessage}</p>
          </article>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <h3 className="text-lg font-semibold text-[var(--color-ink)]">Live datastanden</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  Patiënten
                </p>
                <p className="mt-2 text-xl font-semibold text-[var(--color-ink)]">
                  {health.patientCount}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  Rapporten
                </p>
                <p className="mt-2 text-xl font-semibold text-[var(--color-ink)]">
                  {health.reportCount}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  Profielen
                </p>
                <p className="mt-2 text-xl font-semibold text-[var(--color-ink)]">
                  {health.profileCount}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  Auditlogs
                </p>
                <p className="mt-2 text-xl font-semibold text-[var(--color-ink)]">
                  {health.auditLogCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <h3 className="text-lg font-semibold text-[var(--color-ink)]">
              Deploy- en beheerinfo
            </h3>
            <div className="mt-4 grid gap-3 text-sm text-[var(--color-muted)]">
              <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3">
                <span className="block text-xs uppercase tracking-[0.16em]">Vercel URL</span>
                <span className="mt-2 block text-[var(--color-ink)]">
                  {health.vercelUrl ?? "Niet beschikbaar"}
                </span>
              </div>
              <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3">
                <span className="block text-xs uppercase tracking-[0.16em]">Commit</span>
                <span className="mt-2 block text-[var(--color-ink)]">
                  {health.gitCommitSha ?? "Niet beschikbaar"}
                </span>
              </div>
              <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3">
                <span className="block text-xs uppercase tracking-[0.16em]">
                  Handmatige beheeracties
                </span>
                <span className="mt-2 block text-[var(--color-ink)]">
                  Herstarten van Vercel of Supabase vereist momenteel nog externe API-koppeling
                  of manuele actie buiten deze webapp.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AdminUserManagement
        users={users}
        permissions={permissions}
        rankGroups={rankGroups}
        serviceRoleConfigured={health.serviceRoleConfigured}
      />
      <AdminRankGroups rankGroups={rankGroups} permissions={permissions} />

      <section className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Rapporttypenbeheer
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
            Beheer medische formuliertypen
          </h2>

          <form action={createReportTypeAction} className="mt-6 grid gap-4 rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Code
                <input name="code" required className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-[var(--color-ink)]" />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Label
                <input name="label" required className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-[var(--color-ink)]" />
              </label>
            </div>
            <label className="grid gap-2 text-sm text-[var(--color-muted)]">
              Beschrijving
              <textarea name="description" rows={3} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-[var(--color-ink)]" />
            </label>
            <div className="grid gap-4 md:grid-cols-[1fr_120px_auto] md:items-end">
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Kleur
                <input name="colorHex" placeholder="#52d2ff" className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-[var(--color-ink)]" />
              </label>
              <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                Volgorde
                <input type="number" name="sortOrder" defaultValue={100} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-[var(--color-ink)]" />
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-ink)]">
                <input type="checkbox" name="isActive" defaultChecked />
                Actief
              </label>
            </div>
            <button type="submit" className="justify-self-start rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)]">
              Rapporttype toevoegen
            </button>
          </form>

          <div className="mt-5 grid gap-4">
            {reportTypes.map((item) => (
              <form
                key={item.id}
                action={updateReportTypeAction}
                className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
              >
                <input type="hidden" name="id" value={item.id} />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink)]">
                    {item.code}
                  </span>
                  {item.isSystem ? (
                    <span className="rounded-full bg-[#efeaff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#5f43b2]">
                      Systeem
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                    Label
                    <input name="label" defaultValue={item.label} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-[var(--color-ink)]" />
                  </label>
                  <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                    Kleur
                    <input name="colorHex" defaultValue={item.colorHex ?? ""} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-[var(--color-ink)]" />
                  </label>
                </div>
                <label className="mt-4 grid gap-2 text-sm text-[var(--color-muted)]">
                  Beschrijving
                  <textarea name="description" rows={3} defaultValue={item.description ?? ""} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-[var(--color-ink)]" />
                </label>
                <div className="mt-4 grid gap-4 md:grid-cols-[120px_auto_auto] md:items-end">
                  <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                    Volgorde
                    <input type="number" name="sortOrder" defaultValue={item.sortOrder} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-[var(--color-ink)]" />
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-ink)]">
                    <input type="checkbox" name="isActive" defaultChecked={item.isActive} />
                    Actief
                  </label>
                  <button type="submit" className="justify-self-start rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]">
                    Opslaan
                  </button>
                </div>
              </form>
            ))}
          </div>
        </section>

        <section className="grid gap-6">
          <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Tags en badges
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
              Waarschuwingsbadges
            </h2>

            <form action={createWarningBadgeAction} className="mt-6 grid gap-4 rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                  Code
                  <input name="code" required className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-[var(--color-ink)]" />
                </label>
                <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                  Label
                  <input name="label" required className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-[var(--color-ink)]" />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-[1fr_120px_auto] md:items-end">
                <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                  Kleur
                  <input name="colorHex" placeholder="#ffcc4d" className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-[var(--color-ink)]" />
                </label>
                <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                  Volgorde
                  <input type="number" name="sortOrder" defaultValue={100} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-[var(--color-ink)]" />
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-ink)]">
                  <input type="checkbox" name="isActive" defaultChecked />
                  Actief
                </label>
              </div>
              <button type="submit" className="justify-self-start rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)]">
                Badge toevoegen
              </button>
            </form>

            <div className="mt-5 grid gap-4">
              {warningBadges.map((item) => (
                <form key={item.id} action={updateWarningBadgeAction} className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
                  <input type="hidden" name="id" value={item.id} />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink)]">
                      {item.code}
                    </span>
                    {item.isSystem ? (
                      <span className="rounded-full bg-[#efeaff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#5f43b2]">
                        Systeem
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                      Label
                      <input name="label" defaultValue={item.label} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-[var(--color-ink)]" />
                    </label>
                    <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                      Kleur
                      <input name="colorHex" defaultValue={item.colorHex ?? ""} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-[var(--color-ink)]" />
                    </label>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-[120px_auto_auto] md:items-end">
                    <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                      Volgorde
                      <input type="number" name="sortOrder" defaultValue={item.sortOrder} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-[var(--color-ink)]" />
                    </label>
                    <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-ink)]">
                      <input type="checkbox" name="isActive" defaultChecked={item.isActive} />
                      Actief
                    </label>
                    <button type="submit" className="justify-self-start rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]">
                      Opslaan
                    </button>
                  </div>
                </form>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Statusbeheer
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
              Patiëntstatussen
            </h2>

            <form action={createPatientStatusAction} className="mt-6 grid gap-4 rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                  Code
                  <input name="code" required className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-[var(--color-ink)]" />
                </label>
                <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                  Label
                  <input name="label" required className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-[var(--color-ink)]" />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-[1fr_120px_auto] md:items-end">
                <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                  Kleur
                  <input name="colorHex" placeholder="#52d2ff" className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-[var(--color-ink)]" />
                </label>
                <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                  Volgorde
                  <input type="number" name="sortOrder" defaultValue={100} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-[var(--color-ink)]" />
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-ink)]">
                  <input type="checkbox" name="isActive" defaultChecked />
                  Actief
                </label>
              </div>
              <button type="submit" className="justify-self-start rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)]">
                Status toevoegen
              </button>
            </form>

            <div className="mt-5 grid gap-4">
              {patientStatuses.map((item) => (
                <form key={item.id} action={updatePatientStatusAction} className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
                  <input type="hidden" name="id" value={item.id} />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink)]">
                      {item.code}
                    </span>
                    {item.isSystem ? (
                      <span className="rounded-full bg-[#efeaff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#5f43b2]">
                        Systeem
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                      Label
                      <input name="label" defaultValue={item.label} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-[var(--color-ink)]" />
                    </label>
                    <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                      Kleur
                      <input name="colorHex" defaultValue={item.colorHex ?? ""} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-[var(--color-ink)]" />
                    </label>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-[120px_auto_auto] md:items-end">
                    <label className="grid gap-2 text-sm text-[var(--color-muted)]">
                      Volgorde
                      <input type="number" name="sortOrder" defaultValue={item.sortOrder} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-[var(--color-ink)]" />
                    </label>
                    <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-ink)]">
                      <input type="checkbox" name="isActive" defaultChecked={item.isActive} />
                      Actief
                    </label>
                    <button type="submit" className="justify-self-start rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]">
                      Opslaan
                    </button>
                  </div>
                </form>
              ))}
            </div>
          </section>
        </section>
      </section>

      <section className="w-full">
        <PatientAuditLogBoard logs={logs} />
      </section>
    </main>
  );
}
