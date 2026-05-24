# Fase 11: Tenant Operations & Governance Automation

Status: afgerond op 2026-05-24

## Doel

Na de multi-tenant basis (fase 10) verschuift fase 11 naar operationeel beheer:

1. tenants veilig kunnen beheren
2. gebruikers correct per tenant onboarden
3. regressies geautomatiseerd blijven afvangen

## Scope

1. Tenantbeheer in beheeromgeving
- tenants aanmaken/bewerken
- tenant actief/inactief zetten
- basis metadata beheren (label/code/flags)

2. Onboarding en activatieflow
- nieuwe auth-user koppelen aan juiste tenant
- activatieregels afdwingen (`citizenid`, profielstatus, permissies)
- audittrail op alle beheermutaties

3. Tenant-context en operator controls
- duidelijke actieve tenantcontext voor beheeracties
- alleen bevoegde rollen mogen tenant-overstijgende acties

4. Regressie-automatisatie
- cross-tenant UI/API checks opnemen in CI
- vaste PASS/FAIL matrix per deploy

5. Operations runbook
- onboarding/offboarding stappen
- incident-respons bij tenant-isolatie issues

## Definition of Done

Fase 11 is afgerond wanneer:

1. tenant lifecycle beheerbaar is via UI + SQL-policy-safe backend
2. onboardingflow zonder handmatige SQL hacks kan
3. cross-tenant regressietests reproduceerbaar in CI draaien
4. operator runbook en controlepunten gedocumenteerd zijn

## Uitvoervolgorde

1. tenantbeheer UI + server actions
2. onboardingflow hardening + audit
3. CI regressiepipeline voor tenant-isolatie
4. runbook en overdracht

## Oplevering

1. Tenantbeheer in `/beheer`:
- tenant aanmaken
- tenant code/label bewerken
- tenant actief/inactief zetten
- default tenant beveiligd tegen deactivatie

2. Onboarding hardening:
- gebruiker krijgt tenantkoppeling bij create/update
- enkel actieve tenants zijn selecteerbaar in onboarding UI
- server-side guardrail blokkeert inactieve tenantselectie

3. CI tenant-isolatie:
- aparte Playwright lane `test:e2e:tenant`
- workflow gate `e2e-cross-tenant-isolation` op `main` wanneer secrets aanwezig zijn

4. Governance:
- tenant lifecycle runbook toegevoegd (onboarding/offboarding/incident)
- release workflow robuuster gemaakt voor env/runtime randgevallen
