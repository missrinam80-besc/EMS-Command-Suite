# Technisch ontwerp

## Doel

Bouw een zelfstandige EMS webapp voor browsergebruik, zonder directe gameplay-koppeling, met centrale opslag in Supabase.

## Uitgangspunten

- taal: Nederlands
- login via webapp en Supabase Auth
- RP-identiteit via `citizenid`
- framework-context: qbox, maar zonder runtime-integratie
- standalone RP-ondersteunende tool

## Kernmodules v1

- patientendossiers
- traumarapport
- opnamerapport
- behandeling
- medicatie-overzicht binnen dossiers
- kostencalculator
- personeelslijst
- evaluaties
- specialisatiebeheer
- afwezigheidmeldingen
- meetingaanvragen
- meetingverslagen
- handboek/richtlijnen

## Architectuur

### Frontend

- Next.js App Router
- server-rendered shell waar nuttig
- client forms voor rapporten en beheerschermen
- runtime template rendering voor trauma/opname rapporten via centrale builder

### Backend

- Supabase Auth voor login
- Supabase Postgres voor relationele opslag
- Supabase Storage voor bijlagen
- Row Level Security voor toegangscontrole

### Autorisatie

Autorisatie gebeurt in drie lagen:

1. `profiles.rank_id`
2. gekoppelde capabilities via `rank_permissions`
3. extra ontsluiting via `profile_specializations`

Specialisaties geven dus geen login, maar wel extra domeintoegang.

## Navigatie

### Zorg

- dossiers
- trauma
- opname
- behandeling
- medicatie
- kosten

### Personeel

- personeelslijst
- evaluaties
- specialisaties
- afwezigheid

### Organisatie

- meetingaanvragen
- meetings
- verslagen

### Handboek

- richtlijnen
- procedures
- interne informatie

## Identiteitsmodel

Technisch wordt elke gebruiker geidentificeerd via `auth.users.id`.

Zakelijk worden twee identiteiten onderscheiden:

- `profiles.citizenid`
  De RP-identiteit van een EMS-medewerker
- `patients.citizenid`
  De RP-identiteit van een patient/burger

Deze scheiding voorkomt dat personeelstabellen en patientendossiers door elkaar lopen.

## RLS-strategie

RLS wordt opgebouwd rond helperfuncties zoals:

- `auth_profile_id()`
- `has_capability(capability text)`
- `has_specialization(code text)`

Voorbeeldregels:

- alleen users met `patients.read` zien patienten
- alleen users met `staff.write` wijzigen personeel
- evaluaties alleen zichtbaar voor evaluator, geevalueerde en leiding
- richtlijnen kunnen publiek binnen EMS zijn, of beperkt per specialisatie

## Audit logging

Elke gevoelige write-operatie moet een auditrecord krijgen met:

- actor profile id
- action
- entity type
- entity id
- metadata jsonb
- timestamp

## Runtime template-engine (actuele uitbreiding)

Voor rapporttypes (`trauma`, `opname`) wordt de formulierstructuur dynamisch opgebouwd:

1. actieve report-template ophalen uit `form_templates`
2. actieve velden ophalen uit `form_template_fields`
3. conditionele zichtbaarheid evalueren in UI
4. server-side conditionele validatie forceren
5. opslag van dynamische velden in `medical_reports.content`

Conditionele operators die ondersteund worden:

- `equals`, `not_equals`
- `contains`, `not_contains`
- `truthy`, `falsy`
- `gt`, `lt`
- `in`, `not_in`

## Niet in v1

- gameplay-sync met Wasabi of OP MDT
- live dispatch
- realtime statusborden
- publieke patientportal
- meertaligheid
