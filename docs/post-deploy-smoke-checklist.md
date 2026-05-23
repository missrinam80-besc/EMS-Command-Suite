# Post-Deploy Smoke Checklist

Doel: na elke deploy naar `main` binnen 10-15 minuten bevestigen dat login, kernmodules, rapportflows en autorisatie nog werken.

## Scope

Deze checklist dekt:
- authenticatie (login/logout)
- moduletoegang (`/zorg`, `/personeel`, `/beheer`)
- trauma/opname rapportflow (nieuw, bewerken, detail)
- runtime-template gedrag (conditionele velden + operators)
- audit logging
- build/test baseline

## Pre-Check (voor deploy)

1. `npm run lint` moet slagen.
2. `npm run build` moet slagen.
3. `npm run test:runtime` moet slagen.
4. CI checks op PR of `main` moeten groen zijn.

## Post-Deploy Checks (production)

Gebruik een account met voldoende rechten (`reports.read`, `reports.create`, `reports.update`, beheerrechten voor builder).

1. Login werkt
- Open `/login`.
- Meld aan met geldige credentials.
- Verwacht: redirect naar app zonder env-foutbanner.

2. Moduletoegang werkt
- Open `/zorg`, `/personeel`, `/beheer`.
- Verwacht: alle pagina's laden zonder 403 voor bevoegde rol.

3. Trauma flow werkt
- Open patiëntdossier.
- Maak nieuw traumarapport.
- Bewerk hetzelfde rapport.
- Open detail.
- Verwacht: data blijft behouden + detail toont correcte waarden.

4. Opname flow werkt
- Herhaal stap 3 voor opnamerapport.

5. Runtime-template conditionals
- Open `/beheer/rapporten-formulieren`.
- Controleer conditional operator flow met minimaal:
  - `equals`
  - `gt`
  - `in`
- Verwacht: UI toont/verbergt velden correct.
- Verwacht: server weigert ongeldige submit als required veld conditioneel zichtbaar is.

6. Audit logging
- Voer minstens 1 create + 1 update rapportactie uit.
- Controleer in beheer/audit overzicht:
  - actie aanwezig
  - target type/id correct
  - timestamp recent

7. Logout werkt
- Meld af.
- Verwacht: terug naar `/login` en protected routes niet bereikbaar zonder sessie.

## Resultaatregistratie-template

Kopieer en vul in per deploy:

- Datum/tijd:
- Commit SHA:
- Vercel deployment URL:
- Uitvoerder:
- 1 Login: PASS/FAIL
- 2 Moduletoegang: PASS/FAIL
- 3 Trauma flow: PASS/FAIL
- 4 Opname flow: PASS/FAIL
- 5 Runtime conditionals: PASS/FAIL
- 6 Audit logging: PASS/FAIL
- 7 Logout: PASS/FAIL
- Opmerkingen:
- Blokkerend voor release? JA/NEE

## Uitgevoerde run (2026-05-23)

Context:
- Lokaal/sandbox hardening-run voor releasevoorbereiding.
- Production-browser checks konden in deze omgeving niet volledig geautomatiseerd worden door OS browser-launch restrictie (`spawn EPERM` voor Playwright Chromium).

Uitgevoerd:
- `npm run lint` -> PASS
- `npm run build` -> PASS
- `npm run test:runtime` -> PASS (11/11)
- `npm run test:e2e` -> FAIL in sandbox door runtime-beperking (`browserType.launch: spawn EPERM`), geen functionele app-fout.

Conclusie:
- Code-level release-hardening is groen.
- Nog vereist buiten sandbox: handmatige production smoke-run volgens checklist (stappen 1-7) na deploy.
