# Observability Baseline

Dit document definieert de minimum observability voor productie.

## Endpoint

- `GET /api/health`

Response:
- `200` met `status=ok` wanneer Supabase env aanwezig is en database checks slagen.
- `503` met `status=degraded` wanneer configuratie ontbreekt of database checks falen.

Payload bevat:
- runtime/environment metadata
- status van kernchecks
- kerncounters (`patients`, `reports`, `profiles`, `auditLogs`)
- diagnostische boodschap + timestamp + commit SHA

## Operationeel gebruik

1. Check endpoint na elke deploy.
2. Bij `503`: release blokkeren tot root cause gekend is.
3. Leg incident vast in governance runbook:
- `docs/governance-release-runbook.md`

## Relatie met smoke-check

Gebruik dit endpoint als snelle pre-smoke indicatie; vervangt de functionele smoke-check niet.
