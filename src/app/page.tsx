import Link from "next/link";
import { getAppSession, hasPermission } from "@/lib/auth";

const quickLinks = [
  {
    href: "/zorg/patienten",
    title: "Patiëntenregister",
    description: "Open dossiers, cases en rapporten voor de lopende zorgopvolging.",
  },
  {
    href: "/personeel",
    title: "Personeelslijst",
    description: "Bekijk medewerkers, evaluaties, afwezigheden en personeelsdossiers.",
  },
  {
    href: "/organisatie",
    title: "Organisatie",
    description: "Interne opvolging van meetings, verslagen en planning.",
  },
  {
    href: "/handboek",
    title: "Handboek",
    description: "Richtlijnen, procedures en operationele afspraken.",
  },
  {
    href: "/beheer",
    title: "Beheer",
    description: "Auditlog, beheermodules en centrale configuratie van de applicatie.",
  },
];

const newsItems = [
  {
    category: "Intern bericht",
    title: "Nieuwe overdrachtsrichtlijn actief vanaf deze week",
    summary:
      "Alle EMS-teams gebruiken voortaan het bijgewerkte sjabloon voor mondelinge en schriftelijke overdracht na transport.",
    publishedAt: "15 mei 2026",
  },
  {
    category: "Opleiding",
    title: "Trauma-refresh voor senioren en stagiairs",
    summary:
      "Volgende week start een extra trainingsblok rond triage, scene control en snelle letselbeoordeling.",
    publishedAt: "14 mei 2026",
  },
  {
    category: "HR",
    title: "Evaluatieronde Q2 staat open",
    summary:
      "Leidinggevenden kunnen vanaf nu de evaluaties voor het tweede kwartaal registreren in de personeelsmodule.",
    publishedAt: "13 mei 2026",
  },
];

const agendaItems = [
  {
    day: "Ma 18",
    title: "Briefing leiding & dispatch",
    time: "19:00 - 19:30",
    location: "Vergaderzaal A",
    type: "Meeting",
  },
  {
    day: "Wo 20",
    title: "Training advanced trauma care",
    time: "20:00 - 21:30",
    location: "Opleidingslokaal",
    type: "Training",
  },
  {
    day: "Vr 22",
    title: "Nazicht procedures opnameflow",
    time: "18:30 - 19:15",
    location: "Briefing room",
    type: "Meeting",
  },
  {
    day: "Zo 24",
    title: "Scenario-oefening MCI",
    time: "21:00 - 22:00",
    location: "Simulatiezone",
    type: "Training",
  },
];

export default async function Home() {
  const session = await getAppSession();
  const welcomeName = session?.fullName ?? "medewerker";
  const filteredQuickLinks = quickLinks.filter((link) => {
    if (!session) return link.href !== "/beheer";
    if (link.href === "/beheer") return hasPermission(session, "config.panel.read");
    if (link.href === "/personeel") return hasPermission(session, "staff.read_basic");
    if (link.href === "/zorg/patienten") return hasPermission(session, "patients.read");
    return true;
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-8 md:px-10 lg:px-12">
      <section className="grid gap-6 rounded-[2rem] border border-[var(--color-line-strong)] bg-[radial-gradient(circle_at_top_left,_rgba(82,210,255,0.22),_transparent_30%),linear-gradient(145deg,_var(--color-hero-start),_var(--color-hero-end))] p-8 text-[var(--color-hero-ink)] shadow-[0_30px_80px_rgba(4,28,44,0.28)] md:grid-cols-[1.15fr_0.85fr] md:p-10">
        <div className="space-y-5">
          <div className="inline-flex items-center rounded-full border border-white/18 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
            Welkom bij Vespucci Hospitaal
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-50/72">
              Welkom terug, {welcomeName}
            </p>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
              Intern portaal voor de dagelijkse werking.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-cyan-50/84 md:text-lg">
              Dit portaal bundelt de dagelijkse werking van het hospitaal:
              behandelingen, opleidingen, personeelsbeheer en interne communicatie
              in één online omgeving.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/organisatie"
              className="rounded-full border border-white/22 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/8"
            >
              Bekijk planning
            </Link>
            <Link
              href="/personeel"
              style={{ backgroundColor: "#b9eeff", color: "#08344b" }}
              className="rounded-full px-5 py-3 text-sm font-semibold shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition hover:brightness-95"
            >
              Open de personeelslijst
            </Link>
          </div>
        </div>

        <article className="rounded-[1.6rem] border border-white/12 bg-white/8 p-6 backdrop-blur">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-50/65">
            Bericht van de directie
          </p>
          <h2 className="mt-3 text-2xl font-semibold">Samen sterk in zorg en discipline</h2>
          <p className="mt-4 text-sm leading-7 text-cyan-50/82">
            Onze dienst draait op professionaliteit, rust onder druk en vertrouwen in elkaar.
            Blijf zorgvuldig rapporteren, steun nieuwe collega&apos;s in hun groei en bewaak
            de kwaliteit van elke overdracht. Jullie inzet bepaalt de standaard van onze afdeling.
          </p>
          <p className="mt-5 text-sm font-semibold text-cyan-50/88">Directie EMS</p>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Snellinks
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
                Direct naar je werkmodules
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {filteredQuickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-5 transition hover:-translate-y-0.5 hover:border-[var(--color-line-strong)] hover:shadow-[var(--shadow-soft)]"
              >
                <h3 className="text-lg font-semibold text-[var(--color-ink)]">{link.title}</h3>
                <p className="mt-3 max-w-[28ch] text-sm leading-6 text-[var(--color-muted)]">
                  {link.description}
                </p>
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-[var(--color-line)] bg-[linear-gradient(180deg,_var(--color-surface-alt),_var(--color-panel-strong))] p-6 shadow-[var(--shadow-soft)]">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Kalender
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
            Meetings en trainingen
          </h2>

          <div className="mt-6 grid gap-4">
            {agendaItems.map((item) => (
              <article
                key={`${item.day}-${item.title}`}
                className="grid gap-4 rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-4 md:grid-cols-[0.22fr_1fr]"
              >
                <div className="rounded-2xl bg-[var(--color-accent-soft)] px-4 py-3 text-center">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-strong)]">
                    {item.day}
                  </p>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-[var(--color-ink)]">
                      {item.title}
                    </h3>
                    <span className="rounded-full border border-[var(--color-line)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                      {item.type}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">
                    {item.time} · {item.location}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-panel-strong)] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Nieuws
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
              Laatste interne updates
            </h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          {newsItems.map((item) => (
            <article
              key={item.title}
              className="rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-strong)]">
                {item.category}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-[var(--color-ink)]">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                {item.summary}
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                {item.publishedAt}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
