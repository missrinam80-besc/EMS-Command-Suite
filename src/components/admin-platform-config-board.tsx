import type {
  ManagedFeatureFlag,
  ManagedHospitalConfig,
  ManagedMedicalCatalogItem,
  ManagedMedicationCatalogItem,
  ManagedNavigationItem,
  ManagedTreatmentRule,
} from "@/lib/admin";

type AdminPlatformConfigBoardProps = {
  hospitalConfig: ManagedHospitalConfig[];
  featureFlags: ManagedFeatureFlag[];
  navigationItems: ManagedNavigationItem[];
  injuryTypes: ManagedMedicalCatalogItem[];
  bodyParts: ManagedMedicalCatalogItem[];
  medicationCatalog: ManagedMedicationCatalogItem[];
  treatmentRules: ManagedTreatmentRule[];
};

type CountCard = {
  label: string;
  value: number;
  detail: string;
};

export function AdminPlatformConfigBoard({
  hospitalConfig,
  featureFlags,
  navigationItems,
  injuryTypes,
  bodyParts,
  medicationCatalog,
  treatmentRules,
}: AdminPlatformConfigBoardProps) {
  const cards: CountCard[] = [
    {
      label: "Hospital config",
      value: hospitalConfig.length,
      detail: hospitalConfig[0]?.hospitalName ?? "Nog geen ziekenhuisconfig",
    },
    {
      label: "Feature flags",
      value: featureFlags.length,
      detail: `${featureFlags.filter((item) => item.isEnabled).length} actief`,
    },
    {
      label: "Navigatie-items",
      value: navigationItems.length,
      detail: `${navigationItems.filter((item) => item.isActive).length} actief`,
    },
    {
      label: "Letseltypes",
      value: injuryTypes.length,
      detail: `${injuryTypes.filter((item) => item.isActive).length} actief`,
    },
    {
      label: "Lichaamsdelen",
      value: bodyParts.length,
      detail: `${bodyParts.filter((item) => item.isActive).length} actief`,
    },
    {
      label: "Medicatie",
      value: medicationCatalog.length,
      detail: `${medicationCatalog.filter((item) => item.isActive).length} actief`,
    },
    {
      label: "Treatment rules",
      value: treatmentRules.length,
      detail: `${treatmentRules.filter((item) => item.isActive).length} actief`,
    },
  ];

  return (
    <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
      <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
        Platformconfiguratie
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
        Sprint 1 fundamenten
      </h2>
      <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
        Dit overzicht toont de nieuwe configuratiegedreven tabellen voor ziekenhuisinstellingen,
        feature flags, navigatie en medische catalogi. In volgende sprint koppelen we hier
        volledige beheeracties op.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-[var(--color-ink)]">{card.value}</p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">{card.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
