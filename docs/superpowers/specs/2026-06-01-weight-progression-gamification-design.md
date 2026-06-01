# Design: Vægtprogression-indikatorer & Gamification

**Dato:** 2026-06-01  
**Status:** Godkendt

---

## Overblik

Tre sammenhængende features der giver visuel feedback og gamification når brugeren stiger i vægt:

1. **Under-trænings badge** — ExerciseCard viser at vægten er steget ift. sidst
2. **Real-time set-adaptation** — Sæt 2's vægt opdateres automatisk hvis sæt 1 reps ≥ 8
3. **Post-workout summary modal** — Fejrer fremgang efter afsluttet træning
4. **Milestones/achievements** — Låser op achievements baseret på træningsdata

---

## Feature 1: Under-trænings badge

### Hvad
Et lille chip/badge øverst i `ExerciseCard` der viser at vægten er steget ift. sidst session.

### Hvornår vises det
Når `suggestWeight(exercise, lastWorkSets)` returnerer `base + incrementFor(exercise)` — dvs. når `allHit === true` i progressionslogikken. Badget vises kun ved session-start (prefill), ikke dynamisk under træningen.

### Udseende
- Tekst: `↑ +2,5 kg` (eller relevant increment)
- Farve: grøn/indigo chip, samme stil som eksisterende type-badges
- Placering: Øverst til højre i ExerciseCard header, ved siden af type-badge

### Implementering
`Workout.jsx` kender allerede til `suggestWeight`-resultatet. Vi sender en `progressedBy`-prop til `ExerciseCard` (number | null) der viser badget hvis > 0.

---

## Feature 2: Real-time set-adaptation

### Hvad
Når brugeren logger reps på sæt 1: hvis reps ≥ 8, opdateres sæt 2's vægt automatisk til `sæt1vægt + incrementFor(exercise)`.

### Logik
```
onReps(set 1, reps):
  if reps >= 8 AND set 2 weight === set 1 weight:
    set 2 weight = set 1 weight + incrementFor(exercise)
```

Betingelsen `set 2 weight === set 1 weight` sikrer at vi ikke overskriver en vægt brugeren selv har ændret.

### Implementering
Logikken placeres i `ExerciseCard.jsx` i `setSetField`-handleren. `exercise`-objektet (som allerede er en prop) bruges til `incrementFor()`. Ingen ændringer til `progression.js` eller `Workout.jsx`.

---

## Feature 3: Post-workout summary modal

### Hvad
En modal der vises efter workout er gemt, i stedet for at navigere direkte til `/`. Brugeren klikker "Fortsæt" for at gå til forsiden.

### Indhold
- **Overskrift**: "Godt klaret!"
- **Nye achievements** (hvis nogen): Gyldne badges øverst
- **Fremgang-sektion**: Øvelser hvor logget vægt > sidst sessions vægt — vises med grøn farve og "80 kg → 82,5 kg ↑"
- **Øvrige øvelser**: Navn + vægt, ingen highlight
- **Luk**: "Fortsæt"-knap navigerer til `/`

### Animation
CSS `transition` + staggered `opacity`/`translateY` — kortene fade-er ind én ad gangen. Ingen ekstern animationsbibliotek.

### Fremgang-detektion
Sammenligner faktisk logget vægt (fra `data`-state) med `lastWorkSets[0].weight` (allerede hentet ved load). Vi gemmer `lastWeights: { [exerciseId]: number }` i en ekstra state-variabel i `Workout.jsx` ved load-tidspunktet.

### Implementering
Ny komponent `WorkoutSummaryModal.jsx`. `Workout.jsx` navigerer ikke direkte efter `insertManySets` men viser modalen i stedet, som så navigerer videre.

---

## Feature 4: Milestones & Achievements

### Opbevaring
`localStorage` — nøgle `gymtracker_achievements`:
```json
{
  "unlocked": { "first_workout": "2026-06-01T10:00:00Z", ... },
  "progressStreaks": { "<exerciseId>": 3, ... }
}
```

### Achievement-katalog

| ID | Titel | Betingelse | Data-kilde |
|---|---|---|---|
| `first_workout` | Første skridt | 1 workout gennemført | Supabase workout count |
| `workouts_10` | 10 i træk | 10 workouts totalt | Supabase workout count |
| `workouts_25` | Halvvejs til 50 | 25 workouts totalt | Supabase workout count |
| `first_progress` | På vej op | Første gang stiger i vægt på en øvelse | Session-data |
| `progress_streak_3` | Momentum | Steg i vægt 3 sessioner i streg på samme øvelse | localStorage streak-tæller |
| `weight_50` | Halvvejs til 100 | Første sæt med ≥ 50 kg | Session-data |
| `weight_100` | Trecifret | Første sæt med ≥ 100 kg | Session-data |

### Tjek-tidspunkt
I `finish()`-flowet i `Workout.jsx`, efter `insertManySets` er succesfuld, før summary-modal vises.

### Ny query
`fetchWorkoutCount()` i `queries.js` — returnerer antal workouts fra Supabase (`count` aggregering på `workouts`-tabellen).

### Progress streak-logik
- Efter hver session: for øvelser der steg i vægt, increment streak-tæller; for øvelser der ikke steg, reset til 0
- Achievement `progress_streak_3` låses op første gang en streak når 3

### Implementering
Ny fil `src/lib/achievements.js` med:
- `checkAchievements(sessionData, workoutCount)` — returnerer array af nyligt unlockede achievements
- `loadAchievements()` / `saveAchievements()` — localStorage I/O

---

## Berørte filer

| Fil | Ændring |
|---|---|
| `src/lib/progression.js` | Ingen ændringer |
| `src/lib/achievements.js` | **Ny** — achievement-logik |
| `src/data/queries.js` | Tilføj `fetchWorkoutCount()` |
| `src/components/ExerciseCard.jsx` | Badge-prop + real-time set-adaptation |
| `src/components/WorkoutSummaryModal.jsx` | **Ny** — summary modal |
| `src/pages/Workout.jsx` | `lastWeights`-state, achievement-tjek, vis modal |
