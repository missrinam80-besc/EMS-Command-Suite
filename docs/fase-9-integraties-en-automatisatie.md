# Fase 9: Integraties & Automatisatie

Opgeleverd:

1. Beheerpagina integraties:
- route: `/beheer/integraties`
- endpoint CRUD-achtige updateflow
- handmatige testdispatch
- automation jobs handmatig starten
- delivery/run monitoring

2. Integratie-engine:
- `src/lib/integrations.ts`
- HMAC signing (`X-EMS-Signature`)
- idempotency keys per endpoint (`endpoint_id + idempotency_key` uniek)
- retry-mechanisme met timeout en statusregistratie

3. Automation API:
- `POST /api/automation/run`
- ondersteunde jobs:
  - `daily_kpi_digest`
  - `open_cases_reminder`
- authenticatie via:
  - beheergebruiker met `config.database.read`, of
  - Bearer `AUTOMATION_CRON_TOKEN`

4. Schedules:
- `.github/workflows/automation-jobs.yml`
- dagelijks triggeren van beide jobs via API call

5. Database uitbreiding:
- `integration_endpoints`
- `integration_webhook_deliveries`
- `automation_jobs`
- `automation_runs`
- RLS policies + indexes + seed van jobcatalogus

Benodigde secrets voor scheduling:
- `AUTOMATION_BASE_URL` (bv. `https://ems-command-suite.vercel.app`)
- `AUTOMATION_CRON_TOKEN` (zelfde waarde als server env `AUTOMATION_CRON_TOKEN`)
