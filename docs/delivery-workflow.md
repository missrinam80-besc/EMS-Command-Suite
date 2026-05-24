# Delivery Workflow

Dit project werkt met de volgende vaste flow.

## 1) Branching en PR-model

- Werk altijd op een featurebranch met prefix `codex/`.
- `main` is beschermd en wordt alleen bijgewerkt via Pull Requests.
- Elke PR naar `main` moet CI passeren (`lint` + `build`).

## 2) CI-policy

- Workflow: `.github/workflows/ci.yml`
- Triggers:
  - `pull_request` naar `main`
  - `push` naar `main`
- Checks:
  - `npm ci`
  - `npm run lint`
  - `npm run build`
  - `npm run test:runtime`
  - `npm run test:e2e`
  - `npm run test:e2e:tenant` (alleen op `main` wanneer tenant test-secrets aanwezig zijn)

Tenant-isolatie CI-secrets (Repository secrets):
- `E2E_TENANT_BASE_URL`
- `E2E_TENANT_A_EMAIL`
- `E2E_TENANT_A_PASSWORD`
- `E2E_TENANT_A_PATIENT_ID`
- `E2E_TENANT_A_PATIENT_LABEL` (optioneel)
- `E2E_TENANT_B_EMAIL`
- `E2E_TENANT_B_PASSWORD`
- `E2E_TENANT_B_PATIENT_ID`
- `E2E_TENANT_B_PATIENT_LABEL` (optioneel)

Opmerking:
- Zodra deze secrets ingevuld zijn, draait de job `e2e-cross-tenant-isolation` automatisch bij elke push naar `main`.

## 3) Deploy-policy

- Workflow: `.github/workflows/vercel-production.yml`
- Triggers:
  - automatische production deploy bij `push` naar `main`
  - manuele deploy via `workflow_dispatch`
- Vereiste GitHub Secrets:
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`

## 4) Eenmalige GitHub repository-instellingen

Zet branch protection op `main`:

- Require a pull request before merging
- Require status checks to pass before merging
- Selecteer status check: `lint-and-build`
- (aanrader) Require branches to be up to date before merging

## 5) Post-deploy smoke-check

Na elke deploy naar `main` moet de post-deploy smoke-check worden uitgevoerd:

- Zie: `docs/post-deploy-smoke-checklist.md`
- Minimale gates:
  - login/logout OK
  - toegang hoofdmodules OK (`/zorg`, `/personeel`, `/beheer`)
  - trauma + opname create/edit/detail OK
  - audit logs voor create/update aanwezig

## 6) Governance runbook

- Zie: `docs/governance-release-runbook.md`
- Gebruik dit document als vaste release- en incidentprocedure.

## 7) Security cadence

- Workflow: `.github/workflows/security-audit.yml`
- Frequentie:
  - wekelijks automatisch
  - manueel via `workflow_dispatch`

## 8) Automation cadence

- Workflow: `.github/workflows/automation-jobs.yml`
- Vereiste GitHub secrets:
  - `AUTOMATION_BASE_URL`
  - `AUTOMATION_CRON_TOKEN`
- Vereiste runtime env var in app:
  - `AUTOMATION_CRON_TOKEN`
