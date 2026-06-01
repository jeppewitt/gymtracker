# Design: Se og rette i gennemførte træninger

**Dato:** 2026-06-01
**Status:** Godkendt

---

## Overblik

Tilføj adgang til gennemførte træninger direkte fra forsiden. Brugeren kan se alle tidligere workouts og redigere vægt og reps i de loggede sæt.

---

## Rute-struktur

| Rute | Komponent | Beskrivelse |
|---|---|---|
| `/workouts` | `WorkoutLog.jsx` | Liste over alle workouts, nyeste først |
| `/workouts/:workoutId` | `WorkoutLogEdit.jsx` | Redigér ét workout |

---

## Feature 1: Knap på forsiden

Ny knap på `Home.jsx` under dag-knapperne: `"Gennemførte træninger →"`. Samme stil som den eksisterende `"Se historik →"`-knap. Navigerer til `/workouts`.

---

## Feature 2: `/workouts` — liste-siden (`WorkoutLog.jsx`)

### Data
Ny query `fetchAllWorkouts()` i `queries.js`:
- Henter alle rækker fra `workouts`-tabellen: `{ id, day, created_at }`
- Sorteret nyeste først (`order("created_at", { ascending: false })`)

### UI
- Overskrift: "Gennemførte træninger" med `← `tilbage til forsiden
- Liste af klikbare kort, ét per workout
- Kortlabel: dag på dansk + dato, f.eks. `"Mandag · 02. jun 2026"`
- Klik navigerer til `/workouts/:workoutId`
- Viser "Ingen træninger endnu." hvis listen er tom

---

## Feature 3: `/workouts/:workoutId` — redigerings-siden (`WorkoutLogEdit.jsx`)

### Data
Ny query `fetchWorkoutSets(workoutId)` i `queries.js`:
- Henter alle sæt for et workout: `workout_id = workoutId`
- Inkluderer `exercise_id`, `set_number`, `is_warmup`, `reps`, `weight`, `id`
- Joiner med exercises for at få `name` og `type`
- Returnerer: `{ exercises: [...], sets: { [exerciseId]: [{ id, setNumber, reps, weight }] } }`

Ny mutation `updateSet(setId, { reps, weight })` i `queries.js`:
- Opdaterer én række i `sets`-tabellen via `setId`

### UI
- Header: `← Træninger` + dato for workoutet (fra workout-data)
- Én `ExerciseCard` per styrkeøvelse (type !== 'plyo'), med redigerbare felter
- Ingen opvarmningssæt vises (is_warmup === true filtreres fra)
- `value`-prop til ExerciseCard: `{ warmupWeight: "", sets: [{ weight, reps }] }`
- `progressedBy` sættes til `null` (ikke relevant ved redigering)
- Knap: `"Gem ændringer"` — kører `updateSet` for alle sæt
- Efter gem: viser `"Gemt ✓"` i knappen i 2 sekunder, ingen navigation

### Gem-logik
Sammenligner original `data` (fra load) med nuværende `data` (fra state). Kun sæt hvor vægt eller reps er ændret sendes til databasen. Hvis intet er ændret gøres ingenting.

---

## Berørte filer

| Fil | Ændring |
|---|---|
| `src/data/queries.js` | Tilføj `fetchAllWorkouts`, `fetchWorkoutSets`, `updateSet` |
| `src/pages/WorkoutLog.jsx` | **Ny** — liste-side |
| `src/pages/WorkoutLogEdit.jsx` | **Ny** — redigerings-side |
| `src/App.jsx` | Tilføj ruter `/workouts` og `/workouts/:workoutId` |
| `src/pages/Home.jsx` | Tilføj "Gennemførte træninger"-knap |
