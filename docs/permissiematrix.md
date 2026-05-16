# Permissiematrix

## Rollen

- `trainee`
- `ems`
- `supervisor`
- `command`

## Kerncapabilities

- `patients.read`
- `patients.write`
- `cases.read`
- `cases.write`
- `reports.read`
- `reports.write`
- `treatments.read`
- `treatments.write`
- `staff.read`
- `staff.write`
- `evaluations.read`
- `evaluations.write`
- `absences.read`
- `absences.write`
- `meetings.read`
- `meetings.write`
- `minutes.read`
- `minutes.write`
- `guidelines.read`
- `guidelines.write`
- `admin.manage_permissions`

## Richtlijn per rol

### Trainee

- lezen van richtlijnen
- lezen van dossiers en rapporten waar toegang voor is gegeven
- geen HR-beheer
- geen meetingbeheer

### EMS medewerker

- dossiers aanmaken en bewerken
- rapporten schrijven
- behandelingen registreren
- geen personeelsbeheer
- geen globale permissiebeheeracties

### Supervisor

- alles van EMS medewerker
- evaluaties beheren
- afwezigheden opvolgen
- meetings en verslagen beheren
- publicatie van afdelingsrichtlijnen

### Command

- volledige beheerrechten
- rank- en capabilitybeheer
- volledige HR-zichtbaarheid
- volledige organisatie- en handboekrechten

## Specialisatie-afhankelijke restricties

Specialisaties worden gebruikt als extra filter, niet als vervanging van ranks.

Voorbeelden:

- enkel specialisatie `forensisch` ziet forensische richtlijnen
- enkel specialisatie `chirurgie` ziet chirurgische interne protocollen
- enkel specialisatie `psychologie` ziet psychologische verslagtypes

## Aanbevolen aanpak in database

- capabilities als losse records in `permissions`
- koppeling `rank_permissions`
- specialisaties via `profile_specializations`
- optionele extra table `resource_visibility_rules` in latere fase
