Gebruik dit als startcontext voor dit project.

Project:
- Naam: Vespucci Hospitaal EMS Webapp
- Type: standalone EMS webapp in Next.js 16
- Taal: Nederlands
- Frontend: externe browserapp
- Backend: Supabase
- Auth: Supabase Auth met e-mail + wachtwoord
- Deployment target: Vercel
- RP-context: qbox, maar geen gameplay read/write
- Primaire RP-identiteit: `citizenid`

Belangrijkste productkeuzes:
- Dit is geen MDT-integratieproject maar een zelfstandige RP-ondersteunende webapp.
- Patiënten en personeel zijn gescheiden domeinen/tables.
- `auth user id` is de technische identity.
- `citizenid` is de RP-identiteit.
- Patiënten worden `soft deleted`.
- Auditlog is centraal, immutable en moet `before`, `after` en `changed_fields` bewaren.
- Demo-fallback mag lokaal bestaan, maar productie moet op echte Supabase-data draaien.

V1 scope:
- Dashboard portaal
- Patiëntenregister
- Patiëntenfiche
- Trauma- en opnamerapporten
- Cases voor complexe/specialistische opvolging
- Personeelslijst en personeelsdossiers
- Evaluaties, afwezigheden, beloningen, strikepoints
- Beheerpagina
- Auditlog

Rangen:
- rank_1 Medische Directie / Ziekenhuisdirectie
- rank_2 Operationele Leiding
- rank_3 Medisch Specialist / Arts
- rank_4 Senior EMS
- rank_5 EMS Personeel
- rank_6 Trainee

Extra loginrollen:
- administratie
- directie_assistent

Permissienotes:
- Directie ziet alles.
- Administratie en directie_assistent volgen voorlopig dezelfde rechten als operationele leiding.
- Operationele leiding heeft bewust geen toegang tot beheer/config/databasebeheer.
- Rank_5 en rank_6 mogen alleen eigen rapporten bewerken.
- Lagere rangen mogen een basis-personeelslijst zien zonder gevoelige details.
- Specialisatiegebaseerde extra rechten zijn voorbereid, maar de gedetailleerde matrix is nog niet definitief.

Specialisaties:
- ambulance
- spoed_trauma
- pit
- mug
- chirurgie
- diagnostiek
- forensisch
- psychologie_nazorg
- rescue
- tactische_medische_ondersteuning
- mentor_opleiding

Patiëntstatussen:
- actief_in_behandeling
- opgenomen
- observatie
- stabiel_ontslagen
- overleden
- forensisch_politie

Case-statussen:
- open
- afgesloten
- gearchiveerd
- in_onderzoek
- in_wacht

Patiëntenfiche:
- Identificatie: naam, citizenid, leeftijd/geboortedatum, telefoon, noodcontact
- Medisch: bloedgroep, allergieën, medicatie, chronische aandoeningen, medische waarschuwingen
- Beheer: aangemaakt door, laatst gewijzigd door
- Warning badges bovenaan
- Extra notities voor behandelende arts
- Cases apart van rapporten
- Rapporten openen vanuit fiche, maar bewerken pas op rapportfiche

Personeelsmodule:
- Lijstkolommen: roepnummer, naam, rang, specialisaties, status, detailactie
- Statuskleuren: actief groen, afwezig geel, non-actief rood
- Dossier bevat profieldata, specialisaties, beloningen, strikepoints, evaluaties, afwezigheden
- In dienst sinds is read-only
- Strikepoints vereisen reden bij toevoegen en verwijderen, met historiek zichtbaar

Beheerpagina:
- Databasebeheer bovenaan volle breedte
- Rapporttypenbeheer en tags/badges naast elkaar
- Auditlog onderaan volle breedte
- Rapporttypen, tags/badges en patiëntstatussen zijn beheerbaar via UI

Database/Supabase:
- `supabase/schema.sql` en `supabase/seed.sql` bestaan en zijn toegepast
- Centrale audit_logs tabel
- Storage buckets:
  - report-files
  - staff-files
  - meeting-files
  - images
- Productie seed moet minimaal blijven, geen nep-patiënten of nep-personeelsdata

Environment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_ENABLE_DEMO_AUTH=false`
- Gebruik voor `NEXT_PUBLIC_SUPABASE_URL` de project-URL zonder `/rest/v1/`
- `SUPABASE_SERVICE_ROLE_KEY` niet in Vercel zetten tenzij expliciet nodig

Huidige implementatiestatus:
- Supabase login werkt
- Eerste admin/directie-user bestaat
- Patiënten, rapporten, auditlog en grote delen van personeel zijn live gekoppeld aan Supabase
- Permissions worden geladen uit Supabase
- Pagina- en action-guards bestaan
- Feedback banners voor success/error zijn toegevoegd
- `npm run lint` en `npm run build` slagen

Belangrijke veiligheidsnotitie:
- De Supabase service role key is eerder gedeeld tijdens setup en moet vóór publieke productie geroteerd worden.

Waar nu verdergaan:
- Werk verder vanaf de huidige implementatiestatus
- Herbeslis de productscope niet opnieuw
- Focus op livegang, deployment, productie-hardening en resterende functionele afwerking

Voor volledige detailcontext:
- laad ook [C:\Users\linda\Documents\New project 2\ems-webapp\docs\project-context-export.json](C:/Users/linda/Documents/New%20project%202/ems-webapp/docs/project-context-export.json:1)
