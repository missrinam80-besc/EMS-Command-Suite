# Fase 8: Data Intelligence & Beslissingsondersteuning

Opgeleverd:

1. Intelligence dashboard:
- route: `/beheer/intelligence`
- KPI-overzicht (patienten, rapporten, open cases, actief personeel, meetings, audit 24u)
- trends per dag (rapporten en audit-events, laatste 30 dagen)
- data quality blok
- alert blok (info/warning/critical)

2. Intelligence backend:
- `src/lib/intelligence.ts`
- defensieve snapshot-opbouw voor live en demo/no-env situaties

3. Export 2.0:
- `GET /api/exports/audit?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/exports/reports?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/exports/kpi?from=YYYY-MM-DD&to=YYYY-MM-DD`

4. Toegang:
- dashboard: `config.panel.read`
- KPI export: `config.panel.read` of `audit.read`
- bestaande audit/report exports blijven permissie-beveiligd

Opmerking:
- Dit is de eerste intelligence release (operationeel). Voor geavanceerde BI-schaal kunnen later materialized views en periodieke aggregaties toegevoegd worden.
