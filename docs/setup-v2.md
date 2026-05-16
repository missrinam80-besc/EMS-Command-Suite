# Setup v2

## Demo-modus

Gebruik demo-modus wanneer je:

- de frontend lokaal wilt ontwikkelen
- nog geen Supabase project hebt gekoppeld
- al protected routes en flows wilt testen

Instelling:

```env
NEXT_PUBLIC_ENABLE_DEMO_AUTH=true
```

In deze modus:

- werkt `/login` met een lokale sessiecookie
- gebruikt de patiëntenmodule mockdata
- blijven build en lint zonder externe services bruikbaar

## Supabase-modus

Zet demo-modus uit en vul echte credentials in:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_ENABLE_DEMO_AUTH=false
```

## Database bootstrap

1. Run `supabase/schema.sql`
2. Run `supabase/seed.sql`
3. Maak daarna echte users aan in Supabase Auth
4. Koppel voor elke user een record in `public.profiles`

## Eerste functionele routes

- `/login`
- `/zorg`
- `/zorg/patienten`
- `/personeel`
- `/organisatie`
- `/handboek`
