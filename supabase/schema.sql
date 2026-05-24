create extension if not exists "pgcrypto";
create extension if not exists "citext";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'profile_type') then
    create type public.profile_type as enum ('medical_staff', 'administratie', 'directie_assistent');
  end if;

  if not exists (select 1 from pg_type where typname = 'staff_employment_status') then
    create type public.staff_employment_status as enum (
      'actief',
      'in_opleiding',
      'inactief',
      'geschorst',
      'ontslagen',
      'verlof'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'specialization_level') then
    create type public.specialization_level as enum (
      'geen',
      'basisbevoegd',
      'bevoegd',
      'instructeur'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'case_status') then
    create type public.case_status as enum (
      'open',
      'afgesloten',
      'gearchiveerd',
      'in_onderzoek',
      'in_wacht'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'absence_status') then
    create type public.absence_status as enum (
      'aangevraagd',
      'goedgekeurd',
      'geweigerd',
      'ingetrokken',
      'verlopen'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'meeting_status') then
    create type public.meeting_status as enum (
      'aangevraagd',
      'goedgekeurd',
      'gepland',
      'afgerond',
      'geannuleerd',
      'geweigerd'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'meeting_action_status') then
    create type public.meeting_action_status as enum (
      'open',
      'in_uitvoering',
      'geblokkeerd',
      'afgerond'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'file_target_type') then
    create type public.file_target_type as enum (
      'patient',
      'medical_report',
      'staff_profile',
      'meeting'
    );
  end if;
end
$$;

create table if not exists public.ranks (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  rank_number integer not null unique,
  color_hex text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rank_permissions (
  rank_id uuid not null references public.ranks(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (rank_id, permission_id)
);

create table if not exists public.specializations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  minimum_rank_id uuid references public.ranks(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.specialization_permissions (
  specialization_id uuid not null references public.specializations(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  minimum_level public.specialization_level not null default 'bevoegd',
  created_at timestamptz not null default now(),
  primary key (specialization_id, permission_id, minimum_level)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  profile_type public.profile_type not null default 'medical_staff',
  full_name text not null,
  call_sign text unique,
  rank_id uuid references public.ranks(id) on delete set null,
  job_title text,
  employment_status public.staff_employment_status not null default 'actief',
  joined_at date,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  deactivated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_private_details (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  email citext not null unique,
  citizenid text not null unique,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_permissions (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (profile_id, permission_id)
);

create table if not exists public.profile_specializations (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  specialization_id uuid not null references public.specializations(id) on delete cascade,
  level public.specialization_level not null default 'basisbevoegd',
  granted_by uuid references public.profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  notes text,
  primary key (profile_id, specialization_id)
);

create table if not exists public.patient_statuses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  color_hex text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  is_system boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  description text,
  color_hex text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  is_system boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.warning_badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  color_hex text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  is_system boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.form_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  description text,
  template_kind text not null default 'form' check (template_kind in ('form', 'report')),
  report_type_code text references public.report_types(code) on delete set null,
  is_active boolean not null default true,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.form_template_fields (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.form_templates(id) on delete cascade,
  field_key text not null,
  label text not null,
  field_type text not null check (
    field_type in (
      'text',
      'textarea',
      'number',
      'date',
      'datetime',
      'select',
      'multiselect',
      'checkbox',
      'radio'
    )
  ),
  placeholder text,
  help_text text,
  section_key text not null default 'general',
  binding_source text not null default 'custom' check (
    binding_source in ('custom', 'medical_reports', 'patients', 'patient_cases')
  ),
  binding_column text,
  validation_rules jsonb not null default '{}'::jsonb,
  conditional_logic jsonb not null default '{}'::jsonb,
  options jsonb not null default '[]'::jsonb,
  is_required boolean not null default false,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, field_key)
);

create table if not exists public.handbook_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  description text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.handbook_articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.handbook_categories(id) on delete restrict,
  author_profile_id uuid references public.profiles(id) on delete set null,
  title text not null,
  slug text not null unique,
  summary text,
  content text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 100,
  is_active boolean not null default true,
  visible_rank_ids uuid[] not null default '{}'::uuid[],
  visible_specialization_ids uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hospital_config (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  hospital_name text not null,
  short_name text,
  city text,
  country text,
  timezone text not null default 'Europe/Brussels',
  branding jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  description text,
  is_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  item_key text not null unique,
  parent_item_key text,
  label text not null,
  icon text,
  route text,
  required_permissions text[] not null default '{}'::text[],
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medical_catalog_injury_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medical_catalog_body_parts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medication_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  medication_type text,
  description text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.treatment_rules (
  id uuid primary key default gen_random_uuid(),
  rule_code text not null unique,
  injury_type_code text references public.medical_catalog_injury_types(code) on delete cascade,
  body_part_code text references public.medical_catalog_body_parts(code) on delete set null,
  severity text,
  possible_diagnosis text,
  recommended_treatment text,
  recommended_medication_code text references public.medication_catalog(code) on delete set null,
  recommended_tools text[] not null default '{}'::text[],
  report_template_code text references public.form_templates(code) on delete set null,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.form_template_fields
  add column if not exists binding_source text not null default 'custom';

alter table public.form_template_fields
  add column if not exists binding_column text;

alter table public.form_templates
  add column if not exists template_kind text not null default 'form';

alter table public.form_template_fields
  add column if not exists section_key text not null default 'general';

alter table public.form_template_fields
  add column if not exists validation_rules jsonb not null default '{}'::jsonb;

alter table public.form_template_fields
  add column if not exists conditional_logic jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'form_templates_template_kind_check'
  ) then
    alter table public.form_templates
      add constraint form_templates_template_kind_check
      check (template_kind in ('form', 'report'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'form_template_fields_binding_source_check'
  ) then
    alter table public.form_template_fields
      add constraint form_template_fields_binding_source_check
      check (binding_source in ('custom', 'medical_reports', 'patients', 'patient_cases'));
  end if;
end
$$;

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  citizenid text not null unique,
  full_name text not null,
  birth_date date,
  phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  blood_type text,
  allergies text[] not null default '{}'::text[],
  medications text[] not null default '{}'::text[],
  chronic_conditions text[] not null default '{}'::text[],
  medical_warnings text[] not null default '{}'::text[],
  status_code text references public.patient_statuses(code) on delete restrict,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  deleted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.patient_badges (
  patient_id uuid not null references public.patients(id) on delete cascade,
  badge_id uuid not null references public.warning_badges(id) on delete restrict,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  notes text,
  primary key (patient_id, badge_id)
);

create table if not exists public.patient_cases (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  title text not null,
  summary text,
  status public.case_status not null default 'open',
  opened_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  opened_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.medical_reports (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  case_id uuid references public.patient_cases(id) on delete set null,
  report_type_code text not null references public.report_types(code) on delete restrict,
  title text not null,
  summary text not null default '',
  content jsonb not null default '{}'::jsonb,
  author_profile_id uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.file_attachments (
  id uuid primary key default gen_random_uuid(),
  bucket_name text not null check (bucket_name in ('report-files', 'staff-files', 'meeting-files', 'images')),
  target_type public.file_target_type not null,
  target_id uuid not null,
  original_filename text not null,
  storage_path text not null unique,
  mime_type text not null,
  byte_size bigint not null default 0 check (byte_size >= 0),
  is_image boolean not null default false,
  uploaded_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.staff_evaluations (
  id uuid primary key default gen_random_uuid(),
  employee_profile_id uuid not null references public.profiles(id) on delete cascade,
  evaluator_profile_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  summary text not null default '',
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_absences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  absence_type text not null,
  start_date date not null,
  end_date date not null,
  reason text,
  status public.absence_status not null default 'aangevraagd',
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  purpose text,
  location text,
  requested_date date,
  participant_profile_ids uuid[] not null default '{}'::uuid[],
  status public.meeting_status not null default 'aangevraagd',
  requested_by uuid references public.profiles(id) on delete set null,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  decision_note text,
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  minutes text,
  follow_up text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (scheduled_end is null or scheduled_start is null or scheduled_end >= scheduled_start)
);

create table if not exists public.meeting_action_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  title text not null,
  description text,
  owner_profile_id uuid references public.profiles(id) on delete set null,
  due_date date,
  status public.meeting_action_status not null default 'open',
  created_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_rewards (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  amount numeric(12,2),
  granted_by uuid references public.profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.staff_strikepoint_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  delta integer not null check (delta <> 0),
  reason text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_reason text
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  target_type text not null,
  target_id uuid,
  action text not null,
  summary text not null,
  before_state jsonb,
  after_state jsonb,
  changed_fields text[] not null default '{}'::text[],
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_rank_id on public.profiles(rank_id);
create index if not exists idx_profile_private_details_email on public.profile_private_details(email);
create index if not exists idx_profile_specializations_profile_id on public.profile_specializations(profile_id);
create index if not exists idx_patients_status_code on public.patients(status_code);
create index if not exists idx_patients_deleted_at on public.patients(deleted_at);
create index if not exists idx_patient_badges_patient_id on public.patient_badges(patient_id);
create index if not exists idx_patient_cases_patient_id on public.patient_cases(patient_id);
create index if not exists idx_patient_cases_status on public.patient_cases(status);
create index if not exists idx_medical_reports_patient_id on public.medical_reports(patient_id);
create index if not exists idx_medical_reports_case_id on public.medical_reports(case_id);
create index if not exists idx_medical_reports_type_code on public.medical_reports(report_type_code);
create index if not exists idx_form_templates_report_type_code on public.form_templates(report_type_code);
create index if not exists idx_form_templates_is_active on public.form_templates(is_active);
create index if not exists idx_form_template_fields_template_id on public.form_template_fields(template_id);
create index if not exists idx_handbook_categories_sort on public.handbook_categories(sort_order);
create index if not exists idx_handbook_articles_category on public.handbook_articles(category_id);
create index if not exists idx_handbook_articles_status on public.handbook_articles(status);
create index if not exists idx_handbook_articles_sort on public.handbook_articles(sort_order);
create index if not exists idx_hospital_config_code on public.hospital_config(code);
create index if not exists idx_feature_flags_code on public.feature_flags(code);
create index if not exists idx_feature_flags_enabled on public.feature_flags(is_enabled);
create index if not exists idx_navigation_items_parent on public.navigation_items(parent_item_key);
create index if not exists idx_navigation_items_sort on public.navigation_items(sort_order);
create index if not exists idx_medical_catalog_injury_types_sort on public.medical_catalog_injury_types(sort_order);
create index if not exists idx_medical_catalog_body_parts_sort on public.medical_catalog_body_parts(sort_order);
create index if not exists idx_medication_catalog_sort on public.medication_catalog(sort_order);
create index if not exists idx_treatment_rules_injury on public.treatment_rules(injury_type_code);
create index if not exists idx_treatment_rules_medication on public.treatment_rules(recommended_medication_code);
create index if not exists idx_file_attachments_target on public.file_attachments(target_type, target_id);
create index if not exists idx_staff_evaluations_employee_profile_id on public.staff_evaluations(employee_profile_id);
create index if not exists idx_staff_absences_profile_id on public.staff_absences(profile_id);
create index if not exists idx_meetings_status on public.meetings(status);
create index if not exists idx_meetings_requested_by on public.meetings(requested_by);
create index if not exists idx_meetings_scheduled_start on public.meetings(scheduled_start);
create index if not exists idx_meeting_action_items_meeting_id on public.meeting_action_items(meeting_id);
create index if not exists idx_meeting_action_items_owner_profile_id on public.meeting_action_items(owner_profile_id);
create index if not exists idx_meeting_action_items_status on public.meeting_action_items(status);
create index if not exists idx_staff_rewards_profile_id on public.staff_rewards(profile_id);
create index if not exists idx_staff_strikepoints_profile_id on public.staff_strikepoint_entries(profile_id);
create index if not exists idx_audit_logs_target on public.audit_logs(target_type, target_id);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_profile_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.auth_profile_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

create or replace function public.has_permission(required_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.permissions perm
    where perm.code = required_code
      and perm.is_active = true
      and (
        exists (
          select 1
          from public.profile_permissions pp
          where pp.permission_id = perm.id
            and pp.profile_id = auth.uid()
        )
        or exists (
          select 1
          from public.profiles p
          join public.rank_permissions rp on rp.rank_id = p.rank_id
          where p.id = auth.uid()
            and rp.permission_id = perm.id
        )
        or exists (
          select 1
          from public.profile_specializations ps
          join public.specialization_permissions sp
            on sp.specialization_id = ps.specialization_id
           and ps.level >= sp.minimum_level
          where ps.profile_id = auth.uid()
            and sp.permission_id = perm.id
        )
      )
  );
$$;

revoke all on function public.has_permission(text) from public;
grant execute on function public.has_permission(text) to anon, authenticated, service_role;

create or replace function public.is_report_author(report_author_id uuid)
returns boolean
language sql
stable
as $$
  select auth.uid() = report_author_id;
$$;

create or replace function public.try_parse_uuid(input text)
returns uuid
language plpgsql
immutable
as $$
begin
  return input::uuid;
exception
  when others then
    return null;
end;
$$;

create or replace function public.capture_table_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_uuid uuid := null;
  before_state jsonb := null;
  after_state jsonb := null;
  changed_fields text[] := '{}'::text[];
  key text;
begin
  if TG_OP = 'INSERT' then
    after_state := to_jsonb(NEW);
  elsif TG_OP = 'UPDATE' then
    before_state := to_jsonb(OLD);
    after_state := to_jsonb(NEW);
  elsif TG_OP = 'DELETE' then
    before_state := to_jsonb(OLD);
  end if;

  if TG_OP = 'UPDATE' then
    for key in
      select distinct jsonb_object_keys(coalesce(before_state, '{}'::jsonb) || coalesce(after_state, '{}'::jsonb))
    loop
      if before_state -> key is distinct from after_state -> key then
        changed_fields := array_append(changed_fields, key);
      end if;
    end loop;
  elsif TG_OP = 'INSERT' then
    changed_fields := array(
      select jsonb_object_keys(coalesce(after_state, '{}'::jsonb))
    );
  else
    changed_fields := array(
      select jsonb_object_keys(coalesce(before_state, '{}'::jsonb))
    );
  end if;

  if TG_OP = 'INSERT' then
    target_uuid := public.try_parse_uuid(after_state ->> 'id');
  else
    target_uuid := public.try_parse_uuid(before_state ->> 'id');
  end if;

  insert into public.audit_logs (
    actor_profile_id,
    target_type,
    target_id,
    action,
    summary,
    before_state,
    after_state,
    changed_fields,
    context
  )
  values (
    actor_id,
    TG_TABLE_NAME,
    target_uuid,
    lower(TG_TABLE_NAME || '_' || TG_OP),
    TG_TABLE_NAME || ' ' || lower(TG_OP),
    before_state,
    after_state,
    changed_fields,
    jsonb_build_object(
      'source', 'db_trigger',
      'operation', TG_OP
    )
  );

  if TG_OP = 'DELETE' then
    return OLD;
  end if;

  return NEW;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    profile_type,
    full_name
  )
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'profile_type')::public.profile_type, 'medical_staff'),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  insert into public.profile_private_details (
    profile_id,
    email,
    citizenid
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'citizenid', 'pending-' || left(new.id::text, 8))
  )
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists trg_ranks_updated_at on public.ranks;
create trigger trg_ranks_updated_at
before update on public.ranks
for each row execute function public.set_updated_at();

drop trigger if exists trg_permissions_updated_at on public.permissions;
create trigger trg_permissions_updated_at
before update on public.permissions
for each row execute function public.set_updated_at();

drop trigger if exists trg_specializations_updated_at on public.specializations;
create trigger trg_specializations_updated_at
before update on public.specializations
for each row execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_profile_private_details_updated_at on public.profile_private_details;
create trigger trg_profile_private_details_updated_at
before update on public.profile_private_details
for each row execute function public.set_updated_at();

drop trigger if exists trg_patient_statuses_updated_at on public.patient_statuses;
create trigger trg_patient_statuses_updated_at
before update on public.patient_statuses
for each row execute function public.set_updated_at();

drop trigger if exists trg_report_types_updated_at on public.report_types;
create trigger trg_report_types_updated_at
before update on public.report_types
for each row execute function public.set_updated_at();

drop trigger if exists trg_warning_badges_updated_at on public.warning_badges;
create trigger trg_warning_badges_updated_at
before update on public.warning_badges
for each row execute function public.set_updated_at();

drop trigger if exists trg_form_templates_updated_at on public.form_templates;
create trigger trg_form_templates_updated_at
before update on public.form_templates
for each row execute function public.set_updated_at();

drop trigger if exists trg_form_template_fields_updated_at on public.form_template_fields;
create trigger trg_form_template_fields_updated_at
before update on public.form_template_fields
for each row execute function public.set_updated_at();

drop trigger if exists trg_handbook_categories_updated_at on public.handbook_categories;
create trigger trg_handbook_categories_updated_at
before update on public.handbook_categories
for each row execute function public.set_updated_at();

drop trigger if exists trg_handbook_articles_updated_at on public.handbook_articles;
create trigger trg_handbook_articles_updated_at
before update on public.handbook_articles
for each row execute function public.set_updated_at();

drop trigger if exists trg_hospital_config_updated_at on public.hospital_config;
create trigger trg_hospital_config_updated_at
before update on public.hospital_config
for each row execute function public.set_updated_at();

drop trigger if exists trg_feature_flags_updated_at on public.feature_flags;
create trigger trg_feature_flags_updated_at
before update on public.feature_flags
for each row execute function public.set_updated_at();

drop trigger if exists trg_navigation_items_updated_at on public.navigation_items;
create trigger trg_navigation_items_updated_at
before update on public.navigation_items
for each row execute function public.set_updated_at();

drop trigger if exists trg_medical_catalog_injury_types_updated_at on public.medical_catalog_injury_types;
create trigger trg_medical_catalog_injury_types_updated_at
before update on public.medical_catalog_injury_types
for each row execute function public.set_updated_at();

drop trigger if exists trg_medical_catalog_body_parts_updated_at on public.medical_catalog_body_parts;
create trigger trg_medical_catalog_body_parts_updated_at
before update on public.medical_catalog_body_parts
for each row execute function public.set_updated_at();

drop trigger if exists trg_medication_catalog_updated_at on public.medication_catalog;
create trigger trg_medication_catalog_updated_at
before update on public.medication_catalog
for each row execute function public.set_updated_at();

drop trigger if exists trg_treatment_rules_updated_at on public.treatment_rules;
create trigger trg_treatment_rules_updated_at
before update on public.treatment_rules
for each row execute function public.set_updated_at();

drop trigger if exists trg_patients_updated_at on public.patients;
create trigger trg_patients_updated_at
before update on public.patients
for each row execute function public.set_updated_at();

drop trigger if exists trg_patient_cases_updated_at on public.patient_cases;
create trigger trg_patient_cases_updated_at
before update on public.patient_cases
for each row execute function public.set_updated_at();

drop trigger if exists trg_medical_reports_updated_at on public.medical_reports;
create trigger trg_medical_reports_updated_at
before update on public.medical_reports
for each row execute function public.set_updated_at();

drop trigger if exists trg_staff_evaluations_updated_at on public.staff_evaluations;
create trigger trg_staff_evaluations_updated_at
before update on public.staff_evaluations
for each row execute function public.set_updated_at();

drop trigger if exists trg_staff_absences_updated_at on public.staff_absences;
create trigger trg_staff_absences_updated_at
before update on public.staff_absences
for each row execute function public.set_updated_at();

drop trigger if exists trg_meetings_updated_at on public.meetings;
create trigger trg_meetings_updated_at
before update on public.meetings
for each row execute function public.set_updated_at();

drop trigger if exists trg_meeting_action_items_updated_at on public.meeting_action_items;
create trigger trg_meeting_action_items_updated_at
before update on public.meeting_action_items
for each row execute function public.set_updated_at();

drop trigger if exists trg_audit_ranks on public.ranks;
create trigger trg_audit_ranks
after insert or update or delete on public.ranks
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_rank_permissions on public.rank_permissions;
create trigger trg_audit_rank_permissions
after insert or update or delete on public.rank_permissions
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_specializations on public.specializations;
create trigger trg_audit_specializations
after insert or update or delete on public.specializations
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_specialization_permissions on public.specialization_permissions;
create trigger trg_audit_specialization_permissions
after insert or update or delete on public.specialization_permissions
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_permissions on public.permissions;
create trigger trg_audit_permissions
after insert or update or delete on public.permissions
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_profiles on public.profiles;
create trigger trg_audit_profiles
after insert or update or delete on public.profiles
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_profile_private_details on public.profile_private_details;
create trigger trg_audit_profile_private_details
after insert or update or delete on public.profile_private_details
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_profile_permissions on public.profile_permissions;
create trigger trg_audit_profile_permissions
after insert or update or delete on public.profile_permissions
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_profile_specializations on public.profile_specializations;
create trigger trg_audit_profile_specializations
after insert or update or delete on public.profile_specializations
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_report_types on public.report_types;
create trigger trg_audit_report_types
after insert or update or delete on public.report_types
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_warning_badges on public.warning_badges;
create trigger trg_audit_warning_badges
after insert or update or delete on public.warning_badges
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_patient_statuses on public.patient_statuses;
create trigger trg_audit_patient_statuses
after insert or update or delete on public.patient_statuses
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_form_templates on public.form_templates;
create trigger trg_audit_form_templates
after insert or update or delete on public.form_templates
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_form_template_fields on public.form_template_fields;
create trigger trg_audit_form_template_fields
after insert or update or delete on public.form_template_fields
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_handbook_categories on public.handbook_categories;
create trigger trg_audit_handbook_categories
after insert or update or delete on public.handbook_categories
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_handbook_articles on public.handbook_articles;
create trigger trg_audit_handbook_articles
after insert or update or delete on public.handbook_articles
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_hospital_config on public.hospital_config;
create trigger trg_audit_hospital_config
after insert or update or delete on public.hospital_config
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_feature_flags on public.feature_flags;
create trigger trg_audit_feature_flags
after insert or update or delete on public.feature_flags
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_navigation_items on public.navigation_items;
create trigger trg_audit_navigation_items
after insert or update or delete on public.navigation_items
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_medical_catalog_injury_types on public.medical_catalog_injury_types;
create trigger trg_audit_medical_catalog_injury_types
after insert or update or delete on public.medical_catalog_injury_types
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_medical_catalog_body_parts on public.medical_catalog_body_parts;
create trigger trg_audit_medical_catalog_body_parts
after insert or update or delete on public.medical_catalog_body_parts
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_medication_catalog on public.medication_catalog;
create trigger trg_audit_medication_catalog
after insert or update or delete on public.medication_catalog
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_treatment_rules on public.treatment_rules;
create trigger trg_audit_treatment_rules
after insert or update or delete on public.treatment_rules
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_patients on public.patients;
create trigger trg_audit_patients
after insert or update or delete on public.patients
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_patient_cases on public.patient_cases;
create trigger trg_audit_patient_cases
after insert or update or delete on public.patient_cases
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_patient_badges on public.patient_badges;
create trigger trg_audit_patient_badges
after insert or update or delete on public.patient_badges
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_medical_reports on public.medical_reports;
create trigger trg_audit_medical_reports
after insert or update or delete on public.medical_reports
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_file_attachments on public.file_attachments;
create trigger trg_audit_file_attachments
after insert or update or delete on public.file_attachments
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_staff_evaluations on public.staff_evaluations;
create trigger trg_audit_staff_evaluations
after insert or update or delete on public.staff_evaluations
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_staff_absences on public.staff_absences;
create trigger trg_audit_staff_absences
after insert or update or delete on public.staff_absences
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_meetings on public.meetings;
create trigger trg_audit_meetings
after insert or update or delete on public.meetings
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_meeting_action_items on public.meeting_action_items;
create trigger trg_audit_meeting_action_items
after insert or update or delete on public.meeting_action_items
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_staff_rewards on public.staff_rewards;
create trigger trg_audit_staff_rewards
after insert or update or delete on public.staff_rewards
for each row execute function public.capture_table_audit();

drop trigger if exists trg_audit_staff_strikepoint_entries on public.staff_strikepoint_entries;
create trigger trg_audit_staff_strikepoint_entries
after insert or update or delete on public.staff_strikepoint_entries
for each row execute function public.capture_table_audit();

alter table public.ranks enable row level security;
alter table public.permissions enable row level security;
alter table public.rank_permissions enable row level security;
alter table public.specializations enable row level security;
alter table public.specialization_permissions enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_private_details enable row level security;
alter table public.profile_permissions enable row level security;
alter table public.profile_specializations enable row level security;
alter table public.patient_statuses enable row level security;
alter table public.report_types enable row level security;
alter table public.warning_badges enable row level security;
alter table public.form_templates enable row level security;
alter table public.form_template_fields enable row level security;
alter table public.handbook_categories enable row level security;
alter table public.handbook_articles enable row level security;
alter table public.hospital_config enable row level security;
alter table public.feature_flags enable row level security;
alter table public.navigation_items enable row level security;
alter table public.medical_catalog_injury_types enable row level security;
alter table public.medical_catalog_body_parts enable row level security;
alter table public.medication_catalog enable row level security;
alter table public.treatment_rules enable row level security;
alter table public.patients enable row level security;
alter table public.patient_badges enable row level security;
alter table public.patient_cases enable row level security;
alter table public.medical_reports enable row level security;
alter table public.file_attachments enable row level security;
alter table public.staff_evaluations enable row level security;
alter table public.staff_absences enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_action_items enable row level security;
alter table public.staff_rewards enable row level security;
alter table public.staff_strikepoint_entries enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "ranks_read_authenticated" on public.ranks;
create policy "ranks_read_authenticated"
on public.ranks
for select
using (auth.uid() is not null);

drop policy if exists "ranks_manage_directie" on public.ranks;
create policy "ranks_manage_directie"
on public.ranks
for all
using (public.has_permission('config.ranks.manage'))
with check (public.has_permission('config.ranks.manage'));

drop policy if exists "permissions_manage_directie" on public.permissions;
create policy "permissions_manage_directie"
on public.permissions
for all
using (public.has_permission('config.database.read'))
with check (public.has_permission('config.database.read'));

drop policy if exists "permissions_read_directie" on public.permissions;
create policy "permissions_read_directie"
on public.permissions
for select
using (public.has_permission('config.database.read'));

drop policy if exists "rank_permissions_read_directie" on public.rank_permissions;
create policy "rank_permissions_read_directie"
on public.rank_permissions
for select
using (public.has_permission('config.database.read'));

drop policy if exists "rank_permissions_manage_directie" on public.rank_permissions;
create policy "rank_permissions_manage_directie"
on public.rank_permissions
for all
using (public.has_permission('config.database.read'))
with check (public.has_permission('config.database.read'));

drop policy if exists "specializations_read_authenticated" on public.specializations;
create policy "specializations_read_authenticated"
on public.specializations
for select
using (auth.uid() is not null);

drop policy if exists "specializations_manage_directie" on public.specializations;
create policy "specializations_manage_directie"
on public.specializations
for all
using (public.has_permission('config.database.read'))
with check (public.has_permission('config.database.read'));

drop policy if exists "specialization_permissions_read_directie" on public.specialization_permissions;
create policy "specialization_permissions_read_directie"
on public.specialization_permissions
for select
using (public.has_permission('config.database.read'));

drop policy if exists "specialization_permissions_manage_directie" on public.specialization_permissions;
create policy "specialization_permissions_manage_directie"
on public.specialization_permissions
for all
using (public.has_permission('config.database.read'))
with check (public.has_permission('config.database.read'));

drop policy if exists "profiles_read_basic_or_self" on public.profiles;
create policy "profiles_read_basic_or_self"
on public.profiles
for select
using (
  id = auth.uid()
  or public.has_permission('staff.read_basic')
  or public.has_permission('staff.read_sensitive')
);

drop policy if exists "profiles_manage_staff" on public.profiles;
create policy "profiles_manage_staff"
on public.profiles
for all
using (public.has_permission('staff.update'))
with check (public.has_permission('staff.update'));

drop policy if exists "profile_private_details_read_self_or_sensitive" on public.profile_private_details;
create policy "profile_private_details_read_self_or_sensitive"
on public.profile_private_details
for select
using (
  profile_id = auth.uid()
  or public.has_permission('staff.read_sensitive')
);

drop policy if exists "profile_private_details_manage_staff" on public.profile_private_details;
create policy "profile_private_details_manage_staff"
on public.profile_private_details
for all
using (public.has_permission('staff.update'))
with check (public.has_permission('staff.update'));

drop policy if exists "profile_permissions_manage_directie" on public.profile_permissions;
create policy "profile_permissions_manage_directie"
on public.profile_permissions
for all
using (public.has_permission('config.database.read'))
with check (public.has_permission('config.database.read'));

drop policy if exists "profile_permissions_read_directie" on public.profile_permissions;
create policy "profile_permissions_read_directie"
on public.profile_permissions
for select
using (public.has_permission('config.database.read'));

drop policy if exists "profile_specializations_read_basic_or_sensitive" on public.profile_specializations;
create policy "profile_specializations_read_basic_or_sensitive"
on public.profile_specializations
for select
using (
  profile_id = auth.uid()
  or public.has_permission('staff.read_basic')
  or public.has_permission('staff.read_sensitive')
);

drop policy if exists "profile_specializations_manage_staff" on public.profile_specializations;
create policy "profile_specializations_manage_staff"
on public.profile_specializations
for all
using (public.has_permission('staff.update'))
with check (public.has_permission('staff.update'));

drop policy if exists "patient_statuses_read_authenticated" on public.patient_statuses;
create policy "patient_statuses_read_authenticated"
on public.patient_statuses
for select
using (auth.uid() is not null);

drop policy if exists "patient_statuses_manage_directie" on public.patient_statuses;
create policy "patient_statuses_manage_directie"
on public.patient_statuses
for all
using (public.has_permission('config.patient_statuses.manage'))
with check (public.has_permission('config.patient_statuses.manage'));

drop policy if exists "report_types_read_authenticated" on public.report_types;
create policy "report_types_read_authenticated"
on public.report_types
for select
using (auth.uid() is not null);

drop policy if exists "report_types_manage_directie" on public.report_types;
create policy "report_types_manage_directie"
on public.report_types
for all
using (public.has_permission('config.report_types.manage'))
with check (public.has_permission('config.report_types.manage'));

drop policy if exists "warning_badges_read_authenticated" on public.warning_badges;
create policy "warning_badges_read_authenticated"
on public.warning_badges
for select
using (auth.uid() is not null);

drop policy if exists "warning_badges_manage_directie" on public.warning_badges;
create policy "warning_badges_manage_directie"
on public.warning_badges
for all
using (public.has_permission('config.badges.manage'))
with check (public.has_permission('config.badges.manage'));

drop policy if exists "form_templates_read_authenticated" on public.form_templates;
create policy "form_templates_read_authenticated"
on public.form_templates
for select
using (auth.uid() is not null);

drop policy if exists "form_templates_manage_directie" on public.form_templates;
create policy "form_templates_manage_directie"
on public.form_templates
for all
using (public.has_permission('config.forms.manage'))
with check (public.has_permission('config.forms.manage'));

drop policy if exists "form_template_fields_read_authenticated" on public.form_template_fields;
create policy "form_template_fields_read_authenticated"
on public.form_template_fields
for select
using (auth.uid() is not null);

drop policy if exists "form_template_fields_manage_directie" on public.form_template_fields;
create policy "form_template_fields_manage_directie"
on public.form_template_fields
for all
using (public.has_permission('config.forms.manage'))
with check (public.has_permission('config.forms.manage'));

drop policy if exists "handbook_categories_read_allowed" on public.handbook_categories;
create policy "handbook_categories_read_allowed"
on public.handbook_categories
for select
using (
  public.has_permission('handbook.read')
  or public.has_permission('handbook.manage')
);

drop policy if exists "handbook_categories_manage" on public.handbook_categories;
create policy "handbook_categories_manage"
on public.handbook_categories
for all
using (public.has_permission('handbook.manage'))
with check (public.has_permission('handbook.manage'));

drop policy if exists "handbook_articles_read_filtered" on public.handbook_articles;
create policy "handbook_articles_read_filtered"
on public.handbook_articles
for select
using (
  public.has_permission('handbook.manage')
  or (
    public.has_permission('handbook.read')
    and is_active = true
    and status = 'published'
    and (
      coalesce(array_length(visible_rank_ids, 1), 0) = 0
      or exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.rank_id = any (public.handbook_articles.visible_rank_ids)
      )
    )
    and (
      coalesce(array_length(visible_specialization_ids, 1), 0) = 0
      or exists (
        select 1
        from public.profile_specializations ps
        where ps.profile_id = auth.uid()
          and ps.specialization_id = any (public.handbook_articles.visible_specialization_ids)
      )
    )
  )
);

drop policy if exists "handbook_articles_manage" on public.handbook_articles;
create policy "handbook_articles_manage"
on public.handbook_articles
for all
using (public.has_permission('handbook.manage'))
with check (public.has_permission('handbook.manage'));

drop policy if exists "hospital_config_read_authenticated" on public.hospital_config;
create policy "hospital_config_read_authenticated"
on public.hospital_config
for select
using (auth.uid() is not null);

drop policy if exists "hospital_config_manage_directie" on public.hospital_config;
create policy "hospital_config_manage_directie"
on public.hospital_config
for all
using (public.has_permission('config.database.read'))
with check (public.has_permission('config.database.read'));

drop policy if exists "feature_flags_read_authenticated" on public.feature_flags;
create policy "feature_flags_read_authenticated"
on public.feature_flags
for select
using (auth.uid() is not null);

drop policy if exists "feature_flags_manage_directie" on public.feature_flags;
create policy "feature_flags_manage_directie"
on public.feature_flags
for all
using (public.has_permission('config.database.read'))
with check (public.has_permission('config.database.read'));

drop policy if exists "navigation_items_read_authenticated" on public.navigation_items;
create policy "navigation_items_read_authenticated"
on public.navigation_items
for select
using (auth.uid() is not null);

drop policy if exists "navigation_items_manage_directie" on public.navigation_items;
create policy "navigation_items_manage_directie"
on public.navigation_items
for all
using (public.has_permission('config.database.read'))
with check (public.has_permission('config.database.read'));

drop policy if exists "medical_catalog_injury_types_read_authenticated" on public.medical_catalog_injury_types;
create policy "medical_catalog_injury_types_read_authenticated"
on public.medical_catalog_injury_types
for select
using (auth.uid() is not null);

drop policy if exists "medical_catalog_injury_types_manage_directie" on public.medical_catalog_injury_types;
create policy "medical_catalog_injury_types_manage_directie"
on public.medical_catalog_injury_types
for all
using (public.has_permission('config.database.read'))
with check (public.has_permission('config.database.read'));

drop policy if exists "medical_catalog_body_parts_read_authenticated" on public.medical_catalog_body_parts;
create policy "medical_catalog_body_parts_read_authenticated"
on public.medical_catalog_body_parts
for select
using (auth.uid() is not null);

drop policy if exists "medical_catalog_body_parts_manage_directie" on public.medical_catalog_body_parts;
create policy "medical_catalog_body_parts_manage_directie"
on public.medical_catalog_body_parts
for all
using (public.has_permission('config.database.read'))
with check (public.has_permission('config.database.read'));

drop policy if exists "medication_catalog_read_authenticated" on public.medication_catalog;
create policy "medication_catalog_read_authenticated"
on public.medication_catalog
for select
using (auth.uid() is not null);

drop policy if exists "medication_catalog_manage_directie" on public.medication_catalog;
create policy "medication_catalog_manage_directie"
on public.medication_catalog
for all
using (public.has_permission('config.database.read'))
with check (public.has_permission('config.database.read'));

drop policy if exists "treatment_rules_read_authenticated" on public.treatment_rules;
create policy "treatment_rules_read_authenticated"
on public.treatment_rules
for select
using (auth.uid() is not null);

drop policy if exists "treatment_rules_manage_directie" on public.treatment_rules;
create policy "treatment_rules_manage_directie"
on public.treatment_rules
for all
using (public.has_permission('config.database.read'))
with check (public.has_permission('config.database.read'));

drop policy if exists "patients_read_allowed" on public.patients;
create policy "patients_read_allowed"
on public.patients
for select
using (
  public.has_permission('patients.read')
  and (
    deleted_at is null
    or public.has_permission('patients.read_deleted')
  )
);

drop policy if exists "patients_insert_allowed" on public.patients;
create policy "patients_insert_allowed"
on public.patients
for insert
with check (public.has_permission('patients.create'));

drop policy if exists "patients_update_allowed" on public.patients;
create policy "patients_update_allowed"
on public.patients
for update
using (
  public.has_permission('patients.update')
  or public.has_permission('patients.soft_delete')
)
with check (
  public.has_permission('patients.update')
  or public.has_permission('patients.soft_delete')
);

drop policy if exists "patient_badges_read_allowed" on public.patient_badges;
create policy "patient_badges_read_allowed"
on public.patient_badges
for select
using (public.has_permission('patients.read'));

drop policy if exists "patient_badges_manage_allowed" on public.patient_badges;
create policy "patient_badges_manage_allowed"
on public.patient_badges
for all
using (public.has_permission('patients.update'))
with check (public.has_permission('patients.update'));

drop policy if exists "patient_cases_read_allowed" on public.patient_cases;
create policy "patient_cases_read_allowed"
on public.patient_cases
for select
using (public.has_permission('cases.read'));

drop policy if exists "patient_cases_insert_allowed" on public.patient_cases;
create policy "patient_cases_insert_allowed"
on public.patient_cases
for insert
with check (public.has_permission('cases.create'));

drop policy if exists "patient_cases_update_allowed" on public.patient_cases;
create policy "patient_cases_update_allowed"
on public.patient_cases
for update
using (
  public.has_permission('cases.update')
  or public.has_permission('cases.status.update')
)
with check (
  public.has_permission('cases.update')
  or public.has_permission('cases.status.update')
);

drop policy if exists "medical_reports_read_allowed" on public.medical_reports;
create policy "medical_reports_read_allowed"
on public.medical_reports
for select
using (public.has_permission('reports.read'));

drop policy if exists "medical_reports_insert_allowed" on public.medical_reports;
create policy "medical_reports_insert_allowed"
on public.medical_reports
for insert
with check (public.has_permission('reports.create'));

drop policy if exists "medical_reports_update_allowed" on public.medical_reports;
create policy "medical_reports_update_allowed"
on public.medical_reports
for update
using (
  public.has_permission('reports.update')
  or (
    public.has_permission('reports.update_own')
    and public.is_report_author(author_profile_id)
  )
)
with check (
  public.has_permission('reports.update')
  or (
    public.has_permission('reports.update_own')
    and public.is_report_author(author_profile_id)
  )
);

drop policy if exists "file_attachments_read_authenticated" on public.file_attachments;
create policy "file_attachments_read_authenticated"
on public.file_attachments
for select
using (auth.uid() is not null);

drop policy if exists "file_attachments_insert_own" on public.file_attachments;
create policy "file_attachments_insert_own"
on public.file_attachments
for insert
with check (uploaded_by = auth.uid());

drop policy if exists "file_attachments_manage_owner_or_staff" on public.file_attachments;
create policy "file_attachments_manage_owner_or_staff"
on public.file_attachments
for update
using (uploaded_by = auth.uid() or public.has_permission('staff.update'))
with check (uploaded_by = auth.uid() or public.has_permission('staff.update'));

drop policy if exists "staff_evaluations_read_allowed" on public.staff_evaluations;
create policy "staff_evaluations_read_allowed"
on public.staff_evaluations
for select
using (
  public.has_permission('staff.read_sensitive')
  or employee_profile_id = auth.uid()
  or evaluator_profile_id = auth.uid()
);

drop policy if exists "staff_evaluations_manage_staff" on public.staff_evaluations;
create policy "staff_evaluations_manage_staff"
on public.staff_evaluations
for all
using (public.has_permission('staff.update'))
with check (public.has_permission('staff.update'));

drop policy if exists "staff_absences_read_allowed" on public.staff_absences;
create policy "staff_absences_read_allowed"
on public.staff_absences
for select
using (
  public.has_permission('staff.read_sensitive')
  or profile_id = auth.uid()
);

drop policy if exists "staff_absences_manage_staff" on public.staff_absences;
create policy "staff_absences_manage_staff"
on public.staff_absences
for all
using (
  public.has_permission('staff.update')
  or profile_id = auth.uid()
)
with check (
  public.has_permission('staff.update')
  or profile_id = auth.uid()
);

drop policy if exists "meetings_read_allowed" on public.meetings;
create policy "meetings_read_allowed"
on public.meetings
for select
using (
  public.has_permission('meetings.read')
  or public.has_permission('minutes.read')
  or requested_by = auth.uid()
  or auth.uid() = any(participant_profile_ids)
);

drop policy if exists "meetings_insert_allowed" on public.meetings;
create policy "meetings_insert_allowed"
on public.meetings
for insert
with check (
  public.has_permission('meetings.create')
  and (requested_by is null or requested_by = auth.uid())
);

drop policy if exists "meetings_update_allowed" on public.meetings;
create policy "meetings_update_allowed"
on public.meetings
for update
using (
  public.has_permission('meetings.update')
  or public.has_permission('minutes.update')
)
with check (
  public.has_permission('meetings.update')
  or public.has_permission('minutes.update')
);

drop policy if exists "meeting_action_items_read_allowed" on public.meeting_action_items;
create policy "meeting_action_items_read_allowed"
on public.meeting_action_items
for select
using (
  exists (
    select 1
    from public.meetings m
    where m.id = meeting_action_items.meeting_id
      and (
        public.has_permission('meetings.read')
        or public.has_permission('minutes.read')
        or m.requested_by = auth.uid()
        or auth.uid() = any(m.participant_profile_ids)
      )
  )
);

drop policy if exists "meeting_action_items_manage_allowed" on public.meeting_action_items;
create policy "meeting_action_items_manage_allowed"
on public.meeting_action_items
for all
using (public.has_permission('meetings.update'))
with check (public.has_permission('meetings.update'));

drop policy if exists "staff_rewards_read_allowed" on public.staff_rewards;
create policy "staff_rewards_read_allowed"
on public.staff_rewards
for select
using (
  public.has_permission('staff.read_sensitive')
  or profile_id = auth.uid()
);

drop policy if exists "staff_rewards_manage_staff" on public.staff_rewards;
create policy "staff_rewards_manage_staff"
on public.staff_rewards
for all
using (public.has_permission('staff.update'))
with check (public.has_permission('staff.update'));

drop policy if exists "staff_strikepoints_read_allowed" on public.staff_strikepoint_entries;
create policy "staff_strikepoints_read_allowed"
on public.staff_strikepoint_entries
for select
using (
  public.has_permission('staff.read_sensitive')
  or profile_id = auth.uid()
);

drop policy if exists "staff_strikepoints_manage_staff" on public.staff_strikepoint_entries;
create policy "staff_strikepoints_manage_staff"
on public.staff_strikepoint_entries
for all
using (public.has_permission('staff.update'))
with check (public.has_permission('staff.update'));

drop policy if exists "audit_logs_read_allowed" on public.audit_logs;
create policy "audit_logs_read_allowed"
on public.audit_logs
for select
using (public.has_permission('audit.read'));

drop policy if exists "audit_logs_insert_authenticated" on public.audit_logs;
create policy "audit_logs_insert_authenticated"
on public.audit_logs
for insert
with check (
  auth.uid() is not null
  and (
    actor_profile_id is null
    or actor_profile_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values
  ('report-files', 'report-files', false),
  ('staff-files', 'staff-files', false),
  ('meeting-files', 'meeting-files', false),
  ('images', 'images', false)
on conflict (id) do nothing;

create table if not exists public.integration_endpoints (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  target_url text not null,
  signing_secret text not null,
  retry_limit integer not null default 3 check (retry_limit between 1 and 5),
  timeout_ms integer not null default 7000 check (timeout_ms between 1000 and 30000),
  is_active boolean not null default true,
  last_status text not null default 'idle' check (last_status in ('idle', 'success', 'failed')),
  last_error text,
  last_delivery_at timestamptz,
  last_success_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.integration_webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  endpoint_id uuid not null references public.integration_endpoints(id) on delete cascade,
  endpoint_code text not null,
  event_type text not null,
  idempotency_key text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  attempt integer not null default 1 check (attempt >= 1),
  http_status integer,
  error_message text,
  pushed_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (endpoint_id, idempotency_key)
);

create table if not exists public.automation_jobs (
  id uuid primary key default gen_random_uuid(),
  job_code text not null unique,
  label text not null,
  schedule_kind text not null default 'manual' check (schedule_kind in ('manual', 'daily', 'hourly')),
  is_active boolean not null default true,
  last_run_at timestamptz,
  last_status text not null default 'idle' check (last_status in ('idle', 'success', 'failed')),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.automation_jobs(id) on delete cascade,
  job_code text not null,
  triggered_by text,
  status text not null default 'running' check (status in ('running', 'success', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  metrics jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_integration_deliveries_event_type on public.integration_webhook_deliveries(event_type);
create index if not exists idx_integration_deliveries_pushed_at on public.integration_webhook_deliveries(pushed_at desc);
create index if not exists idx_automation_runs_job_started on public.automation_runs(job_code, started_at desc);

drop trigger if exists trg_integration_endpoints_updated_at on public.integration_endpoints;
create trigger trg_integration_endpoints_updated_at
before update on public.integration_endpoints
for each row execute function public.set_updated_at();

drop trigger if exists trg_automation_jobs_updated_at on public.automation_jobs;
create trigger trg_automation_jobs_updated_at
before update on public.automation_jobs
for each row execute function public.set_updated_at();

alter table public.integration_endpoints enable row level security;
alter table public.integration_webhook_deliveries enable row level security;
alter table public.automation_jobs enable row level security;
alter table public.automation_runs enable row level security;

drop policy if exists "integration_endpoints_read_directie" on public.integration_endpoints;
create policy "integration_endpoints_read_directie"
on public.integration_endpoints
for select
using (public.has_permission('config.database.read'));

drop policy if exists "integration_endpoints_manage_directie" on public.integration_endpoints;
create policy "integration_endpoints_manage_directie"
on public.integration_endpoints
for all
using (public.has_permission('config.database.read'))
with check (public.has_permission('config.database.read'));

drop policy if exists "integration_deliveries_read_directie" on public.integration_webhook_deliveries;
create policy "integration_deliveries_read_directie"
on public.integration_webhook_deliveries
for select
using (public.has_permission('config.database.read'));

drop policy if exists "integration_deliveries_insert_system" on public.integration_webhook_deliveries;
create policy "integration_deliveries_insert_system"
on public.integration_webhook_deliveries
for insert
with check (auth.uid() is not null);

drop policy if exists "automation_jobs_read_directie" on public.automation_jobs;
create policy "automation_jobs_read_directie"
on public.automation_jobs
for select
using (public.has_permission('config.database.read'));

drop policy if exists "automation_jobs_manage_directie" on public.automation_jobs;
create policy "automation_jobs_manage_directie"
on public.automation_jobs
for all
using (public.has_permission('config.database.read'))
with check (public.has_permission('config.database.read'));

drop policy if exists "automation_runs_read_directie" on public.automation_runs;
create policy "automation_runs_read_directie"
on public.automation_runs
for select
using (public.has_permission('config.database.read'));

drop policy if exists "automation_runs_insert_system" on public.automation_runs;
create policy "automation_runs_insert_system"
on public.automation_runs
for insert
with check (auth.uid() is not null or triggered_by like 'system:%');

drop policy if exists "automation_runs_update_directie" on public.automation_runs;
create policy "automation_runs_update_directie"
on public.automation_runs
for update
using (public.has_permission('config.database.read'))
with check (public.has_permission('config.database.read'));
