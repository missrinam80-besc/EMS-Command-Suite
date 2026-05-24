# Governance Release Runbook

Doel: elke release naar `main` aantoonbaar veilig en reproduceerbaar opleveren.

## 1. Pre-merge gates

1. PR naar `main` met groene CI:
- `npm ci`
- `npm run lint`
- `npm run build`
- `npm run test:runtime`
2. Scope-check:
- permissie-impact gecontroleerd tegen `docs/permissiematrix.md`
- schema/data-impact gedocumenteerd (`supabase/schema.sql`, `supabase/seed.sql` indien aangepast)
3. Secrets-check:
- geen secrets in code, logs of docs
- alleen `NEXT_PUBLIC_*` client-side variabelen in frontend

## 2. Deploy gates

1. Production deploy via `.github/workflows/vercel-production.yml`
2. Deployment URL en commit SHA registreren
3. Bij fail:
- geen handmatige hotfix op productie zonder commit
- root cause eerst vastleggen in PR of issue

## 3. Post-deploy smoke

Gebruik `docs/post-deploy-smoke-checklist.md` en registreer:
- datum/tijd
- commit SHA
- deployment URL
- uitvoerder
- PASS/FAIL per check

Release is pas "done" als alle checklistpunten PASS zijn of expliciet geaccepteerd met risico-notitie.

## 4. Audit en export borging

Na deploy minstens 1 create en 1 update actie uitvoeren in app en verifiëren:
- auditrecord aanwezig (`audit.read`)
- `target_type`, `target_id`, timestamp en actor correct

Exportpaden controleren:
- `/api/exports/audit`
- `/api/exports/reports`

## 5. Incident fallback

Bij regressie in productie:
1. Nieuwe issue aanmaken met:
- exacte fout
- timestamp
- betrokken route/module
- laatste succesvolle commit
2. Revert of fix-forward via PR (geen directe handmatige productiepatch)
3. Smoke-check volledig opnieuw uitvoeren na hersteldeploy

## 6. Tenant lifecycle operations

### Onboarding tenant

1. Tenant aanmaken in `/beheer` (code + label)
2. Tenant status op `actief` houden
3. Testgebruiker per tenant koppelen (gebruikersbeheer, tenant-select)
4. Minstens 1 tenant-specifieke patientrecord valideren
5. Auditlog controleren op:
- `tenant_created`
- `tenant_updated` (indien aangepast)
- `profile_created` / `profile_updated` met `tenant_id`

### Offboarding tenant

1. Alle actieve gebruikers uit tenant herkoppelen of deactiveren
2. Open cases/rapporten exporteren en governance-notitie vastleggen
3. Tenant op `inactief` zetten (default tenant mag niet gedeactiveerd worden)
4. Bevestigen dat onboardingflow geen nieuwe users aan inactieve tenant toelaat

### Tenant isolation incident response

Bij mogelijke cross-tenant data leak:
1. Incident labelen als `P1 - data isolatie`
2. Aangetaste route/API + tenant-combinatie documenteren
3. `e2e-cross-tenant-isolation` opnieuw draaien tegen productie
4. Fix-forward of rollback via PR
5. Na herstel: volledige post-deploy smoke + tenant-isolatie run opnieuw uitvoeren
6. Incident afronden met root cause + preventiemaatregel in changelog/runbook
## 7. Definition of done (Governance)

Governance is pas afgerond wanneer:
- CI gates afdwingbaar zijn in workflow
- post-deploy smoke structureel wordt ingevuld
- audit/export paden gevalideerd blijven
- permissiematrix en runtime-guards synchroon blijven
