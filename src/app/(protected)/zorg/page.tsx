import Link from "next/link";

const modules = [
  {
    title: "Patiëntendossiers",
    href: "/zorg/patienten",
    description:
      "Zoek, open en beheer patiënten op basis van citizenid met actuele casuscontext.",
  },
  {
    title: "Traumarapport",
    href: "#",
    description:
      "Eerste rapportbuilder voor acute letsels. In v2 nog als volgende stap gepland.",
  },
  {
    title: "Opnamerapport",
    href: "#",
    description:
      "Hospitalisatie en observatie structureren binnen hetzelfde patiëntendossier.",
  },
  {
    title: "Behandeling",
    href: "#",
    description:
      "Registratie van zorgacties, medicatie en behandelnotities per case.",
  },
];

export default function ZorgPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 lg:px-12">
      <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-8 shadow-[0_22px_45px_rgba(15,23,42,0.07)]">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
          Zorg
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
          Medische werkruimte
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-muted)]">
          Deze sectie wordt de centrale werkomgeving voor dossiers, rapporten,
          behandelingen en medicatie. De eerste bruikbare module in v2 is het
          patiëntenregister.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {modules.map((module) => (
          <Link
            key={module.title}
            href={module.href}
            className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-panel)] p-6 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
          >
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Module
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--color-ink)]">
              {module.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
              {module.description}
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
