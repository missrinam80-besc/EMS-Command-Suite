# Backlog v1

## Fase 1: platformfundering (afgerond)

- [x] Supabase project configureren
- [x] auth flows opzetten
- [x] profielactivatie met `citizenid`
- [x] ranks, permissions en specialisaties modelleren
- [x] middleware en protected routes opzetten

## Fase 2: zorgkern (afgerond)

- [x] patientenlijst
- [x] patientdetail
- [x] casusoverzicht
- [x] traumaformulier
- [x] opnameformulier
- [x] behandelingsregistratie
- [x] medicatieregistratie
- [x] kostencalculator

## Fase 3: personeel (afgerond)

- [x] personeelslijst
- [x] profielbeheer medewerker
- [x] evaluatieformulier
- [x] evaluatiehistoriek
- [x] specialisatietoewijzing
- [x] afwezigheidsaanvraag
- [x] afwezigheidsgoedkeuring

## Fase 4: organisatie (afgerond)

- [x] meetingaanvraag
- [x] meetings beheren
- [x] notulen editor
- [x] actiepunten en follow-up

## Fase 5: handboek

- [x] richtlijnencategorieen
- [x] rich text richtlijnpaginas
- [x] publicatiestatus draft/published/archived
- [x] zichtbaarheid per rank of specialisatie

## Fase 6: governance

- [x] audit logging
- [x] admin-overzicht permissies
- [x] seed scripts voor basisdata
- [x] export- en rapportagepaden
- [x] release-hardening runbook en verplichte runtime-regressie in CI

## Fase 7: live ops & kwaliteitsschaal

- [x] observability-baseline (`/api/health`, release monitoring en incident-triage flow)
- [x] e2e-suite uitbreiden (login, permissies, beheer kernflows)
- [x] performance review op kritieke queries + cachingkansen
- [x] security review (RLS/policy check, secret-rotatie, dependency audit)
- [x] rollback-drill en release-automatie verder dichtzetten

## Fase 8: data intelligence & beslissingsondersteuning

- [x] KPI snapshot-laag met trends en 30d venster
- [x] intelligence dashboard op `/beheer/intelligence`
- [x] data quality checks + alertsignalen
- [x] export 2.0 met datumfilters (`/api/exports/audit`, `/api/exports/reports`, `/api/exports/kpi`)
- [x] rolgebaseerde afscherming op intelligence/export endpoints

## Fase 9: integraties & automatisatie

- [x] webhook endpointbeheer in UI (`/beheer/integraties`)
- [x] delivery logging + retry + idempotency sleutel
- [x] automation jobs + run history (`daily_kpi_digest`, `open_cases_reminder`)
- [x] API trigger voor jobs (`POST /api/automation/run`)
- [x] scheduled automation workflow + beheer-trigger + audittrail

## Fase 10: schaalbaarheid & multi-tenant readiness

- [x] tenant basismodel (`tenants` + default tenant)
- [x] tenant_id op kernentiteiten met indexes/backfill/defaulting
- [x] intelligence tenant-aware context en scoping
- [x] integraties/automation tenant-aware scoping
- [x] RLS policies van alle modules volledig tenant-restrictive maken
- [x] tweede tenant onboarding + cross-tenant regressietest (live uitgevoerd en geslaagd)

## Fase 11: tenant operations & governance automation

- [x] fase-scope en implementatieplan vastgelegd
- [x] tenantbeheer in UI (aanmaken, activeren/deactiveren, metadata)
- [x] veilige tenant user-onboarding flow (activatie + tenant-koppeling)
- [x] tenant-switch/tenant-context controls voor bevoegde beheerders
- [x] uitgebreide cross-tenant regressiesuite (UI + API) in CI
- [x] operationeel runbook voor tenant lifecycle (onboarding, offboarding, incident)

## Fase 12: delegated tenant administration & approval workflows

- [x] fase-scope en implementatieplan vastgelegd
- [x] tenant_admin rolmodel en permissies toevoegen
- [x] beheersacties opsplitsen (global admin vs tenant admin)
- [ ] goedkeuringsflow voor gevoelige tenantmutaties (2-step approve)
- [ ] audit uitbreiden met approval chain metadata
- [x] regressietests voor delegated admin rechtenmodel

## Fase-overgang (status 2026-05-23)

Afgerond in deze iteratie:

- runtime builder voor trauma/opname (nieuw, bewerken, detail)
- conditionele operatoren end-to-end (`equals`, `not_equals`, `contains`, `not_contains`, `truthy`, `falsy`, `gt`, `lt`, `in`, `not_in`)
- server-side mapping en validatie-hardening
- `NEXT_REDIRECT` handling gefixt in rapport server actions
- runtime regressietests (`npm run test:runtime`)
- post-deploy smoke-checklist vastgelegd en op productie ingevuld
- handboek fase 5 volledig afgewerkt (categoriebeheer, rich text, statusbeheer, zichtbaarheid op rank/specialisatie)

Nog open voor formele fase-overgang:

- geen open punten in fase 5; klaar voor volgende faseplanning
