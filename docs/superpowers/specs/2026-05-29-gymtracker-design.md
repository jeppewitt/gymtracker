# Gymtracker — Designspecifikation

**Dato:** 2026-05-29
**Status:** Godkendt design, klar til implementeringsplan

## Formål

En mobil-first trænings-webapp til personligt brug. Brugeren vælger en træningsdag
(mandag/onsdag/fredag), gennemgår dagens øvelser én ad gangen med minimal interaktion,
og logger reps på arbejdssæt. Appen foreslår automatisk næste vægt ud fra progressionsregler
og viser historik med grafer pr. øvelse.

Single-user. Ingen login. Skal kunne bruges i gym uden besvær (store touch-targets, mørkt tema).

## Tech stack

- **React + Vite + Tailwind CSS** — mobile-first, mørkt tema.
- **Supabase** (JS-klient, `@supabase/supabase-js`) til datapersistering. Ingen auth, RLS slået fra.
- **react-router-dom** til navigation.
- **recharts** til linjegrafer i historik.
- Konfiguration via `.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Separat git-repo i `gymtracker/` (remote: `jeppewitt/gymtracker`).

## Datamodel (Supabase)

### `exercises` (statisk, seedes)
| kolonne | type | note |
|---|---|---|
| id | bigint PK | |
| name | text | fx "Smith incline bench" |
| type | text | `compound` \| `isolation` \| `plyo` |
| day | text | `mon` \| `wed` \| `fri` |
| order_index | int | rækkefølge i dagens workout |

### `workouts`
| kolonne | type | note |
|---|---|---|
| id | bigint PK | |
| day | text | `mon` \| `wed` \| `fri` |
| created_at | timestamptz | default now() |

### `sets`
| kolonne | type | note |
|---|---|---|
| id | bigint PK | |
| workout_id | bigint FK → workouts.id | |
| exercise_id | bigint FK → exercises.id | |
| set_number | int | 1 eller 2 (arbejdssæt); warmup = 0 |
| is_warmup | boolean | |
| reps | int (nullable) | null for warmup |
| weight | numeric | kg; for pull-ups = tillægsvægt (0 = kropsvægt) |
| created_at | timestamptz | default now() |

Et `schema.sql`-script i `supabase/schema.sql` opretter tabeller og seeder alle 21 øvelser.

## Program (seed)

**Mandag (`mon`):** Box jumps (plyo), Smith incline bench (compound), Squats (compound),
Plate loaded row maskine (compound), Leg curls (isolation), Incline DB curls (isolation), Dips (compound)

**Onsdag (`wed`):** Broad jumps (plyo), Lateral bounds (plyo), DB bench press (compound),
Romanian deadlift (compound), Pull-ups (compound), Walking lunges (compound), Lateral raises (isolation)

**Fredag (`fri`):** Single-leg hop (plyo), Med ball slam (plyo), Military press (compound),
Cable rows (compound), Hip thrust (compound), Leg extension (isolation), Reverse cable flyes (isolation)

`order_index` følger rækkefølgen ovenfor.

## Brugerflow

### Startskærm (`/`)
- Tre store knapper: **Mandag / Onsdag / Fredag** → `/workout/:day`.
- Knap til **Historik** → `/history`.

### Workout-skærm (`/workout/:day`)
Øvelser vises **én ad gangen** i `order_index`-rækkefølge. Ved start oprettes en `workouts`-række.

**Plyo-øvelse:**
- Stort navn + kort påmindelsestekst.
- Én "Færdig"-knap → næste øvelse. **Intet logges.**

**Styrkeøvelse (compound/isolation):**
1. **Foreslået vægt** vises stort (se progressionslogik).
   - Ingen historik → redigerbart inputfelt (brugeren indtaster startvægt).
   - Historik findes → vægt **låst** til forslaget (ingen redigering).
2. **Warmup:** ét tap "Warmup færdig" → logges som `set_number=0, is_warmup=true, reps=null,
   weight=arbejdsvægt`.
3. **Arbejdssæt 1:** indtast reps (failure-punkt) via store +/− knapper og talfelt → gem
   (`set_number=1, is_warmup=false`).
4. **Arbejdssæt 2:** indtast reps → gem (`set_number=2, is_warmup=false`) → næste øvelse.

Sæt gemmes **løbende** til Supabase efterhånden som de fuldføres (ikke kun til sidst), så en
afbrudt forbindelse ikke mister hele træningen.

Efter sidste øvelse: **"Afslut workout"** → tilbage til startskærm.

### Minimal interaktion
- Plyo: ét tap.
- Warmup: ét tap.
- Arbejdssæt: ét talindtastning (reps) via +/− og talfelt, derefter ét tap videre.

## Progressionslogik

Ved start af hver styrkeøvelse hentes seneste tidligere workouts arbejdssæt for den øvelse:

- **Begge arbejdssæt ≥ 8 reps** → `foreslået vægt = sidste vægt + increment`.
- **Et eller begge < 8 reps** → `foreslået vægt = sidste vægt` (hold).
- **Ingen historik** → ingen forslag; brugeren indtaster selv (felt tomt/redigerbart).

**Increment pr. type:**
- Compound: **+2,5 kg**
- Isolation: **+1,25 kg**
- Pull-ups: **+1,25 kg** (vægtbælte; `weight` = tillægsvægt, 0 = kun kropsvægt)

Pull-ups behandles som compound men med 1,25 kg-increment (special-case på øvelsesnavn/id).

## Historik & grafer (`/history`, `/history/:exerciseId`)

- `/history`: liste over alle øvelser, grupperet pr. dag (kun styrkeøvelser; plyo udelades da de
  ikke logges).
- `/history/:exerciseId`: **linjegraf** (recharts) over arbejdsvægt over tid + liste over sessioner
  med dato og reps pr. arbejdssæt.
- Decimaler vises i dansk format (komma, fx "2,5 kg").

## Design

- **Mørkt tema:** baggrund næsten-sort, lys tekst, én accentfarve (primær-knap).
- **Store, læsevenlige elementer:** touch-targets min. 56px, stor typografi til vægt/reps.
- **Ét fokus pr. skærm:** kun den aktuelle øvelse vises; ingen dekorative elementer.
- Tailwind med en lille, konsistent farve- og spacing-palet.

## Komponentstruktur (skitse)

- `App` — router-opsætning.
- `lib/supabase.js` — klient.
- `lib/progression.js` — ren funktion: `suggestWeight(exercise, lastWorkSets)`. Testbar isoleret.
- `pages/Home` — dagsvalg + historik-link.
- `pages/Workout` — styrer rækkefølge/state for dagens øvelser; opretter workout, gemmer sæt.
  - `components/PlyoCard`
  - `components/StrengthCard` — viser vægt, warmup-tap, reps-input pr. arbejdssæt.
  - `components/RepInput` — +/− talindtastning.
- `pages/History` — øvelsesliste.
- `pages/ExerciseHistory` — graf + sessionsliste.

## Test

- Enhedstest af `progression.js` (Vitest): begge ≥8 → op; under 8 → hold; increments pr. type;
  pull-ups special-case; ingen historik → intet forslag.
- Manuel verifikation af flow i browser (mobil-viewport).

## Åbne afhængigheder

- **Supabase-provisionering:** Brugeren kører `supabase/schema.sql` manuelt i Supabase SQL Editor
  (RLS slået til med åbne policies for anon-nøglen).

## Revision 2026-05-29 — UI-redesign

Efter første implementering blev designet og workout-flowet ændret på brugerens ønske:

- **Lyst tema** (lys baggrund, hvide kort, indigo→violet gradient-accent) i stedet for mørkt.
- **Workout = én skærm:** alle øvelser som kort i en scroll-liste i stedet for én øvelse ad gangen.
  Hvert styrkekort viser warmup-række + 2 arbejdssæt med inline-redigerbare felter
  (vægt × reps). Felterne er **forudfyldt** med foreslået vægt + 8 reps; brugeren retter kun
  det der afviger.
- **Vægt er nu redigerbar** pr. sæt (tidligere "låst til forslag"). Progressionen bruges som
  forudfyldning, ikke som lås.
- **Gem samlet:** `workouts`-rækken oprettes og alle sæt indsættes i ét kald, når brugeren
  trykker **Afslut** (progressiv save pr. sæt er udgået sammen med trin-flowet).
- Komponentændring: `StrengthCard`/`PlyoCard`/`RepInput` erstattet af `ExerciseCard` + `SetRow`.
  `queries.insertSet` erstattet af `queries.insertManySets`.
