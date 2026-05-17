import { FeedbackBanner } from "@/components/feedback-banner";
import { AdminAuditLogBoard } from "@/components/admin-audit-log-board";
import { AdminUserManagement } from "@/components/admin-user-management";
import { AdminRankGroups } from "@/components/admin-rank-groups";
import { AdminConfigCatalogs } from "@/components/admin-config-catalogs";
import { AdminInfrastructureBoard } from "@/components/admin-infrastructure-board";
import { requirePermission } from "@/lib/auth";
import {
} from "@/app/(protected)/beheer/actions";
import {
  getAdminAuditLogs,
  getInfrastructureHealth,
  getManagedPatientStatuses,
  getManagedReportTypes,
  getManagedUsers,
  getManagedWarningBadges,
  getPermissionCatalog,
  getRankPermissionGroups,
} from "@/lib/admin";
import { readFeedback } from "@/lib/feedback";

type BeheerPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

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
    getAdminAuditLogs(),
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
      detail: logs[0]
        ? `Laatste: ${new Date(logs[0].createdAt).toLocaleString("nl-BE")}`
        : "Nog geen logitems",
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

      <AdminInfrastructureBoard health={health} />

      <AdminUserManagement
        users={users}
        permissions={permissions}
        rankGroups={rankGroups}
        serviceRoleConfigured={health.serviceRoleConfigured}
      />
      <AdminRankGroups rankGroups={rankGroups} permissions={permissions} />
      <AdminConfigCatalogs
        reportTypes={reportTypes}
        warningBadges={warningBadges}
        patientStatuses={patientStatuses}
      />

      <section className="w-full">
        <AdminAuditLogBoard logs={logs} />
      </section>
    </main>
  );
}
