import { FeedbackBanner } from "@/components/feedback-banner";
import Link from "next/link";
import { AdminAuditLogBoard } from "@/components/admin-audit-log-board";
import { AdminUserManagement } from "@/components/admin-user-management";
import { AdminRankGroups } from "@/components/admin-rank-groups";
import { AdminConfigCatalogs } from "@/components/admin-config-catalogs";
import { AdminInfrastructureBoard } from "@/components/admin-infrastructure-board";
import { AdminPlatformConfigBoard } from "@/components/admin-platform-config-board";
import { AdminTenantOperationsBoard } from "@/components/admin-tenant-operations-board";
import { requirePermission } from "@/lib/auth";
import {
  getAdminAuditLogs,
  getManagedBodyParts,
  getManagedFeatureFlags,
  getManagedHospitalConfig,
  getManagedInjuryTypes,
  getManagedMedicationCatalog,
  getManagedNavigationItems,
  getInfrastructureHealth,
  getManagedPatientStatuses,
  getManagedRanks,
  getManagedTreatmentRules,
  getManagedTenants,
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
    ranks,
    permissions,
    rankGroups,
    warningBadges,
    patientStatuses,
    hospitalConfig,
    featureFlags,
    navigationItems,
    injuryTypes,
    bodyParts,
    medicationCatalog,
    treatmentRules,
    tenants,
    logs,
  ] = await Promise.all([
    getInfrastructureHealth(),
    getManagedUsers(),
    getManagedRanks(),
    getPermissionCatalog(),
    getRankPermissionGroups(),
    getManagedWarningBadges(),
    getManagedPatientStatuses(),
    getManagedHospitalConfig(),
    getManagedFeatureFlags(),
    getManagedNavigationItems(),
    getManagedInjuryTypes(),
    getManagedBodyParts(),
    getManagedMedicationCatalog(),
    getManagedTreatmentRules(),
    getManagedTenants(),
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

      <section className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
        <p className="text-sm uppercase tracking-[0.16em] text-[var(--color-muted)]">
          Geavanceerd beheer
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
          Rapporten en formulieren
        </h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Gebruik de builderpagina om rapporttypen en formuliertypen samen te beheren met velden.
        </p>
        <div className="mt-4">
          <Link
            href="/beheer/rapporten-formulieren"
            className="inline-flex rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:brightness-105"
          >
            Open rapporten & formulieren builder
          </Link>
          <Link
            href="/beheer/intelligence"
            className="ml-3 inline-flex rounded-full border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
          >
            Open intelligence dashboard
          </Link>
          <Link
            href="/beheer/integraties"
            className="ml-3 inline-flex rounded-full border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
          >
            Open integraties & automations
          </Link>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
        <p className="text-sm uppercase tracking-[0.16em] text-[var(--color-muted)]">
          Export en rapportage
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
          Data exports
        </h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Exporteer auditlog en medische rapportmetadata als CSV voor governance en rapportage.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/api/exports/audit"
            className="inline-flex rounded-full border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
          >
            Exporteer auditlog (CSV)
          </Link>
          <Link
            href="/api/exports/reports"
            className="inline-flex rounded-full border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-accent-soft)]"
          >
            Exporteer rapporten (CSV)
          </Link>
        </div>
      </section>

      <AdminUserManagement
        users={users}
        permissions={permissions}
        rankGroups={rankGroups}
        serviceRoleConfigured={health.serviceRoleConfigured}
        tenants={tenants}
      />
      <AdminRankGroups ranks={ranks} rankGroups={rankGroups} permissions={permissions} />
      <AdminConfigCatalogs
        warningBadges={warningBadges}
        patientStatuses={patientStatuses}
      />
      <AdminPlatformConfigBoard
        hospitalConfig={hospitalConfig}
        featureFlags={featureFlags}
        navigationItems={navigationItems}
        injuryTypes={injuryTypes}
        bodyParts={bodyParts}
        medicationCatalog={medicationCatalog}
        treatmentRules={treatmentRules}
      />
      <AdminTenantOperationsBoard tenants={tenants} />

      <section className="w-full">
        <AdminAuditLogBoard logs={logs} />
      </section>
    </main>
  );
}
