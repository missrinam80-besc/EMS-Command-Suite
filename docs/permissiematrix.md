# Permissiematrix (live v1)

Dit document volgt de actuele runtime-permissies in de app en vervangt oudere capability-benamingen zoals `patients.write`, `staff.read` en `admin.manage_permissions`.

## Live permission-codes

- `patients.read`
- `patients.create`
- `patients.update`
- `patients.soft_delete`
- `patients.read_deleted`
- `cases.read`
- `cases.create`
- `cases.update`
- `cases.status.update`
- `reports.read`
- `reports.create`
- `reports.update`
- `reports.update_own`
- `reports.trauma.manage`
- `reports.opname.manage`
- `meetings.read`
- `meetings.create`
- `meetings.update`
- `minutes.read`
- `minutes.update`
- `handbook.read`
- `handbook.manage`
- `audit.read`
- `staff.read_basic`
- `staff.read_sensitive`
- `staff.update`
- `config.panel.read`
- `config.ranks.manage`
- `config.report_types.manage`
- `config.forms.manage`
- `config.badges.manage`
- `config.patient_statuses.manage`
- `config.users.manage`
- `config.tenants.manage`
- `config.tenant_approvals.manage`
- `config.database.read`
- `config.database.restart`

## Rollen (business)

- `rank_1` Medische Directie / Ziekenhuisdirectie
- `rank_2` Operationele Leiding
- `rank_3` Medisch Specialist / Arts
- `rank_4` Senior EMS
- `rank_5` EMS Personeel
- `rank_6` Trainee
- extra loginrollen: `administratie`, `directie_assistent`

## Richtlijn per rol (v1)

### Rank 1 (directie)

- volledige toegang tot alle modules
- volledige beheerrechten

### Rank 2 (operationele leiding)

- brede operationele toegang tot zorg, personeel en organisatie
- geen toegang tot beheer/config/databasebeheer

### Rank 3-4 (specialist/senior)

- volledige zorgwerking (patienten, cases, rapporten)
- personeel en organisatie volgens toegekende rechten

### Rank 5-6 (EMS/Trainee)

- basis operationele toegang volgens toegewezen rechten
- rapportbewerking beperkt via `reports.update_own` (enforced op pagina + server action)

## Moduletoegang (centrale guards)

- `/zorg`: vereist minstens een van `patients.read`, `cases.read`, `reports.read`
- `/personeel`: vereist `staff.read_basic`
- `/organisatie`: vereist minstens een van `meetings.read`, `minutes.read`
- `/handboek`: vereist minstens een van `handbook.read`, `handbook.manage`
- `/beheer`: vereist `config.panel.read`
- `/beheer/intelligence` en `/beheer/integraties`: vereist `config.database.read` of `config.tenants.manage`
- approval-sectie tenantwijzigingen: vereist `config.database.read` of `config.tenant_approvals.manage`

## Belangrijke enforcement-notes

- Detailacties blijven aanvullend beschermd met pagina/action-specifieke checks.
- `reports.update_own` laat alleen bewerken toe van rapporten waarvan `author_profile_id` gelijk is aan de ingelogde gebruiker.
- Rapportbewerking vereist aanvullend specializationbeheer:
  - trauma: `reports.trauma.manage`
  - opname: `reports.opname.manage`
- Rechten worden geladen uit Supabase via:
  - directe rechten: `profile_permissions`
  - geerfde rechten: `rank_permissions`
- Export-routes (`/api/exports/audit`, `/api/exports/reports`, `/api/exports/kpi`) zijn tenant-scoped voor niet-globale admins; alleen `config.database.read` mag tenant-overkoepelend exporteren.
- Gevoelige tenantmutaties (`tenant_update`, `tenant_status_toggle`) lopen via request/approve/reject met volledige audit chain.

## Specialisaties

Specialisaties blijven een extra filterlaag bovenop ranks/permissies, geen vervanging ervan.
