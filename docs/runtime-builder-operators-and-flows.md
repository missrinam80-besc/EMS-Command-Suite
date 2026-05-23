# Runtime Builder Operators en Flows

Dit document beschrijft de actuele runtime-templateflow voor trauma/opname rapporten, inclusief conditionele operators en testdekking.

## Doel

Beheer kan rapporttemplates en velden configureren via `/beheer/rapporten-formulieren`.
De zorgmodule rendert die velden runtime op:
- trauma nieuw/bewerken/detail
- opname nieuw/bewerken/detail

## Runtime flow (overzicht)

1. Beheer definieert `form_templates` (`template_kind=report`) en `form_template_fields`.
2. Zorgpagina haalt actieve template op via `getActiveRuntimeReportTemplate(reportTypeCode)`.
3. Formulier rendert templatevelden, inclusief conditionele zichtbaarheid.
4. Submit mapped via `mapTraumaReportInput` / `mapOpnameReportInput`.
5. Server valideert conditioneel-required en rules via `validateRuntimeFieldValues`.
6. Rapport wordt opgeslagen in `medical_reports.content` met legacy + dynamische velden.
7. Detailpagina toont waarden met type-aware formattering en respecteert conditionele zichtbaarheid.

## Ondersteunde conditional operators

- `equals`
- `not_equals`
- `contains`
- `not_contains`
- `truthy`
- `falsy`
- `gt`
- `lt`
- `in`
- `not_in`

### Opmerkingen per operator

- `in`/`not_in`: value wordt als lijst gebruikt.
  In builder UI: vul comma-separated waarden in (`P1,P2,P3`), wordt als array opgeslagen.
- `gt`/`lt`: numerieke vergelijking; niet-numerieke input matcht niet.

## Bestandsoverzicht (kern)

- Runtime helper: `src/lib/report-template-runtime.ts`
- Action input mapping: `src/lib/report-action-input.ts`
- Redirect guard server actions: `src/lib/redirect-error.ts`
- Dynamic form UI component: `src/components/runtime-template-fields.tsx`
- Governance export endpoints:
  - `GET /api/exports/audit` (CSV)
  - `GET /api/exports/reports` (CSV)

## Tests

### Runtime unit/integratie

`npm run test:runtime`

Dekt o.a.:
- value formatting (checkbox/multiselect)
- visibility evaluation (`gt/lt/in/not_in` inbegrepen)
- extractie van FormData naar runtimevelden
- mapping van server-action input voor trauma/opname

### E2E

`npm run test:e2e`

Bevat:
- login + navigatie naar trauma/opname rapportpagina's
- builder conditional operator JSON-update flow

Let op: in sandbox-omgevingen kan browser-launch geblokkeerd zijn (`spawn EPERM`).

## Handboek flow (fase 5)

Doel: richtlijnen centraal beheren met publicatiestatus en gerichte zichtbaarheid.

1. Beheer maakt/ordent categorieen in `handbook_categories`.
2. Beheer maakt artikels in `handbook_articles` met markdown-achtige inhoud.
3. Status-guardrails worden server-side afgedwongen:
   - `published` => altijd `is_active=true`
   - `archived` => altijd `is_active=false`
4. Zichtbaarheid wordt bepaald door:
   - geen restricties => zichtbaar voor elke gebruiker met handboektoegang
   - rank/specialisatie restricties => enkel zichtbaar bij match op minstens een restrictie
5. Detailpagina rendert inhoud via veilige markdown-rendering (escaped HTML + beperkte formatting).

### Handboek regressietests

`npm run test:runtime`

Dekt nu ook:
- `applyHandbookStatusGuardrails` (draft/published/archived gedrag)
- `isHandbookArticleVisibleForViewer` (rank/specialisatie filtering en status/actief gating)
