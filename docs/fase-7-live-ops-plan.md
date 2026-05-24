# Fase 7: Live Ops & Kwaliteitsschaal

## Doel

Fase 7 maakt releases betrouwbaarder door monitoring, extra regressiechecks, security-routines en rollback-voorbereiding.

## Uitgevoerde stappen

### 1) Observability-baseline

- `GET /api/health` toegevoegd voor snelle runtime/data-health status.
- Referentie: `docs/observability-baseline.md`.

### 2) E2E-suite uitbreiding

- Nieuwe test: `tests/e2e/auth-and-access.spec.ts`.
- Dekt:
  - redirect naar login op protected route zonder sessie
  - toegang tot `/zorg`, `/personeel`, `/beheer` na login
  - health endpoint response-structuur

### 3) Performance review (kritieke query)

- `getAdminAuditLogs()` dedupliceert nu target IDs vóór `.in(...)` queries.
- Impact: minder payload en minder onnodige `IN` waarden bij grotere auditlogs.

### 4) Security review routine

- Workflow toegevoegd: `.github/workflows/security-audit.yml`
- Draait wekelijks en manueel:
  - `npm ci`
  - `npm audit --omit=dev --audit-level=high`

### 5) Release-automatie en rollback-voorbereiding

- CI uitgebreid met `e2e-smoke` job in `.github/workflows/ci.yml`.
- Deploy-workflow schrijft nu deployment URL + commit naar GitHub Summary:
  - `.github/workflows/vercel-production.yml`

## Rollback drill (operationeel)

Bij incident:
1. Zoek laatste gezonde deployment URL in Vercel.
2. Redeploy die deployment via Vercel UI (of CLI `vercel redeploy <deployment-url>`).
3. Voer `docs/post-deploy-smoke-checklist.md` volledig opnieuw uit.
4. Log incident en root cause in governance-notities.

## Exit criteria Fase 7

- Health endpoint actief.
- CI bevat lint/build/runtime + e2e smoke.
- Wekelijkse security-audit actief.
- Deploy-resultaat (URL + commit) automatisch geregistreerd.
