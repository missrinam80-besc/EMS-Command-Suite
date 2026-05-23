# Backlog v1

## Fase 1: platformfundering (afgerond)

- [x] Supabase project configureren
- [x] auth flows opzetten
- [x] profielactivatie met `citizenid`
- [x] ranks, permissions en specialisaties modelleren
- [x] middleware en protected routes opzetten

## Fase 2: zorgkern (afgerond)

- [x] patientenlijst
- [x] patientdetail
- [x] casusoverzicht
- [x] traumaformulier
- [x] opnameformulier
- [x] behandelingsregistratie
- [x] medicatieregistratie
- [x] kostencalculator

## Fase 3: personeel (afgerond)

- [x] personeelslijst
- [x] profielbeheer medewerker
- [x] evaluatieformulier
- [x] evaluatiehistoriek
- [x] specialisatietoewijzing
- [x] afwezigheidsaanvraag
- [x] afwezigheidsgoedkeuring

## Fase 4: organisatie (afgerond)

- [x] meetingaanvraag
- [x] meetings beheren
- [x] notulen editor
- [x] actiepunten en follow-up

## Fase 5: handboek

- [x] richtlijnencategorieen
- [x] rich text richtlijnpaginas
- [x] publicatiestatus draft/published/archived
- [x] zichtbaarheid per rank of specialisatie

## Fase 6: governance

- [x] audit logging
- [x] admin-overzicht permissies
- [x] seed scripts voor basisdata
- [x] export- en rapportagepaden

## Fase-overgang (status 2026-05-23)

Afgerond in deze iteratie:

- runtime builder voor trauma/opname (nieuw, bewerken, detail)
- conditionele operatoren end-to-end (`equals`, `not_equals`, `contains`, `not_contains`, `truthy`, `falsy`, `gt`, `lt`, `in`, `not_in`)
- server-side mapping en validatie-hardening
- `NEXT_REDIRECT` handling gefixt in rapport server actions
- runtime regressietests (`npm run test:runtime`)
- post-deploy smoke-checklist vastgelegd en op productie ingevuld
- handboek fase 5 volledig afgewerkt (categoriebeheer, rich text, statusbeheer, zichtbaarheid op rank/specialisatie)

Nog open voor formele fase-overgang:

- geen open punten in fase 5; klaar voor volgende faseplanning
