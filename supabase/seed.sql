-- Bootstrap-seed voor zorg + personeel v1
-- Doel:
-- 1. systeemconfiguratie initialiseren
-- 2. rangrechten koppelen
-- 3. supportprofielen zonder medische rang vaste permissies geven
--
-- Deze seed is veilig voor lokaal, staging en productie-bootstrap.
-- Ze bevat bewust geen nep-patiënten, nep-rapporten of demo-personeelsdata.

insert into public.ranks (code, name, rank_number, color_hex, description)
values
  ('rank_1', 'Medische Directie / Ziekenhuisdirectie', 1, '#c92f2f', 'Eindverantwoordelijkheid over beleid, werking en escalaties.'),
  ('rank_2', 'Operationele Leiding', 2, '#dd7b21', 'Dagelijkse aansturing, planning, kwaliteit en coordinatie.'),
  ('rank_3', 'Medisch Specialist / Arts', 3, '#d4b427', 'Gespecialiseerde medische bevoegdheden per discipline.'),
  ('rank_4', 'Senior EMS', 4, '#2f9a57', 'Ervaren operationele EMS-medewerker met beperkte leiding.'),
  ('rank_5', 'EMS Personeel', 5, '#2d74c9', 'Basis EMS-medewerker voor standaardinterventies.'),
  ('rank_6', 'Trainee', 6, '#7f56d9', 'Medewerker in opleiding onder toezicht.')
on conflict (code) do update
set
  name = excluded.name,
  rank_number = excluded.rank_number,
  color_hex = excluded.color_hex,
  description = excluded.description,
  updated_at = now();

insert into public.permissions (code, label, description)
values
  ('patients.read', 'Patienten bekijken', 'Patientfiches en dossiers bekijken.'),
  ('patients.create', 'Patienten aanmaken', 'Nieuwe patientfiches aanmaken.'),
  ('patients.update', 'Patienten bewerken', 'Bestaande patientfiches bewerken.'),
  ('patients.soft_delete', 'Patienten soft delete', 'Patientfiches deactiveren via soft delete.'),
  ('patients.read_deleted', 'Verwijderde patienten bekijken', 'Soft deleted patientfiches bekijken.'),
  ('cases.read', 'Cases bekijken', 'Cases raadplegen.'),
  ('cases.create', 'Cases aanmaken', 'Nieuwe cases aanmaken.'),
  ('cases.update', 'Cases bewerken', 'Cases inhoudelijk bewerken.'),
  ('cases.status.update', 'Case status wijzigen', 'Case status aanpassen.'),
  ('reports.read', 'Rapporten bekijken', 'Rapporten raadplegen.'),
  ('reports.create', 'Rapporten aanmaken', 'Nieuwe rapporten aanmaken.'),
  ('reports.update', 'Rapporten bewerken', 'Alle rapporten bewerken.'),
  ('reports.update_own', 'Eigen rapporten bewerken', 'Alleen eigen rapporten bewerken.'),
  ('audit.read', 'Auditlog bekijken', 'Centrale auditlog bekijken.'),
  ('staff.read_basic', 'Basis personeelslijst bekijken', 'Niet-gevoelige personeelslijst bekijken.'),
  ('staff.read_sensitive', 'Gevoelig personeel bekijken', 'Volledige personeelsdossiers en HR-data bekijken.'),
  ('staff.update', 'Personeel bewerken', 'Personeelsdossiers, evaluaties en HR-data beheren.'),
  ('config.panel.read', 'Beheerpagina openen', 'De beheerpagina openen.'),
  ('config.ranks.manage', 'Rangen beheren', 'Rangen aanmaken en aanpassen via de UI.'),
  ('config.report_types.manage', 'Rapporttypen beheren', 'Rapporttypen beheren via de UI.'),
  ('config.forms.manage', 'Formulieren beheren', 'Formuliersjablonen en invulvelden beheren via de UI.'),
  ('config.badges.manage', 'Tags en badges beheren', 'Waarschuwingstags en badges beheren via de UI.'),
  ('config.patient_statuses.manage', 'Patientstatussen beheren', 'Patientstatussen beheren via de UI.'),
  ('config.database.read', 'Databasebeheer openen', 'Operationeel databasebeheer en configuratie beheren.'),
  ('config.database.restart', 'Database herstart beheren', 'Herstartverzoeken en reconnect-acties registreren via de UI.')
on conflict (code) do update
set
  label = excluded.label,
  description = excluded.description,
  updated_at = now();

insert into public.specializations (code, name, description, minimum_rank_id)
select
  seed.code,
  seed.name,
  seed.description,
  ranks.id
from (
  values
    ('ambulance', 'Ambulance', 'Standaard prehospitale hulp, transport en scene care.', 'rank_5'),
    ('spoed_trauma', 'Spoed & Trauma', 'Triage, traumakamer, reanimatie en kritieke patienten.', 'rank_4'),
    ('pit', 'PIT', 'Advanced prehospital care zonder arts.', 'rank_4'),
    ('mug', 'MUG', 'Medische urgentieteam met artsfunctie.', 'rank_3'),
    ('chirurgie', 'Chirurgie', 'Operaties, schotwonden, steekwonden en interne letsels.', 'rank_3'),
    ('diagnostiek', 'Diagnostiek', 'RX, CT, MRI, echo en labo-interpretatie.', 'rank_3'),
    ('forensisch', 'Forensisch', 'Doodsoorzaak, DNA, tox, letselattesten en politievragen.', 'rank_3'),
    ('psychologie_nazorg', 'Psychologie / Nazorg', 'Traumaopvang, crisisgesprekken en mentale opvolging.', 'rank_3'),
    ('rescue', 'Rescue', 'Water, hoogte, beknelling en moeilijk terrein.', 'rank_4'),
    ('tactische_medische_ondersteuning', 'Tactische medische ondersteuning', 'Medische ondersteuning bij politieacties.', 'rank_4'),
    ('mentor_opleiding', 'Mentor / Opleiding', 'Trainees begeleiden en evalueren.', 'rank_4')
) as seed(code, name, description, minimum_rank_code)
join public.ranks on ranks.code = seed.minimum_rank_code
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  minimum_rank_id = excluded.minimum_rank_id,
  updated_at = now();

insert into public.patient_statuses (code, label, color_hex, sort_order, is_system)
values
  ('actief_in_behandeling', 'Actief in behandeling', '#a33b4f', 10, true),
  ('opgenomen', 'Opgenomen', '#c77710', 20, true),
  ('observatie', 'Observatie', '#9a7a08', 30, true),
  ('stabiel_ontslagen', 'Stabiel / ontslagen', '#237b3d', 40, true),
  ('overleden', 'Overleden', '#4b5563', 50, true),
  ('forensisch_politie', 'Forensisch / politie', '#5f43b2', 60, true)
on conflict (code) do update
set
  label = excluded.label,
  color_hex = excluded.color_hex,
  sort_order = excluded.sort_order,
  is_system = excluded.is_system,
  updated_at = now();

insert into public.report_types (code, label, description, color_hex, sort_order, is_system)
values
  ('trauma', 'Traumarapport', 'Acute letsels, triage en interventies.', '#a14f00', 10, true),
  ('opname', 'Opnamerapport', 'Opname, observatie en klinisch plan.', '#0f5f8f', 20, true),
  ('evaluatie_medisch', 'Medische evaluatie', 'Specialistische of langdurige medische evaluatie.', '#5f43b2', 30, true),
  ('extern', 'Extern verslag', 'Externe documenten of doorgestuurde medische info.', '#35566c', 40, true)
on conflict (code) do update
set
  label = excluded.label,
  description = excluded.description,
  color_hex = excluded.color_hex,
  sort_order = excluded.sort_order,
  is_system = excluded.is_system,
  updated_at = now();

insert into public.warning_badges (code, label, color_hex, sort_order, is_system)
values
  ('ALLERGIE', 'ALLERGIE', '#c92f2f', 10, true),
  ('DIABETES', 'DIABETES', '#cf8b1d', 20, true),
  ('AGRESSIERISICO', 'AGRESSIERISICO', '#8c3f3f', 30, true),
  ('POLITIE_BETREKKEN', 'POLITIE BETREKKEN', '#35566c', 40, true),
  ('FORENSISCH_DOSSIER', 'FORENSISCH DOSSIER', '#5f43b2', 50, true)
on conflict (code) do update
set
  label = excluded.label,
  color_hex = excluded.color_hex,
  sort_order = excluded.sort_order,
  is_system = excluded.is_system,
  updated_at = now();

with rank_permission_matrix as (
  select 'rank_1'::text as rank_code, unnest(array[
    'patients.read',
    'patients.create',
    'patients.update',
    'patients.soft_delete',
    'patients.read_deleted',
    'cases.read',
    'cases.create',
    'cases.update',
    'cases.status.update',
    'reports.read',
    'reports.create',
    'reports.update',
    'audit.read',
    'staff.read_basic',
    'staff.read_sensitive',
    'staff.update',
    'config.panel.read',
    'config.ranks.manage',
    'config.report_types.manage',
    'config.forms.manage',
    'config.badges.manage',
    'config.patient_statuses.manage',
    'config.database.read',
    'config.database.restart'
  ]) as permission_code
  union all
  select 'rank_2', unnest(array[
    'patients.read',
    'patients.create',
    'patients.update',
    'patients.soft_delete',
    'cases.read',
    'cases.create',
    'cases.update',
    'cases.status.update',
    'reports.read',
    'reports.create',
    'reports.update',
    'audit.read',
    'staff.read_basic',
    'staff.read_sensitive',
    'staff.update'
  ])
  union all
  select 'rank_3', unnest(array[
    'patients.read',
    'patients.create',
    'patients.update',
    'cases.read',
    'cases.create',
    'cases.update',
    'cases.status.update',
    'reports.read',
    'reports.create',
    'reports.update',
    'staff.read_basic',
    'staff.read_sensitive'
  ])
  union all
  select 'rank_4', unnest(array[
    'patients.read',
    'patients.create',
    'patients.update',
    'reports.read',
    'reports.create',
    'reports.update',
    'staff.read_basic'
  ])
  union all
  select 'rank_5', unnest(array[
    'patients.read',
    'patients.create',
    'patients.update',
    'reports.read',
    'reports.create',
    'reports.update_own',
    'staff.read_basic'
  ])
  union all
  select 'rank_6', unnest(array[
    'patients.read',
    'reports.read',
    'reports.update_own',
    'staff.read_basic'
  ])
)
insert into public.rank_permissions (rank_id, permission_id)
select ranks.id, permissions.id
from rank_permission_matrix rpm
join public.ranks on ranks.code = rpm.rank_code
join public.permissions on permissions.code = rpm.permission_code
on conflict do nothing;

with support_permission_matrix as (
  select 'administratie'::public.profile_type as profile_type, unnest(array[
    'patients.read',
    'patients.create',
    'patients.update',
    'patients.soft_delete',
    'cases.read',
    'cases.create',
    'cases.update',
    'cases.status.update',
    'reports.read',
    'reports.create',
    'reports.update',
    'audit.read',
    'staff.read_basic',
    'staff.read_sensitive',
    'staff.update'
  ]) as permission_code
  union all
  select 'directie_assistent'::public.profile_type, unnest(array[
    'patients.read',
    'patients.create',
    'patients.update',
    'patients.soft_delete',
    'cases.read',
    'cases.create',
    'cases.update',
    'cases.status.update',
    'reports.read',
    'reports.create',
    'reports.update',
    'audit.read',
    'staff.read_basic',
    'staff.read_sensitive',
    'staff.update'
  ])
)
insert into public.profile_permissions (profile_id, permission_id)
select profiles.id, permissions.id
from support_permission_matrix spm
join public.profiles on profiles.profile_type = spm.profile_type
join public.permissions on permissions.code = spm.permission_code
where profiles.rank_id is null
on conflict do nothing;

-- Voorbereid, maar nog bewust leeg:
-- specialisatiegebonden extra rechten worden later ingevuld via public.specialization_permissions
-- zodra de rechtenmatrix per specialisatie definitief is.
