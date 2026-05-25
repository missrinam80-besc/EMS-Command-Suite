# Fase 13: Specialisatiegebonden Rechtenmatrix & Operationele Restricties

Status: afgerond op 2026-05-25

## Doel

Fase 13 werkt de bestaande, voorbereide specialization-permissions volledig af zodat:

1. bevoegdheden niet alleen via rang, maar ook via specialisatie consistent afgedwongen worden
2. operationele acties (zorg, personeel, organisatie) verfijnd beperkt kunnen worden zonder rol-inflatie
3. escalatie via foutieve combinatie van rank/direct/specialisatie-permissies aantoonbaar geblokkeerd is

## Scope

1. Business matrix finaliseren
- definitieve mapping per specialisatie en minimum level
- expliciete allow/deny-regels voor kritieke acties

2. Runtime enforcement
- permission resolver uitbreiden met specialization overrides
- deterministic merge-volgorde: direct > specialisatie > rang (met expliciete deny-hantering)

3. Guard hardening
- action- en route-guards specialization-aware maken op kritieke flows
- consistent forbidden gedrag op UI + server actions + API routes

4. Beheerflow
- beheerpagina-sectie voor specialization permission grants/revokes
- validatie op incompatible combinaties

5. Audit & traceability
- events voor grant/revoke, level changes, en policy-denials
- context met specialization_id, level, actor, tenant

6. Regressie & release-hardening
- unit tests voor resolver-combinaties
- e2e tests voor privilege boundaries
- productie smoke-template voor specialisatieflow

## Werkpakketten

### 13.1 Matrix & datamodel
- matrix in docs finaliseren
- datamodelreview op `specialization_permissions` en `profile_specializations`
- seed updates voor baseline specialization grants

### 13.2 Permission resolver
- server-side resolvers uitbreiden
- conflicts/precedence hard coderen en testen

### 13.3 Route/action enforcement
- kritieke acties annoteren met specialization constraints
- guards toepassen en regressies fixen

### 13.4 Beheer-UI
- specialization-permission beheercomponent
- foutmeldingen en compatibiliteitsvalidatie

### 13.5 Audit & CI
- audit events + context uitbreiden
- nieuwe runtime/e2e regressies in CI lanes

## Implementatievolgorde (praktisch)

1. docs-matrix + acceptatiecriteria vastleggen
2. resolver + unit tests
3. action guards op hoogste risicoflows
4. beheer-UI voor grants/revokes
5. audit uitbreidingen
6. CI uitbreiding + productie smoke-run

## Risico's en mitigatie

- Risico: privilege-escalatie door merge-volgorde
  - Mitigatie: expliciete precedence + deny-tests

- Risico: regressies in bestaande rank-flow
  - Mitigatie: bestaande permissietests behouden en uitbreiden

- Risico: tenant boundary + specialization grens botsen
  - Mitigatie: tenant-check eerst, specialization-check daarna, beide verplicht

## Definition of Done

Fase 13 is afgerond wanneer:

1. specialization matrix functioneel vastligt en in runtime afgedwongen wordt
2. kritieke acties specialization-aware beveiligd zijn
3. audittrail specialization wijzigingen volledig logt
4. CI regressies specialisatiegrenzen afdwingen
5. productie smoke-run PASS is op specialization grants/revokes en enforcement

## Oplevering (2026-05-25)

- specialization matrix geactiveerd in `supabase/seed.sql` via `specialization_permissions`
- runtime session resolver combineert nu directe rechten + rangrechten + specialisatierechten
- specialization-aware report-edit guard toegevoegd (`reports.trauma.manage`, `reports.opname.manage`)
- beheer-UI toegevoegd voor specialization permission groups
- audit event toegevoegd bij specialization grant/revoke updates (`specialization_permissions_updated`)
- runtime regressietest uitgebreid met nieuwe specialization permission codes
