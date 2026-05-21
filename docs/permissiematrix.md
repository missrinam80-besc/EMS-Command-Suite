# Permissiematrix (live v1)

Dit document volgt de **actuele runtime-permissies** in de app en vervangt de oudere capability-benamingen zoals `patients.write`, `staff.read` en `admin.manage_permissions`.

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

- brede operationele toegang tot zorg en personeel
- **geen** toegang tot beheer/config/databasebeheer

### Rank 3-4 (specialist/senior)

- volledige zorgwerking (patiënten, cases, rapporten)
- personeel volgens toegekende rechten

### Rank 5-6 (EMS/Trainee)

- basis operationele toegang volgens toegewezen rechten
- rapportbewerking beperkt via `reports.update_own` (enforced op pagina + server action)

## Moduletoegang (centrale guards)

- `/zorg`: vereist minstens één van `patients.read`, `cases.read`, `reports.read`
- `/personeel`: vereist `staff.read_basic`
- `/beheer`: vereist `config.panel.read`

## Belangrijke enforcement-notes

- Detailacties blijven aanvullend beschermd met pagina/action-specifieke checks.
- `reports.update_own` laat alleen bewerken toe van rapporten waarvan `author_profile_id` gelijk is aan de ingelogde gebruiker.
- Rechten worden geladen uit Supabase via:
  - directe rechten: `profile_permissions`
  - geërfde rechten: `rank_permissions`

## Specialisaties

Specialisaties blijven een extra filterlaag bovenop ranks/permissies, geen vervanging ervan.
