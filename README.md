# EMS Command Suite

Zelfstandige EMS webapp voor browsergebruik met:

- Supabase Auth
- Supabase Postgres
- rang- en specialisatieafhankelijke autorisatie
- patiëntendossiers en medische rapporten
- personeelsbeheer
- meetings en verslagen
- intern handboek met richtlijnen

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase SSR
- React Hook Form
- Zod

## Structuur

- `src/app`
  App Router pagina's en layout
- `src/components`
  gedeelde UI shells
- `src/lib`
  app-config, rechtenmodel en Supabase helpers
- `src/types`
  domeintypes voor dossiers, personeel en permissies
- `docs`
  technisch ontwerp, permissiematrix en backlog
- `supabase/schema.sql`
  eerste datamodel + RLS-basis

## Snelle start

1. Start de development server

```bash
npm run dev
```

2. Maak `.env.local` op basis van `.env.example`

3. Vul minimaal deze keys in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_ENABLE_DEMO_AUTH`

Als Supabase nog niet is ingevuld, laat `NEXT_PUBLIC_ENABLE_DEMO_AUTH=true` staan.
Dan werkt `/login` met een lokale demosessie en voorbeelddata.

## Eerste implementatiefocus

- auth en profielen
- ranks, capabilities en specialisaties
- patiënten en casussen
- trauma- en opnamerapporten
- behandelingen, verwondingen en medicatie
- personeelslijst, evaluaties, afwezigheden
- meetings en handboek

## Belangrijke ontwerpkeuzes

- `citizenid` is de RP-identiteit voor patiënten en medewerkers
- Supabase `auth.users.id` blijft de technische login-identiteit
- patiëntdata en personeelsprofielen zijn gescheiden domeinen
- toegang wordt niet hardcoded op rangnaam, maar via capabilities

## Documentatie

- [Technisch ontwerp](./docs/technisch-ontwerp.md)
- [Permissiematrix](./docs/permissiematrix.md)
- [Backlog v1](./docs/backlog-v1.md)
- [Delivery workflow](./docs/delivery-workflow.md)
- [Supabase schema](./supabase/schema.sql)
- [Supabase seed](./supabase/seed.sql)
