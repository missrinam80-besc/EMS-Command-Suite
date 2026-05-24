# Fase 10: Schaalbaarheid & Multi-tenant Readiness (foundation)

Opgeleverd in deze iteratie:

1. Tenant-datamodel
- nieuwe tabel: `public.tenants`
- default-tenant concept via `is_default=true`
- helperfunctie: `public.get_default_tenant_id()`

2. Tenant-kolommen op kernentiteiten
- `tenant_id` toegevoegd aan o.a.:
  - `profiles`
  - `patients`
  - `patient_cases`
  - `medical_reports`
  - `meetings`
  - `staff_*` tabellen
  - `audit_logs`
  - `integration_*`
  - `automation_*`
- defaults ingesteld op `public.get_default_tenant_id()`
- backfill opgenomen voor bestaande records

3. Performance-baseline voor tenant-schaal
- tenant-indexes toegevoegd op high-traffic tabellen
- samengestelde indexes met `created_at`/`started_at` waar relevant

4. App-level tenant context
- nieuwe helper: `src/lib/tenant.ts`
- leest actieve tenant op basis van `NEXT_PUBLIC_DEFAULT_TENANT_CODE` (default: `default`)

5. Tenant-aware applicatieflow
- intelligence queries tenant-scoped
- integratie- en automation-queries/inserts tenant-scoped
- automation runs bewaren tenant context

Nog open voor volledige fase-10 afronding:

1. Volledige RLS-conversie naar tenant-restrictive policies voor alle modules
2. Onboarding en validatie van een tweede tenant
3. Cross-tenant regressietests (geen data-leak tussen tenants)

Benodigd voor live activatie:

1. `supabase/schema.sql` toepassen
2. `supabase/seed.sql` toepassen
3. (Optioneel) `NEXT_PUBLIC_DEFAULT_TENANT_CODE` instellen in Vercel env
