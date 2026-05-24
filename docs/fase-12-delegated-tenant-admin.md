# Fase 12: Delegated Tenant Administration & Approval Workflows

Status: gestart op 2026-05-24

## Doel

Fase 12 introduceert gecontroleerde delegatie:

1. niet elke tenantbewerking hoeft door globale directie-admin
2. tenantgebonden beheer kan gedelegeerd worden
3. gevoelige mutaties vereisen expliciete goedkeuring

## Scope

1. Delegated admin model
- nieuw rechtenprofiel voor tenant-admin beheer
- duidelijke grens tussen global admin en tenant admin

2. Acties opdelen per risiconiveau
- laag risico: direct uitvoerbaar (tenant-lokaal)
- hoog risico: approval vereist (bijv. tenant status wijzigen, kritieke config)

3. Approval workflow
- request → approve/reject flow
- actor, approver, timestamp, reason verplicht loggen

4. Audit uitbreiding
- approval chain metadata in audit context
- traceerbaarheid van aangevraagde vs uitgevoerde mutatie

5. Regressie
- tests voor permissieafbakening
- tests voor approve/reject paden

## Definition of Done

Fase 12 is afgerond wanneer:

1. tenant-admin rechtenmodel actief is zonder cross-tenant privilege-escalatie
2. gevoelige tenantacties niet meer zonder approval uitgevoerd kunnen worden
3. audittrail volledige request/approval/execution chain bevat
4. regressietests dit afdwingen in CI

## Startvolgorde

1. schema + permissies uitbreiden voor delegated admin
2. actions hardenen met approval-gates
3. beheer-UI voor requests/approvals
4. test- en runbook-updates

## Voortgang (2026-05-24)

- 12.1 afgerond: delegated permissies + tenant-scope hardening op beheeractions.
- 12.2 afgerond: UI-gating voor user/tenant/rank/infra acties.
- 12.3 afgerond: integraties/intelligence/export API tenant-aware.
- 12.4 afgerond: e2e delegated permission-regressies toegevoegd in CI (aparte job met secrets-gate).
