export const APP_SECTIONS = [
  {
    href: "/zorg",
    kicker: "Sectie 01",
    title: "Zorg",
    description:
      "Patiëntendossiers, trauma- en opnamerapporten, behandelingen, medicatie en kosten.",
  },
  {
    href: "/personeel",
    kicker: "Sectie 02",
    title: "Personeel",
    description:
      "Personeelslijst, evaluaties, afwezigheden en specialisatiebeheer met restricted toegang.",
  },
  {
    href: "/organisatie",
    kicker: "Sectie 03",
    title: "Organisatie",
    description:
      "Meetingaanvragen, interne verslagen en administratieve opvolging van afdelingswerking.",
  },
  {
    href: "/handboek",
    kicker: "Sectie 04",
    title: "Handboek",
    description:
      "Richtlijnen, procedures en kennisartikels met versiebeheer en publicatiestatus.",
  },
  {
    href: "/beheer",
    kicker: "Sectie 05",
    title: "Beheer",
    description:
      "Auditlog, centrale configuratie, rapporttypen, tags en toekomstig databasebeheer.",
  },
] as const;

export const MVP_MODULES = [
  {
    slug: "patientendossiers",
    name: "Patiëntendossiers",
    summary: "Basisdossier per patiënt, gekoppeld aan citizenid en casussen.",
  },
  {
    slug: "rapport-trauma",
    name: "Traumarapport",
    summary: "Gestandaardiseerd verslag voor acute letsels en eerste zorgen.",
  },
  {
    slug: "rapport-opname",
    name: "Opnamerapport",
    summary: "Registratie van hospitalisatie, observaties en opnameplan.",
  },
  {
    slug: "behandeling",
    name: "Behandeling",
    summary: "Registratie van handelingen, zorgen en medicatietoediening.",
  },
  {
    slug: "kostencalculator",
    name: "Kostencalculator",
    summary: "Afzonderlijke maar gekoppelde berekeningslaag voor kostenregels.",
  },
  {
    slug: "personeelslijst",
    name: "Personeelslijst",
    summary: "Overzicht van EMS-medewerkers, rang en specialisaties.",
  },
  {
    slug: "evaluaties",
    name: "Evaluaties",
    summary: "HR-opvolging voor prestaties, feedback en besluiten.",
  },
  {
    slug: "afwezigheid",
    name: "Afwezigheid",
    summary: "Aanvragen en goedkeuring van afwezigheden of beschikbaarheidsblokken.",
  },
  {
    slug: "specialisatiebeheer",
    name: "Specialisatiebeheer",
    summary: "Toewijzing en opvolging van medische specialisaties.",
  },
  {
    slug: "meetingaanvragen",
    name: "Meetingaanvragen",
    summary: "Formaliseren van aanvragen, doelen en deelnemers.",
  },
  {
    slug: "meetingverslagen",
    name: "Meetingverslagen",
    summary: "Opslag van notulen, actiepunten en follow-up per meeting.",
  },
  {
    slug: "handboek",
    name: "Handboek",
    summary: "Interne richtlijnen, procedures en afdelingsinformatie.",
  },
] as const;
