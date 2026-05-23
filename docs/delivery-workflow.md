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
