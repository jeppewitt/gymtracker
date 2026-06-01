# Weight Progression Gamification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tilføj visuelle fremgangs-indikatorer, real-time set-adaptation og achievements til gym tracker appen.

**Architecture:** Achievement-logik lever i en ren `achievements.js` (ingen I/O-afhængigheder), en ny `WorkoutSummaryModal` komponent håndterer post-workout UI, og `Workout.jsx` koordinerer flow. `ExerciseCard` får en `progressedBy`-prop og inline set-adaptation-logik.

**Tech Stack:** React, Vitest, Tailwind CSS, localStorage, Supabase

---

## Fil-oversigt

| Fil | Status | Ansvar |
|---|---|---|
| `src/lib/achievements.js` | **Ny** | Pure achievement-logik + localStorage I/O |
| `src/lib/achievements.test.js` | **Ny** | Tests for achievements.js |
| `src/data/queries.js` | Modificer | Tilføj `fetchWorkoutCount()` |
| `src/components/ExerciseCard.jsx` | Modificer | Badge-prop + real-time set-adaptation |
| `src/components/WorkoutSummaryModal.jsx` | **Ny** | Post-workout summary UI |
| `src/pages/Workout.jsx` | Modificer | lastWeights state, achievement-tjek, vis modal |

---

## Task 1: achievements.js — pure logik + tests

**Files:**
- Create: `src/lib/achievements.js`
- Create: `src/lib/achievements.test.js`

- [ ] **Step 1: Skriv den fejlende test**

Opret `src/lib/achievements.test.js`:

```js
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  loadAchievements,
  saveAchievements,
  checkAchievements,
  ACHIEVEMENTS,
} from "./achievements";

const emptyState = () => ({ unlocked: {}, progressStreaks: {} });

beforeEach(() => {
  localStorage.clear();
});

describe("loadAchievements", () => {
  it("returnerer tomt state når localStorage er tom", () => {
    expect(loadAchievements()).toEqual({ unlocked: {}, progressStreaks: {} });
  });

  it("returnerer gemt state", () => {
    const state = { unlocked: { first_workout: "2026-01-01" }, progressStreaks: {} };
    localStorage.setItem("gymtracker_achievements", JSON.stringify(state));
    expect(loadAchievements()).toEqual(state);
  });

  it("returnerer tomt state ved korrupt JSON", () => {
    localStorage.setItem("gymtracker_achievements", "ikke-json");
    expect(loadAchievements()).toEqual({ unlocked: {}, progressStreaks: {} });
  });
});

describe("checkAchievements", () => {
  const noProgress = { progressed: [], notProgressed: ["ex1"], maxWeight: 0 };

  it("låser first_workout op ved 1 workout", () => {
    const result = checkAchievements(noProgress, 1);
    expect(result.map((a) => a.id)).toContain("first_workout");
  });

  it("låser workouts_10 op ved 10 workouts", () => {
    const result = checkAchievements(noProgress, 10);
    expect(result.map((a) => a.id)).toContain("workouts_10");
  });

  it("låser workouts_25 op ved 25 workouts", () => {
    const result = checkAchievements(noProgress, 25);
    expect(result.map((a) => a.id)).toContain("workouts_25");
  });

  it("låser first_progress op ved første vægtfremgang", () => {
    const session = { progressed: [{ exerciseId: "ex1" }], notProgressed: [], maxWeight: 60 };
    const result = checkAchievements(session, 1);
    expect(result.map((a) => a.id)).toContain("first_progress");
  });

  it("låser weight_50 op ved maxWeight >= 50", () => {
    const session = { progressed: [], notProgressed: [], maxWeight: 50 };
    const result = checkAchievements(session, 1);
    expect(result.map((a) => a.id)).toContain("weight_50");
  });

  it("låser weight_100 op ved maxWeight >= 100", () => {
    const session = { progressed: [], notProgressed: [], maxWeight: 100 };
    const result = checkAchievements(session, 1);
    expect(result.map((a) => a.id)).toContain("weight_100");
  });

  it("låser progress_streak_3 op ved 3 sessioners streak", () => {
    // 2 tidligere sessioner med fremgang på ex1
    saveAchievements({ unlocked: {}, progressStreaks: { ex1: 2 } });
    const session = { progressed: [{ exerciseId: "ex1" }], notProgressed: [], maxWeight: 60 };
    const result = checkAchievements(session, 3);
    expect(result.map((a) => a.id)).toContain("progress_streak_3");
  });

  it("resetter streak for øvelse uden fremgang", () => {
    saveAchievements({ unlocked: {}, progressStreaks: { ex1: 2 } });
    const session = { progressed: [], notProgressed: ["ex1"], maxWeight: 60 };
    checkAchievements(session, 1);
    expect(loadAchievements().progressStreaks.ex1).toBe(0);
  });

  it("returnerer ikke allerede unlockede achievements igen", () => {
    saveAchievements({ unlocked: { first_workout: "2026-01-01" }, progressStreaks: {} });
    const result = checkAchievements(noProgress, 1);
    expect(result.map((a) => a.id)).not.toContain("first_workout");
  });

  it("gemmer state i localStorage", () => {
    checkAchievements(noProgress, 1);
    const state = loadAchievements();
    expect(state.unlocked.first_workout).toBeDefined();
  });
});
```

- [ ] **Step 2: Kør test for at bekræfte de fejler**

```bash
cd /Users/jeppe/gymtracker && npx vitest run src/lib/achievements.test.js
```

Forventet: FAIL — "achievements" module not found.

- [ ] **Step 3: Implementer achievements.js**

Opret `src/lib/achievements.js`:

```js
const KEY = "gymtracker_achievements";

export const ACHIEVEMENTS = [
  { id: "first_workout", title: "Første skridt", description: "Gennemfør din første træning" },
  { id: "workouts_10", title: "10 i træk", description: "10 træninger gennemført" },
  { id: "workouts_25", title: "Halvvejs til 50", description: "25 træninger gennemført" },
  { id: "first_progress", title: "På vej op", description: "Første gang du stiger i vægt" },
  { id: "progress_streak_3", title: "Momentum", description: "Steg i vægt 3 sessioner i streg på samme øvelse" },
  { id: "weight_50", title: "Halvvejs til 100", description: "Løftede ≥ 50 kg i et sæt" },
  { id: "weight_100", title: "Trecifret", description: "Løftede ≥ 100 kg i et sæt" },
];

export function loadAchievements() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { unlocked: {}, progressStreaks: {} };
    return JSON.parse(raw);
  } catch {
    return { unlocked: {}, progressStreaks: {} };
  }
}

export function saveAchievements(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

// sessionData: {
//   progressed: [{ exerciseId }],   — øvelser der steg i vægt denne session
//   notProgressed: [exerciseId],     — øvelser der IKKE steg i vægt
//   maxWeight: number,               — højeste vægt logget i sessionen (kg)
// }
// workoutCount: number (totalt antal workouts inkl. denne)
// Returns: array af nyligt unlockede achievement-objekter
export function checkAchievements(sessionData, workoutCount) {
  const state = loadAchievements();
  const newlyUnlocked = [];

  function unlock(id) {
    if (!state.unlocked[id]) {
      state.unlocked[id] = new Date().toISOString();
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      if (def) newlyUnlocked.push(def);
    }
  }

  if (workoutCount >= 1) unlock("first_workout");
  if (workoutCount >= 10) unlock("workouts_10");
  if (workoutCount >= 25) unlock("workouts_25");

  if (sessionData.progressed.length > 0) {
    unlock("first_progress");
    for (const { exerciseId } of sessionData.progressed) {
      state.progressStreaks[exerciseId] = (state.progressStreaks[exerciseId] || 0) + 1;
      if (state.progressStreaks[exerciseId] >= 3) unlock("progress_streak_3");
    }
  }

  for (const exerciseId of sessionData.notProgressed) {
    state.progressStreaks[exerciseId] = 0;
  }

  if (sessionData.maxWeight >= 50) unlock("weight_50");
  if (sessionData.maxWeight >= 100) unlock("weight_100");

  saveAchievements(state);
  return newlyUnlocked;
}
```

- [ ] **Step 4: Kør test for at bekræfte de består**

```bash
cd /Users/jeppe/gymtracker && npx vitest run src/lib/achievements.test.js
```

Forventet: All tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/jeppe/gymtracker && git add src/lib/achievements.js src/lib/achievements.test.js && git commit -m "feat: add achievement logic with localStorage persistence"
```

---

## Task 2: fetchWorkoutCount — ny Supabase query

**Files:**
- Modify: `src/data/queries.js`

- [ ] **Step 1: Tilføj `fetchWorkoutCount` til queries.js**

Tilføj følgende funktion i bunden af `src/data/queries.js`:

```js
// Returnerer det totale antal workouts i databasen.
export async function fetchWorkoutCount() {
  const { count, error } = await supabase
    .from("workouts")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}
```

- [ ] **Step 2: Verificer at appen stadig bygger**

```bash
cd /Users/jeppe/gymtracker && npx vite build 2>&1 | tail -5
```

Forventet: `built in X.XXs` uden fejl.

- [ ] **Step 3: Commit**

```bash
cd /Users/jeppe/gymtracker && git add src/data/queries.js && git commit -m "feat: add fetchWorkoutCount query"
```

---

## Task 3: ExerciseCard — badge + real-time set-adaptation

**Files:**
- Modify: `src/components/ExerciseCard.jsx`

ExerciseCard modtager en ny `progressedBy`-prop (number | null). Viser et grønt badge hvis `progressedBy > 0`. Desuden: når reps sættes på sæt 0 til >= 8, og sæt 0 og sæt 1 har samme vægt, bumpes sæt 1's vægt med `incrementFor(exercise)`.

- [ ] **Step 1: Opdater ExerciseCard.jsx**

Erstat hele indholdet af `src/components/ExerciseCard.jsx`:

```jsx
import { incrementFor } from "../lib/progression";
import SetRow from "./SetRow";

const TYPE_LABEL = { compound: "Compound", isolation: "Isolation", plyo: "Plyo" };
const TYPE_STYLE = {
  compound: "bg-indigo-50 text-indigo-600",
  isolation: "bg-violet-50 text-violet-600",
  plyo: "bg-amber-50 text-amber-600",
};

function parseW(str) {
  return parseFloat(String(str).replace(",", ".")) || 0;
}

// progressedBy: number | null — hvis > 0 vises et "↑ +Xkg"-badge
export default function ExerciseCard({ exercise, value, onChange, progressedBy }) {
  const isPlyo = exercise.type === "plyo";

  const setWarmup = (w) => onChange({ ...value, warmupWeight: w });

  const setSetField = (i, field, v) => {
    let nextSets = value.sets.map((s, j) => (j === i ? { ...s, [field]: v } : s));

    // Real-time adaptation: reps sæt 0 >= 8 → bump sæt 1 vægt
    if (
      i === 0 &&
      field === "reps" &&
      parseInt(v, 10) >= 8 &&
      nextSets.length >= 2
    ) {
      const w0 = parseW(nextSets[0].weight);
      const w1 = parseW(nextSets[1].weight);
      if (w0 === w1 && w0 > 0) {
        const bumped = w0 + incrementFor(exercise);
        nextSets = nextSets.map((s, j) =>
          j === 1 ? { ...s, weight: String(bumped).replace(".", ",") } : s
        );
      }
    }

    onChange({ ...value, sets: nextSets });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-slate-900">{exercise.name}</h2>
        <div className="flex items-center gap-2 shrink-0">
          {progressedBy != null && progressedBy > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
              ↑ +{progressedBy} kg
            </span>
          )}
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_STYLE[exercise.type]}`}
          >
            {TYPE_LABEL[exercise.type]}
          </span>
        </div>
      </div>

      {isPlyo ? (
        <p className="text-slate-500">Påmindelse — udfør sættene, ingen logning.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <SetRow
            label="Opvarm."
            weight={value.warmupWeight}
            showReps={false}
            onWeight={setWarmup}
          />
          {value.sets.map((s, i) => (
            <SetRow
              key={i}
              label={`Sæt ${i + 1}`}
              weight={s.weight}
              reps={s.reps}
              showReps
              onWeight={(w) => setSetField(i, "weight", w)}
              onReps={(r) => setSetField(i, "reps", r)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificer at appen bygger**

```bash
cd /Users/jeppe/gymtracker && npx vite build 2>&1 | tail -5
```

Forventet: `built in X.XXs` uden fejl.

- [ ] **Step 3: Commit**

```bash
cd /Users/jeppe/gymtracker && git add src/components/ExerciseCard.jsx && git commit -m "feat: add progress badge and real-time set weight adaptation to ExerciseCard"
```

---

## Task 4: WorkoutSummaryModal — ny komponent

**Files:**
- Create: `src/components/WorkoutSummaryModal.jsx`

Modalen modtager:
- `exercises` — array af exercise-objekter (fra Workout.jsx state)
- `data` — `{ [exerciseId]: { sets: [{ weight, reps }] } }` — logget data denne session
- `lastWeights` — `{ [exerciseId]: number }` — vægten fra forrige session
- `newAchievements` — array af achievement-objekter `{ id, title, description }`
- `onClose` — callback der navigerer til `/`

- [ ] **Step 1: Opret WorkoutSummaryModal.jsx**

Opret `src/components/WorkoutSummaryModal.jsx`:

```jsx
import { useEffect, useState } from "react";
import Button from "./Button";

function parseW(str) {
  return parseFloat(String(str ?? "0").replace(",", ".")) || 0;
}

export default function WorkoutSummaryModal({
  exercises,
  data,
  lastWeights,
  newAchievements,
  onClose,
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Lille forsinkelse sikrer at CSS transitions kører
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const strengthExercises = exercises.filter((e) => e.type !== "plyo");

  const rows = strengthExercises.map((ex) => {
    const d = data[ex.id];
    const loggedWeight = d
      ? Math.max(...d.sets.map((s) => parseW(s.weight)))
      : 0;
    const prevWeight = lastWeights[ex.id] ?? null;
    const progressed = prevWeight != null && loggedWeight > prevWeight;
    return { ex, loggedWeight, prevWeight, progressed };
  });

  const progressedRows = rows.filter((r) => r.progressed);
  const otherRows = rows.filter((r) => !r.progressed);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm px-4 pb-8">
      <div
        className={`w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 transition-all duration-400 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Godt klaret! 💪</h2>
        <p className="text-slate-500 text-sm mb-5">Her er hvad du præsterede i dag.</p>

        {newAchievements.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">
              Nye achievements
            </p>
            <div className="flex flex-col gap-2">
              {newAchievements.map((a, i) => (
                <div
                  key={a.id}
                  className={`flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 transition-all duration-300`}
                  style={{
                    transitionDelay: `${i * 80}ms`,
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(8px)",
                  }}
                >
                  <span className="text-xl">🏅</span>
                  <div>
                    <p className="font-bold text-amber-800 text-sm">{a.title}</p>
                    <p className="text-amber-600 text-xs">{a.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {progressedRows.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">
              Fremgang
            </p>
            <div className="flex flex-col gap-2">
              {progressedRows.map(({ ex, loggedWeight, prevWeight }, i) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 transition-all duration-300"
                  style={{
                    transitionDelay: `${(newAchievements.length + i) * 80}ms`,
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(8px)",
                  }}
                >
                  <span className="font-semibold text-slate-800 text-sm">{ex.name}</span>
                  <span className="text-emerald-600 font-bold text-sm">
                    {prevWeight} kg → {loggedWeight} kg ↑
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {otherRows.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Øvrige øvelser
            </p>
            <div className="flex flex-col gap-2">
              {otherRows.map(({ ex, loggedWeight }, i) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3 transition-all duration-300"
                  style={{
                    transitionDelay: `${(newAchievements.length + progressedRows.length + i) * 80}ms`,
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(8px)",
                  }}
                >
                  <span className="font-semibold text-slate-700 text-sm">{ex.name}</span>
                  <span className="text-slate-500 text-sm">{loggedWeight} kg</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button onClick={onClose}>Fortsæt</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificer at appen bygger**

```bash
cd /Users/jeppe/gymtracker && npx vite build 2>&1 | tail -5
```

Forventet: `built in X.XXs` uden fejl.

- [ ] **Step 3: Commit**

```bash
cd /Users/jeppe/gymtracker && git add src/components/WorkoutSummaryModal.jsx && git commit -m "feat: add WorkoutSummaryModal component"
```

---

## Task 5: Workout.jsx — saml det hele

**Files:**
- Modify: `src/pages/Workout.jsx`

Ændringer:
1. Tilføj `lastWeights` state — gemmer `{ [exerciseId]: number }` ved load
2. Beregn `progressedBy` per øvelse og send som prop til `ExerciseCard`
3. Efter `insertManySets`: kald `fetchWorkoutCount`, kør `checkAchievements`, vis modal
4. Modal's `onClose` navigerer til `/`

- [ ] **Step 1: Opdater Workout.jsx**

Erstat hele indholdet af `src/pages/Workout.jsx`:

```jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchExercisesForDay,
  fetchLastWorkSets,
  createWorkout,
  insertManySets,
  fetchWorkoutCount,
} from "../data/queries";
import { suggestWeight, warmupWeight, incrementFor } from "../lib/progression";
import { checkAchievements } from "../lib/achievements";
import ExerciseCard from "../components/ExerciseCard";
import WorkoutSummaryModal from "../components/WorkoutSummaryModal";
import Button from "../components/Button";

const DAY_LABELS = { mon: "Mandag", wed: "Onsdag", fri: "Fredag" };

function parseNum(v) {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export default function Workout() {
  const { day } = useParams();
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [data, setData] = useState({});
  const [lastWeights, setLastWeights] = useState({});   // exerciseId -> number
  const [progressedByMap, setProgressedByMap] = useState({}); // exerciseId -> number|null
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null); // null | { newAchievements }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchExercisesForDay(day);
        const strength = list.filter((e) => e.type !== "plyo");
        const lastWeightsAcc = {};
        const progressedAcc = {};
        const entries = await Promise.all(
          strength.map(async (e) => {
            const last = await fetchLastWorkSets(e.id);
            const s = suggestWeight(e, last);
            const base = last.length > 0 ? last[0].weight : null;
            lastWeightsAcc[e.id] = base ?? 0;
            progressedAcc[e.id] =
              s != null && base != null && s > base ? incrementFor(e) : null;
            const w = s != null ? String(s).replace(".", ",") : "";
            const wu = warmupWeight(s);
            const wuStr = wu != null ? String(wu).replace(".", ",") : "";
            return [
              e.id,
              {
                warmupWeight: wuStr,
                sets: [
                  { weight: w, reps: "8" },
                  { weight: w, reps: "8" },
                ],
              },
            ];
          })
        );
        if (cancelled) return;
        setExercises(list);
        setData(Object.fromEntries(entries));
        setLastWeights(lastWeightsAcc);
        setProgressedByMap(progressedAcc);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [day]);

  const update = (exId, next) => setData((d) => ({ ...d, [exId]: next }));

  const finish = async () => {
    setSaving(true);
    setError(null);
    try {
      const workout = await createWorkout(day);
      const rows = [];
      for (const ex of exercises) {
        if (ex.type === "plyo") continue;
        const d = data[ex.id];
        rows.push({
          workout_id: workout.id,
          exercise_id: ex.id,
          set_number: 0,
          is_warmup: true,
          reps: null,
          weight: parseNum(d.warmupWeight),
        });
        d.sets.forEach((s, i) => {
          rows.push({
            workout_id: workout.id,
            exercise_id: ex.id,
            set_number: i + 1,
            is_warmup: false,
            reps: parseInt(s.reps, 10) || 0,
            weight: parseNum(s.weight),
          });
        });
      }
      await insertManySets(rows);

      // Achievement-tjek
      const strengthExs = exercises.filter((e) => e.type !== "plyo");
      const progressed = [];
      const notProgressed = [];
      let maxWeight = 0;
      for (const ex of strengthExs) {
        const d = data[ex.id];
        const loggedMax = Math.max(...d.sets.map((s) => parseNum(s.weight)));
        maxWeight = Math.max(maxWeight, loggedMax);
        if (loggedMax > (lastWeights[ex.id] ?? 0)) {
          progressed.push({ exerciseId: ex.id });
        } else {
          notProgressed.push(ex.id);
        }
      }
      const workoutCount = await fetchWorkoutCount();
      const newAchievements = checkAchievements(
        { progressed, notProgressed, maxWeight },
        workoutCount
      );

      setSummary({ newAchievements });
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  if (loading) return <Centered>Indlæser…</Centered>;
  if (error && exercises.length === 0) return <Centered>Fejl: {error}</Centered>;

  return (
    <div className="min-h-full pb-12 max-w-md mx-auto">
      <div className="sticky top-0 z-10 bg-[#f4f4f7]/90 backdrop-blur px-5 pt-6 pb-4 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
          {DAY_LABELS[day] ?? "Workout"}
        </h1>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            className="!w-auto px-4 !min-h-[48px] !text-base"
            onClick={() => navigate("/")}
          >
            ✕ Annuller
          </Button>
          <Button
            className="!w-auto px-5 !min-h-[48px] !text-base"
            onClick={finish}
            disabled={saving}
          >
            ✓ {saving ? "Gemmer…" : "Afslut"}
          </Button>
        </div>
      </div>

      {error && <p className="text-red-500 px-5 mb-3">Fejl: {error}</p>}

      <div className="px-5 flex flex-col gap-5">
        {exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            value={data[ex.id]}
            onChange={(next) => update(ex.id, next)}
            progressedBy={progressedByMap[ex.id] ?? null}
          />
        ))}
      </div>

      {summary && (
        <WorkoutSummaryModal
          exercises={exercises}
          data={data}
          lastWeights={lastWeights}
          newAchievements={summary.newAchievements}
          onClose={() => navigate("/")}
        />
      )}
    </div>
  );
}

function Centered({ children }) {
  return (
    <div className="h-full flex items-center justify-center text-slate-500 text-lg px-6 text-center">
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Kør alle tests**

```bash
cd /Users/jeppe/gymtracker && npx vitest run
```

Forventet: All tests PASS.

- [ ] **Step 3: Verificer at appen bygger**

```bash
cd /Users/jeppe/gymtracker && npx vite build 2>&1 | tail -5
```

Forventet: `built in X.XXs` uden fejl.

- [ ] **Step 4: Commit**

```bash
cd /Users/jeppe/gymtracker && git add src/pages/Workout.jsx && git commit -m "feat: wire up progress badges, achievements and summary modal in Workout"
```
