# Gymtracker

Mobil trænings-webapp (React + Vite + Tailwind + Supabase).

**Live:** https://gymtracker-jeppewitt.netlify.app

## Lokal udvikling

```bash
npm install
cp .env.example .env   # udfyld VITE_SUPABASE_URL og VITE_SUPABASE_ANON_KEY
npm run dev
```

## Test

```bash
npm test
```

## Database

Kør `supabase/schema.sql` i Supabase SQL Editor (tabeller + seed af øvelser).
Nulstil træningsdata med `node scripts/clear-data.mjs`.

## Deploy

Push til `main` → Netlify auto-deployer. Manuel deploy: `npx netlify-cli deploy --build --prod`.

Dokumentation: `docs/superpowers/specs/` (design) og `docs/superpowers/plans/` (plan).
