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
  ('meetings.read', 'Meetings bekijken', 'Meetingaanvragen en planning bekijken.'),
  ('meetings.create', 'Meetings aanvragen', 'Nieuwe meetingaanvragen registreren.'),
  ('meetings.update', 'Meetings beheren', 'Planning, status en actiepunten beheren.'),
  ('minutes.read', 'Notulen bekijken', 'Notulen en follow-up van meetings bekijken.'),
  ('minutes.update', 'Notulen bewerken', 'Notulen en follow-up aanpassen.'),
  ('handbook.read', 'Handboek lezen', 'Gepubliceerde handboekartikelen raadplegen.'),
  ('handbook.manage', 'Handboek beheren', 'Handboekcategorieen en -artikelen aanmaken, bewerken en verwijderen.'),
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

insert into public.hospital_config (
  code,
  hospital_name,
  short_name,
  city,
  country,
  timezone,
  branding
)
values
  (
    'default',
    'Pillbox Hill Medical Center',
    'PHMC',
    'Los Santos',
    'San Andreas',
    'Europe/Brussels',
    '{
      "primary_color": "#fada0b",
      "secondary_color": "#010100",
      "accent_color": "#fe0100",
      "background_color": "#fffeea"
    }'::jsonb
  )
on conflict (code) do update
set
  hospital_name = excluded.hospital_name,
  short_name = excluded.short_name,
  city = excluded.city,
  country = excluded.country,
  timezone = excluded.timezone,
  branding = excluded.branding,
  updated_at = now();

insert into public.feature_flags (code, label, description, is_enabled)
values
  ('cases_enabled', 'Cases ingeschakeld', 'Cases module actief.', true),
  ('audit_logging', 'Audit logging', 'Audittrails actief op kernmutaties.', true),
  ('specializations', 'Specialisaties', 'Specialisatielogica actief.', true),
  ('wizard_reports', 'Wizard rapporten', 'Wizardgedreven rapportflow.', true),
  ('handbook_enabled', 'Handboek', 'Handboekmodule actief.', true),
  ('ai_assist_enabled', 'AI assist', 'AI assistent-functies actief.', false)
on conflict (code) do update
set
  label = excluded.label,
  description = excluded.description,
  is_enabled = excluded.is_enabled,
  updated_at = now();

insert into public.navigation_items (
  item_key,
  parent_item_key,
  label,
  icon,
  route,
  required_permissions,
  sort_order,
  is_active
)
values
  ('dashboard', null, 'Dashboard', 'layout-dashboard', '/', '{}'::text[], 10, true),
  ('zorg', null, 'Zorg', 'heart-pulse', '/zorg', '{"patients.read"}'::text[], 20, true),
  ('zorg_patienten', 'zorg', 'Patienten', null, '/zorg/patienten', '{"patients.read"}'::text[], 21, true),
  ('zorg_cases', 'zorg', 'Cases', null, '/zorg/patienten', '{"cases.read"}'::text[], 22, true),
  ('organisatie', null, 'Organisatie', 'calendar-days', '/organisatie', '{"meetings.read"}'::text[], 30, true),
  ('personeel', null, 'Personeel', 'users', '/personeel', '{"staff.read_basic"}'::text[], 40, true),
  ('handboek', null, 'Handboek', 'book-open', '/handboek', '{"handbook.read"}'::text[], 50, true),
  ('beheer', null, 'Beheer', 'settings', '/beheer', '{"config.panel.read"}'::text[], 90, true)
on conflict (item_key) do update
set
  parent_item_key = excluded.parent_item_key,
  label = excluded.label,
  icon = excluded.icon,
  route = excluded.route,
  required_permissions = excluded.required_permissions,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.handbook_categories (code, label, description, sort_order, is_active)
values
  ('triage', 'Triage', 'Richtlijnen voor intake, prioritering en dispatch.', 10, true),
  ('trauma', 'Trauma', 'Procedures voor trauma- en spoedinterventies.', 20, true),
  ('medicatie', 'Medicatie', 'Toedieningsrichtlijnen en veiligheidschecks.', 30, true),
  ('organisatie', 'Organisatie', 'Interne afspraken, overdracht en communicatie.', 40, true)
on conflict (code) do update
set
  label = excluded.label,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.handbook_articles (
  category_id,
  title,
  slug,
  summary,
  content,
  status,
  sort_order,
  is_active
)
select
  categories.id,
  seed.title,
  seed.slug,
  seed.summary,
  seed.content,
  'published',
  seed.sort_order,
  true
from (
  values
    ('triage', 'ABCDE Triage Basis', 'abcde-triage-basis', 'Snelle primaire evaluatie volgens ABCDE.', 'A: Airway vrijmaken en beschermen.\nB: Ademhaling beoordelen en ondersteunen.\nC: Circulatie controleren, bloedingen stelpen.\nD: Neurologische status via AVPU/GCS.\nE: Volledige inspectie en temperatuurbeheer.', 10),
    ('triage', 'Dispatch Prioriteiten', 'dispatch-prioriteiten', 'Prioriteiten voor uitruk op basis van urgentie.', 'P1: Levensbedreigend, onmiddellijke uitruk.\nP2: Urgent, snelle respons met monitoring.\nP3: Niet-urgent, geplande afhandeling.\nDocumenteer altijd motivatie van prioriteit.', 20),
    ('trauma', 'Polytrauma Opvang', 'polytrauma-opvang', 'Stappenplan voor aankomst van polytrauma.', 'Voorbereiding trauma bay.\nRolverdeling teamlead/airway/procedure/scribe.\nMassive transfusion protocol indien indicatie.\nFAST + secundaire survey.\nEscalatie naar OK/IC volgens bevindingen.', 30),
    ('trauma', 'Brandwonden Eerste Zorg', 'brandwonden-eerste-zorg', 'Koelen, classificeren en doorverwijzen.', 'Koel met lauw water gedurende 20 minuten.\nVerwijder knellende items.\nBereken TBSA via rule of nines.\nBescherm wond steriel.\nEscaleer bij inhalatieletsel of >10% TBSA.', 40),
    ('medicatie', 'Medicatieveiligheid 5 Juiste', 'medicatieveiligheid-5-juiste', 'Controleprocedure voor veilige toediening.', 'Juiste patient.\nJuiste medicatie.\nJuiste dosis.\nJuiste tijd.\nJuiste toedieningsweg.\nRegistreer onmiddellijk in het dossier.', 50),
    ('medicatie', 'Analgesie Ladder EMS', 'analgesie-ladder-ems', 'Gefaseerde pijnbehandeling in prehospitale setting.', 'Stap 1: Paracetamol/NSAID indien passend.\nStap 2: Zwakke opioiden.\nStap 3: Sterke opioiden met monitoring.\nEvalueer pijnscore voor en na toediening.', 60),
    ('organisatie', 'Handover SBAR', 'handover-sbar', 'Uniforme overdracht tussen teams.', 'S: Situation\nB: Background\nA: Assessment\nR: Recommendation\nGebruik korte, verifieerbare kernpunten en herhaal kritieke info.', 70),
    ('organisatie', 'Melding Incidenten', 'melding-incidenten', 'Procedure voor veiligheidsincidenten en near misses.', 'Meld binnen 24 uur via intern formulier.\nBeschrijf feiten, geen interpretaties.\nKoppel betrokken casus/rapport.\nTeamlead valideert en start follow-up.', 80)
) as seed(category_code, title, slug, summary, content, sort_order)
join public.handbook_categories categories on categories.code = seed.category_code
on conflict (slug) do update
set
  category_id = excluded.category_id,
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  status = excluded.status,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.medical_catalog_injury_types (code, label, sort_order, is_active)
values
  ('schaafwonde', 'Schaafwonde', 10, true),
  ('snijwonde', 'Snijwonde', 20, true),
  ('scheurwonde', 'Scheurwonde', 30, true),
  ('steekwonde', 'Steekwonde', 40, true),
  ('brandwonde', 'Brandwonde', 50, true),
  ('kneuzing', 'Kneuzing', 60, true),
  ('verpletteringsletsel', 'Verpletteringsletsel', 70, true),
  ('interne_bloeding', 'Interne bloeding', 80, true),
  ('schotwonde', 'Schotwonde', 90, true),
  ('shotgun_verwonding', 'Shotgun verwonding', 100, true),
  ('explosieletsel', 'Explosieletsel', 110, true),
  ('breuk', 'Breuk', 120, true),
  ('open_breuk', 'Open breuk', 130, true),
  ('ontwrichting', 'Ontwrichting', 140, true),
  ('amputatie', 'Amputatie', 150, true),
  ('hoofdtrauma', 'Hoofdtrauma', 160, true)
on conflict (code) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.medical_catalog_body_parts (code, label, sort_order, is_active)
values
  ('hoofd', 'Hoofd', 10, true),
  ('nek', 'Nek', 20, true),
  ('borst', 'Borst', 30, true),
  ('rug', 'Rug', 40, true),
  ('buik', 'Buik', 50, true),
  ('linkerarm', 'Linkerarm', 60, true),
  ('rechterarm', 'Rechterarm', 70, true),
  ('linkerhand', 'Linkerhand', 80, true),
  ('rechterhand', 'Rechterhand', 90, true),
  ('linkerbeen', 'Linkerbeen', 100, true),
  ('rechterbeen', 'Rechterbeen', 110, true),
  ('linkervoet', 'Linkervoet', 120, true),
  ('rechtervoet', 'Rechtervoet', 130, true)
on conflict (code) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.medication_catalog (code, name, medication_type, sort_order, is_active)
values
  ('morphine', 'Morfine', 'painkiller', 10, true),
  ('epinephrine', 'Epinephrine', 'resuscitation', 20, true),
  ('propofol', 'Propofol', 'sedation', 30, true),
  ('saline', 'Saline', 'fluids', 40, true)
on conflict (code) do update
set
  name = excluded.name,
  medication_type = excluded.medication_type,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.treatment_rules (
  rule_code,
  injury_type_code,
  body_part_code,
  severity,
  possible_diagnosis,
  recommended_treatment,
  recommended_medication_code,
  recommended_tools,
  sort_order,
  is_active
)
values
  (
    'trauma_hoofd_kneuzing_mild',
    'kneuzing',
    'hoofd',
    'mild',
    'Lichte contusie',
    'Observatie, koeling en neurologische controle',
    null,
    '{"cold_pack"}'::text[],
    10,
    true
  ),
  (
    'trauma_open_breuk_been_hoog',
    'open_breuk',
    'rechterbeen',
    'hoog',
    'Open fractuur',
    'Immobilisatie, bloedingcontrole en spoedtransport',
    'morphine',
    '{"splint","pressure_bandage"}'::text[],
    20,
    true
  )
on conflict (rule_code) do update
set
  injury_type_code = excluded.injury_type_code,
  body_part_code = excluded.body_part_code,
  severity = excluded.severity,
  possible_diagnosis = excluded.possible_diagnosis,
  recommended_treatment = excluded.recommended_treatment,
  recommended_medication_code = excluded.recommended_medication_code,
  recommended_tools = excluded.recommended_tools,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
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
    'meetings.read',
    'meetings.create',
    'meetings.update',
    'minutes.read',
    'minutes.update',
    'handbook.read',
    'handbook.manage',
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
    'meetings.read',
    'meetings.create',
    'meetings.update',
    'minutes.read',
    'minutes.update',
    'handbook.read',
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
    'meetings.read',
    'meetings.create',
    'minutes.read',
    'minutes.update',
    'handbook.read',
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
    'meetings.read',
    'minutes.read',
    'handbook.read',
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
    'meetings.read',
    'minutes.read',
    'handbook.read',
    'staff.read_basic'
  ])
  union all
  select 'rank_6', unnest(array[
    'patients.read',
    'reports.read',
    'reports.update_own',
    'meetings.read',
    'minutes.read',
    'handbook.read',
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
    'meetings.read',
    'meetings.create',
    'meetings.update',
    'minutes.read',
    'minutes.update',
    'handbook.read',
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
    'meetings.read',
    'meetings.create',
    'meetings.update',
    'minutes.read',
    'minutes.update',
    'handbook.read',
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
