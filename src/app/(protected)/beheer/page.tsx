import { PatientAuditLogBoard } from "@/components/patient-audit-log-board";
import { requirePermission } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import {
  getAllPatientAuditLogs,
  getPatientManagementSnapshot,
  getPatientWorkspaceRows,
} from "@/lib/patients";
import { getAllMedicalReports } from "@/lib/reports";
import type { MedicalReportType, PatientStatus } from "@/types/domain";

const reportTypeCatalog: Array<{
  type: MedicalReportType;
  title: string;
  status: "Actief" | "Voorbereid";
  summary: string;
  formFields: number;
  colorClass: string;
}> = [
  {
    type: "trauma",
    title: "Traumarapport",
    status: "Actief",
    summary: "Acute letsels, triage, interventies en transportbeslissing.",
    formFields: 10,
    colorClass: "bg-[#ffe8d5] text-[#a14f00]",
  },
  {
    type: "opname",
    title: "Opnamerapport",
    status: "Actief",
    summary: "Hospitalisatie, observatieplan, klinische status en vervolgzorg.",
    formFields: 11,
    colorClass: "bg-[#dff6ff] text-[#0f5f8f]",
  },
  {
    type: "evaluatie_medisch",
    title: "Medische evaluatie",
    status: "Voorbereid",
    summary: "Toekomstige evaluatieflow voor specialistische of langdurige opvolging.",
    formFields: 0,
    colorClass: "bg-[#efeaff] text-[#5f43b2]",
  },
  {
    type: "extern",
    title: "Extern verslag",
    status: "Voorbereid",
    summary: "Reservemodule voor externe documenten of doorgestuurde medische info.",
    formFields: 0,
    colorClass: "bg-[#edf5fb] text-[#35566c]",
  },
];

const patientStatusCatalog: Array<{
  key: PatientStatus;
  label: string;
  colorClass: string;
}> = [
  {
    key: "actief_in_behandeling",
    label: "Actief in behandeling",
    colorClass: "bg-[#ffe4e8] text-[#a33b4f]",
  },
  { key: "opgenomen", label: "Opgenomen", colorClass: "bg-[#fff1db] text-[#9a5b00]" },
  { key: "observatie", label: "Observatie", colorClass: "bg-[#fff7cc] text-[#8a6b00]" },
  {
    key: "stabiel_ontslagen",
    label: "Stabiel / ontslagen",
    colorClass: "bg-[#ddf7e5] text-[#1f7a3a]",
  },
  { key: "overleden", label: "Overleden", colorClass: "bg-[#e5e7eb] text-[#374151]" },
  {
    key: "forensisch_politie",
    label: "Forensisch / politie",
    colorClass: "bg-[#efeaff] text-[#5f43b2]",
  },
];

const databaseAreas = [
  {
    title: "Rapporttypenbeheer",
    summary: "Beschikbare medische formulieren, status en toekomstige uitbreidingen.",
  },
  {
    title: "Tags en badges",
    summary: "Waarschuwingstags, patiëntbadges en statuslabels voor medische dossiers.",
  },
  {
    title: "Databasebeheer",
    summary: "Datastatus, demomodus versus Supabase en zicht op operationele inhoud.",
  },
];

function formatDateTime(value?: string | null) {
  if (!value) return "Nog geen activiteit";
  return new Date(value).toLocaleString("nl-BE");
}

export default async function BeheerPage() {
  await requirePermission("config.panel.read");

  const [logs, patients, snapshot, reports] = await Promise.all([
    getAllPatientAuditLogs(),
    getPatientWorkspaceRows(),
    getPatientManagementSnapshot(),
    getAllMedicalReports(),
  ]);

  const reportTypeUsage = reports.reduce<Record<string, number>>((accumulator, report) => {
    accumulator[report.type] = (accumulator[report.type] ?? 0) + 1;
    return accumulator;
  }, {});

  const badgeUsage = snapshot.patients.reduce<Record<string, number>>((accumulator, patient) => {
    for (const badge of patient.warningBadges ?? []) {
      accumulator[badge] = (accumulator[badge] ?? 0) + 1;
    }
    return accumulator;
  }, {});

  const patientStatusUsage = snapshot.patients.reduce<Record<string, number>>(
    (accumulator, patient) => {
      if (patient.status) {
        accumulator[patient.status] = (accumulator[patient.status] ?? 0) + 1;
      }
      return accumulator;
    },
    {},
  );

  const knownBadges = Object.entries(badgeUsage)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "nl-BE"));

  const latestAuditLog = logs[0]?.createdAt ?? null;
  const latestPatientUpdate =
    snapshot.patients
      .map((patient) => patient.updatedAt ?? patient.createdAt ?? null)
      .filter(Boolean)
      .sort((left, right) => String(right).localeCompare(String(left)))[0] ?? null;

  const databaseCards = [
    {
      title: "Patiëntfiches",
      value: snapshot.patients.length,
      detail: `${snapshot.cases.length} cases gekoppeld`,
    },
    {
      title: "Medische rapporten",
      value: reports.length,
      detail: `${reportTypeUsage.trauma ?? 0} trauma · ${reportTypeUsage.opname ?? 0} opname`,
    },
    {
      title: "Auditlog-items",
      value: logs.length,
      detail: `Laatste item: ${formatDateTime(latestAuditLog)}`,
    },
    {
      title: "Laatste dossierwijziging",
      value: latestPatientUpdate ? formatDateTime(latestPatientUpdate) : "Nog geen data",
      detail: hasSupabaseEnv() ? "Bron: Supabase" : "Bron: demostore",
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 lg:px-12">
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Beheerpaneel
          </p>
          <p className="mt-2 text-4xl font-semibold text-[var(--color-ink)]">4</p>
        </article>
        <article className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Auditlog-items
          </p>
          <p className="mt-2 text-4xl font-semibold text-[var(--color-ink)]">{logs.length}</p>
        </article>
        <article className="rounded-[1.5rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Patiëntfiches
          </p>
          <p className="mt-2 text-4xl font-semibold text-[var(--color-ink)]">{patients.length}</p>
        </article>
      </section>

      <section className="rounded-[1.75rem] border border-[var(--color-line-strong)] bg-[radial-gradient(circle_at_top_left,_rgba(82,210,255,0.16),_transparent_34%),linear-gradient(145deg,_var(--color-hero-start),_var(--color-hero-end))] p-8 text-[var(--color-hero-ink)] shadow-[0_30px_80px_rgba(4,28,44,0.24)]">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-50/70">Beheer</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
          Centrale beheerspagina voor de EMS webapp
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-cyan-50/84">
          Deze pagina bundelt auditcontrole, centrale configuratie en operationeel overzicht
          van de medische datalaag. De drie beheerblokken hieronder vormen de basis voor
          rapporttypes, tags en toekomstig databasebeheer.
        </p>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {databaseAreas.map((area) => (
            <article
              key={area.title}
              className="rounded-[1.25rem] border border-white/12 bg-white/6 px-5 py-4 backdrop-blur"
            >
              <h2 className="text-lg font-semibold text-white">{area.title}</h2>
              <p className="mt-2 text-sm leading-6 text-cyan-50/76">{area.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
          Databasebeheer
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
          Operationeel data-overzicht
        </h2>

        <div className="mt-6 grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
          {databaseCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-5"
            >
              <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
                {card.title}
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--color-ink)]">
                {card.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                {card.detail}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-5 rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-ink)]">
                Huidige datamodus
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                De app draait momenteel in {hasSupabaseEnv() ? "Supabase-modus" : "demomodus"}.
                Dit overzicht helpt later bij seedbeheer, datacontrole en migraties.
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                hasSupabaseEnv()
                  ? "bg-[#ddf7e5] text-[#1f7a3a]"
                  : "bg-[#fff1db] text-[#9a5b00]"
              }`}
            >
              {hasSupabaseEnv() ? "Supabase actief" : "Demostore actief"}
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Rapporttypenbeheer
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
            Beschikbare medische formulieren
          </h2>

          <div className="mt-6 grid gap-4">
            {reportTypeCatalog.map((reportType) => (
              <article
                key={reportType.type}
                className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-[var(--color-ink)]">
                        {reportType.title}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${reportType.colorClass}`}
                      >
                        {reportType.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                      {reportType.summary}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                      Gebruik
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                      {reportTypeUsage[reportType.type] ?? 0}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-sm text-[var(--color-muted)]">
                  <span className="rounded-full border border-[var(--color-line)] px-3 py-1">
                    Type: {reportType.type}
                  </span>
                  <span className="rounded-full border border-[var(--color-line)] px-3 py-1">
                    Velden: {reportType.formFields}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Tags en badges
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
            Waarschuwingslabels en patiëntstatus
          </h2>

          <div className="mt-6 rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <h3 className="text-lg font-semibold text-[var(--color-ink)]">
              Actieve badgebibliotheek
            </h3>
            <div className="mt-4 flex flex-wrap gap-3">
              {knownBadges.length ? (
                knownBadges.map(([badge, count]) => (
                  <span
                    key={badge}
                    className="rounded-full border border-[var(--color-line)] bg-[var(--color-panel)] px-3 py-2 text-sm font-semibold text-[var(--color-ink)]"
                  >
                    {badge} · {count}
                  </span>
                ))
              ) : (
                <p className="text-sm text-[var(--color-muted)]">
                  Er zijn nog geen actieve waarschuwingstags in de huidige dataset.
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <h3 className="text-lg font-semibold text-[var(--color-ink)]">
              Statusmatrix patiëntfiches
            </h3>
            <div className="mt-4 grid gap-3">
              {patientStatusCatalog.map((statusItem) => (
                <div
                  key={statusItem.key}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-3"
                >
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${statusItem.colorClass}`}
                  >
                    {statusItem.label}
                  </span>
                  <span className="text-sm font-semibold text-[var(--color-ink)]">
                    {patientStatusUsage[statusItem.key] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>

      <section className="w-full">
        <PatientAuditLogBoard logs={logs} />
      </section>
    </main>
  );
}
