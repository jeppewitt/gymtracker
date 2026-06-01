# Workout Log Edit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tilføj adgang fra forsiden til en liste over gennemførte træninger, med mulighed for at redigere vægt og reps i hvert sæt.

**Architecture:** Fire nye queries i `queries.js` håndterer data-laget. To nye sider (`WorkoutLog`, `WorkoutLogEdit`) håndterer hhv. liste og redigering. `WorkoutLogEdit` genbruger `ExerciseCard`-komponenten med samme `data`-struktur som `Workout.jsx`. Set-IDs gemmes i en separat `setIds`-map så vi kan kalde `updateSet` på kun ændrede sæt.

**Tech Stack:** React, React Router, Supabase, Tailwind CSS

---

## Fil-oversigt

| Fil | Status | Ansvar |
|---|---|---|
| `src/data/queries.js` | Modificer | Tilføj `fetchAllWorkouts`, `fetchWorkoutById`, `fetchWorkoutSets`, `updateSet` |
| `src/pages/WorkoutLog.jsx` | **Ny** | Liste over alle workouts (`/workouts`) |
| `src/pages/WorkoutLogEdit.jsx` | **Ny** | Redigér ét workout (`/workouts/:workoutId`) |
| `src/App.jsx` | Modificer | Tilføj de to nye ruter |
| `src/pages/Home.jsx` | Modificer | Tilføj "Gennemførte træninger"-knap |

---

## Task 1: Nye queries

**Files:**
- Modify: `src/data/queries.js`

- [ ] **Step 1: Tilføj de fire nye funktioner i bunden af `src/data/queries.js`**

```js
// Returnerer alle workouts, nyeste først.
export async function fetchAllWorkouts() {
  const { data, error } = await supabase
    .from("workouts")
    .select("id, day, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// Returnerer et enkelt workout (id, day, created_at).
export async function fetchWorkoutById(workoutId) {
  const { data, error } = await supabase
    .from("workouts")
    .select("id, day, created_at")
    .eq("id", workoutId)
    .single();
  if (error) throw error;
  return data;
}

// Returnerer alle arbejdssæt for et workout grupperet per øvelse.
// Resultat: { exercises: [...], sets: { [exerciseId]: [{ id, setNumber, reps, weight }] } }
export async function fetchWorkoutSets(workoutId) {
  const { data, error } = await supabase
    .from("sets")
    .select("id, set_number, reps, weight, exercise_id, exercises(id, name, type, day, order_index)")
    .eq("workout_id", workoutId)
    .eq("is_warmup", false)
    .order("exercise_id", { ascending: true })
    .order("set_number", { ascending: true });
  if (error) throw error;

  const exerciseMap = new Map();
  const setsMap = {};

  for (const row of data) {
    const ex = row.exercises;
    if (!exerciseMap.has(ex.id)) {
      exerciseMap.set(ex.id, ex);
      setsMap[ex.id] = [];
    }
    setsMap[ex.id].push({
      id: row.id,
      setNumber: row.set_number,
      reps: row.reps,
      weight: Number(row.weight),
    });
  }

  const exercises = Array.from(exerciseMap.values()).sort(
    (a, b) => a.order_index - b.order_index
  );

  return { exercises, sets: setsMap };
}

// Opdaterer reps og weight på ét sæt.
export async function updateSet(setId, { reps, weight }) {
  const { error } = await supabase
    .from("sets")
    .update({ reps, weight })
    .eq("id", setId);
  if (error) throw error;
}
```

- [ ] **Step 2: Verificer at appen bygger**

```bash
cd /Users/jeppe/gymtracker && npx vite build 2>&1 | tail -5
```

Forventet: `✓ built in X.XXs` uden fejl.

- [ ] **Step 3: Commit**

```bash
cd /Users/jeppe/gymtracker && git add src/data/queries.js && git commit -m "feat: add fetchAllWorkouts, fetchWorkoutById, fetchWorkoutSets, updateSet queries"
```

---

## Task 2: WorkoutLog.jsx — liste-side

**Files:**
- Create: `src/pages/WorkoutLog.jsx`

- [ ] **Step 1: Opret `src/pages/WorkoutLog.jsx`**

```jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllWorkouts } from "../data/queries";

const DAY_LABELS = { mon: "Mandag", wed: "Onsdag", fri: "Fredag" };

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("da-DK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function WorkoutLog() {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllWorkouts()
      .then(setWorkouts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-5 pt-12 pb-10 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate("/")} className="text-slate-400 text-lg">
          ←
        </button>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
          Gennemførte træninger
        </h1>
      </div>

      {loading && <p className="text-slate-400">Indlæser…</p>}
      {error && <p className="text-red-500">Fejl: {error}</p>}

      {!loading && workouts.length === 0 && (
        <p className="text-slate-400">Ingen træninger endnu.</p>
      )}

      <div className="flex flex-col gap-2.5">
        {workouts.map((w) => (
          <button
            key={w.id}
            onClick={() => navigate(`/workouts/${w.id}`)}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 text-left flex items-center justify-between active:scale-[0.99] transition"
          >
            <div>
              <p className="text-lg font-semibold text-slate-800">
                {DAY_LABELS[w.day] ?? w.day}
              </p>
              <p className="text-sm text-slate-400">{formatDate(w.created_at)}</p>
            </div>
            <span className="text-slate-300">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificer at appen bygger**

```bash
cd /Users/jeppe/gymtracker && npx vite build 2>&1 | tail -5
```

Forventet: `✓ built in X.XXs` uden fejl.

- [ ] **Step 3: Commit**

```bash
cd /Users/jeppe/gymtracker && git add src/pages/WorkoutLog.jsx && git commit -m "feat: add WorkoutLog list page"
```

---

## Task 3: WorkoutLogEdit.jsx — redigerings-side

**Files:**
- Create: `src/pages/WorkoutLogEdit.jsx`

Data-flow:
- `data`: `{ [exerciseId]: { warmupWeight: "", sets: [{ weight: string, reps: string }] } }` — redigerbar state
- `originalData`: samme form, uændret kopi fra load — bruges til at detektere ændringer
- `setIds`: `{ [exerciseId]: number[] }` — set-IDs i samme rækkefølge som `data.sets`, read-only

- [ ] **Step 1: Opret `src/pages/WorkoutLogEdit.jsx`**

```jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchWorkoutById, fetchWorkoutSets, updateSet } from "../data/queries";
import ExerciseCard from "../components/ExerciseCard";
import Button from "../components/Button";

const DAY_LABELS = { mon: "Mandag", wed: "Onsdag", fri: "Fredag" };

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("da-DK", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function parseNum(v) {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export default function WorkoutLogEdit() {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const originalData = useRef({});
  const setIds = useRef({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [w, { exercises: exList, sets }] = await Promise.all([
          fetchWorkoutById(Number(workoutId)),
          fetchWorkoutSets(Number(workoutId)),
        ]);
        if (cancelled) return;

        const dataEntries = {};
        const idEntries = {};
        for (const ex of exList) {
          const exSets = sets[ex.id] ?? [];
          const setList = exSets.map((s) => ({
            weight: String(s.weight).replace(".", ","),
            reps: s.reps != null ? String(s.reps) : "",
          }));
          dataEntries[ex.id] = { warmupWeight: "", sets: setList };
          idEntries[ex.id] = exSets.map((s) => s.id);
        }

        originalData.current = JSON.parse(JSON.stringify(dataEntries));
        setIds.current = idEntries;
        setWorkout(w);
        setExercises(exList);
        setData(dataEntries);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [workoutId]);

  const update = (exId, next) => setData((d) => ({ ...d, [exId]: next }));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const updates = [];
      for (const ex of exercises) {
        const current = data[ex.id];
        const original = originalData.current[ex.id];
        const ids = setIds.current[ex.id] ?? [];
        current.sets.forEach((s, i) => {
          const orig = original?.sets[i];
          if (!orig) return;
          if (s.weight !== orig.weight || s.reps !== orig.reps) {
            updates.push(
              updateSet(ids[i], {
                reps: parseInt(s.reps, 10) || 0,
                weight: parseNum(s.weight),
              })
            );
          }
        });
      }
      await Promise.all(updates);
      originalData.current = JSON.parse(JSON.stringify(data));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 text-lg">
        Indlæser…
      </div>
    );
  }

  if (error && exercises.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-red-500 text-lg px-6 text-center">
        Fejl: {error}
      </div>
    );
  }

  return (
    <div className="min-h-full pb-12 max-w-md mx-auto">
      <div className="sticky top-0 z-10 bg-[#f4f4f7]/90 backdrop-blur px-5 pt-6 pb-4 flex items-center justify-between gap-3">
        <div>
          <button onClick={() => navigate("/workouts")} className="text-slate-400 text-lg mb-0.5">
            ← Træninger
          </button>
          {workout && (
            <p className="text-sm text-slate-500">
              {DAY_LABELS[workout.day] ?? workout.day} · {formatDate(workout.created_at)}
            </p>
          )}
        </div>
        <Button
          className="!w-auto px-5 !min-h-[48px] !text-base shrink-0"
          onClick={save}
          disabled={saving || saved}
        >
          {saved ? "Gemt ✓" : saving ? "Gemmer…" : "Gem ændringer"}
        </Button>
      </div>

      {error && <p className="text-red-500 px-5 mb-3">Fejl: {error}</p>}

      <div className="px-5 flex flex-col gap-5">
        {exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            value={data[ex.id]}
            onChange={(next) => update(ex.id, next)}
            progressedBy={null}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificer at appen bygger**

```bash
cd /Users/jeppe/gymtracker && npx vite build 2>&1 | tail -5
```

Forventet: `✓ built in X.XXs` uden fejl.

- [ ] **Step 3: Commit**

```bash
cd /Users/jeppe/gymtracker && git add src/pages/WorkoutLogEdit.jsx && git commit -m "feat: add WorkoutLogEdit page"
```

---

## Task 4: Ruter + knap

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/pages/Home.jsx`

- [ ] **Step 1: Tilføj ruter i `src/App.jsx`**

Erstat hele indholdet:

```jsx
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Workout from "./pages/Workout";
import History from "./pages/History";
import ExerciseHistory from "./pages/ExerciseHistory";
import WorkoutLog from "./pages/WorkoutLog";
import WorkoutLogEdit from "./pages/WorkoutLogEdit";

export default function App() {
  return (
    <div className="h-full">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/workout/:day" element={<Workout />} />
        <Route path="/history" element={<History />} />
        <Route path="/history/:exerciseId" element={<ExerciseHistory />} />
        <Route path="/workouts" element={<WorkoutLog />} />
        <Route path="/workouts/:workoutId" element={<WorkoutLogEdit />} />
      </Routes>
    </div>
  );
}
```

- [ ] **Step 2: Tilføj knap i `src/pages/Home.jsx`**

Erstat hele indholdet:

```jsx
import { useNavigate } from "react-router-dom";

const DAYS = [
  { key: "mon", label: "Mandag", sub: "Bænk · squat · ro" },
  { key: "wed", label: "Onsdag", sub: "Bænk · markløft · pull-ups" },
  { key: "fri", label: "Fredag", sub: "Press · ro · hip thrust" },
];

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="min-h-full px-5 pt-16 pb-10 max-w-md mx-auto flex flex-col">
      <p className="text-slate-400 font-medium mb-1">Lad os træne</p>
      <h1 className="text-4xl font-extrabold mb-10 bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
        Vælg dag
      </h1>

      <div className="flex flex-col gap-4">
        {DAYS.map((d) => (
          <button
            key={d.key}
            onClick={() => navigate(`/workout/${d.key}`)}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 text-left flex items-center justify-between active:scale-[0.99] transition"
          >
            <div>
              <p className="text-2xl font-bold text-slate-900">{d.label}</p>
              <p className="text-slate-400">{d.sub}</p>
            </div>
            <span className="w-11 h-11 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white flex items-center justify-center text-xl">
              →
            </span>
          </button>
        ))}
      </div>

      <button
        onClick={() => navigate("/workouts")}
        className="mt-6 text-indigo-500 font-semibold py-3"
      >
        Gennemførte træninger →
      </button>

      <button
        onClick={() => navigate("/history")}
        className="mt-2 text-indigo-500 font-semibold py-3"
      >
        Se historik →
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Kør alle tests**

```bash
cd /Users/jeppe/gymtracker && npx vitest run
```

Forventet: 31 tests PASS.

- [ ] **Step 4: Verificer at appen bygger**

```bash
cd /Users/jeppe/gymtracker && npx vite build 2>&1 | tail -5
```

Forventet: `✓ built in X.XXs` uden fejl.

- [ ] **Step 5: Commit**

```bash
cd /Users/jeppe/gymtracker && git add src/App.jsx src/pages/Home.jsx && git commit -m "feat: add routes and home button for workout log"
```
