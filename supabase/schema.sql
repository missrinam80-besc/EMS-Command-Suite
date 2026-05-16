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
create index if not exists idx_file_attachments_target on public.file_attachments(target_type, target_id);
create index if not exists idx_staff_evaluations_employee_profile_id on public.staff_evaluations(employee_profile_id);
create index if not exists idx_staff_absences_profile_id on public.staff_absences(profile_id);
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
alter table public.patients enable row level security;
alter table public.patient_badges enable row level security;
alter table public.patient_cases enable row level security;
alter table public.medical_reports enable row level security;
alter table public.file_attachments enable row level security;
alter table public.staff_evaluations enable row level security;
alter table public.staff_absences enable row level security;
alter table public.staff_rewards enable row level security;
alter table public.staff_strikepoint_entries enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "ranks_read_authenticated" on public.ranks;
create policy "ranks_read_authenticated"
on public.ranks
for select
using (auth.uid() is not null);

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
