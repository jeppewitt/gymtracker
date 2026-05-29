# Gymtracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first training web app where the user picks a day (Mon/Wed/Fri), works through exercises one at a time, logs work-set reps, and gets auto-suggested next weights; with per-exercise weight-over-time history graphs.

**Architecture:** React + Vite SPA, mobile-first dark UI with Tailwind. Supabase (no auth, RLS off) stores `exercises` (seeded), `workouts`, and `sets`. Sets are saved progressively during a workout. A pure `suggestWeight` function holds the progression rules and is unit-tested in isolation. react-router-dom for the 3 screens; recharts for history.

**Tech Stack:** React 18, Vite, Tailwind CSS, @supabase/supabase-js, react-router-dom, recharts, Vitest.

---

## File Structure

- `index.html` — Vite entry.
- `src/main.jsx` — React root + router.
- `src/App.jsx` — route definitions.
- `src/index.css` — Tailwind directives + base dark theme.
- `src/lib/supabase.js` — Supabase client from env vars.
- `src/lib/progression.js` — pure `suggestWeight()` + `incrementFor()`. No I/O.
- `src/lib/progression.test.js` — Vitest unit tests for progression.
- `src/lib/format.js` — `formatKg()` Danish decimal formatting.
- `src/lib/format.test.js` — Vitest unit tests for formatting.
- `src/data/queries.js` — Supabase data access (fetch exercises, create workout, insert set, history queries).
- `src/pages/Home.jsx` — day selection + history link.
- `src/pages/Workout.jsx` — orchestrates a day's exercises, creates workout, saves sets.
- `src/pages/History.jsx` — exercise list grouped by day.
- `src/pages/ExerciseHistory.jsx` — line graph + session list for one exercise.
- `src/components/PlyoCard.jsx` — name + reminder + "Færdig" button.
- `src/components/StrengthCard.jsx` — weight display/input, warmup tap, two work sets.
- `src/components/RepInput.jsx` — +/− numeric rep entry.
- `src/components/Button.jsx` — shared large touch-target button.
- `supabase/schema.sql` — already created (tables + seed).
- `.env.example` — documents required env vars.

---

## Task 1: Scaffold Vite + React + Tailwind project

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/index.css`, `tailwind.config.js`, `postcss.config.js`, `.gitignore`, `.env.example`

- [ ] **Step 1: Scaffold and install**

Run from `/Users/jeppe/gymtracker`:
```bash
npm create vite@latest . -- --template react
npm install
npm install @supabase/supabase-js react-router-dom recharts
npm install -D tailwindcss@3 postcss autoprefixer vitest
npx tailwindcss init -p
```
Note: when `npm create vite` asks about the non-empty directory, choose "Ignore files and continue" so existing `docs/` and `supabase/` are preserved.

- [ ] **Step 2: Configure Tailwind content paths**

Replace `tailwind.config.js` with:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0b",
        surface: "#161618",
        accent: "#22c55e",
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 3: Set up base dark theme CSS**

Replace `src/index.css` with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root {
  height: 100%;
}
body {
  @apply bg-bg text-gray-100;
  -webkit-tap-highlight-color: transparent;
}
```

- [ ] **Step 4: Add test script**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run"
```

- [ ] **Step 5: Create `.env.example`**

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 6: Ensure `.gitignore` ignores env and node_modules**

Append to `.gitignore` if missing:
```
node_modules
dist
.env
```

- [ ] **Step 7: Verify dev server boots**

Run: `npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold vite react tailwind project"
```

---

## Task 2: Progression logic (pure, TDD)

**Files:**
- Create: `src/lib/progression.js`
- Test: `src/lib/progression.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/progression.test.js`:
```js
import { describe, it, expect } from "vitest";
import { incrementFor, suggestWeight } from "./progression";

describe("incrementFor", () => {
  it("compound is 2.5", () => {
    expect(incrementFor({ type: "compound", name: "Squats" })).toBe(2.5);
  });
  it("isolation is 1.25", () => {
    expect(incrementFor({ type: "isolation", name: "Leg curls" })).toBe(1.25);
  });
  it("pull-ups are 1.25 even though compound", () => {
    expect(incrementFor({ type: "compound", name: "Pull-ups" })).toBe(1.25);
  });
});

describe("suggestWeight", () => {
  const squats = { type: "compound", name: "Squats" };

  it("returns null when there is no history", () => {
    expect(suggestWeight(squats, [])).toBeNull();
    expect(suggestWeight(squats, null)).toBeNull();
  });

  it("adds increment when both work sets >= 8 reps", () => {
    const last = [{ reps: 8, weight: 60 }, { reps: 9, weight: 60 }];
    expect(suggestWeight(squats, last)).toBe(62.5);
  });

  it("holds weight when one set < 8 reps", () => {
    const last = [{ reps: 8, weight: 60 }, { reps: 7, weight: 60 }];
    expect(suggestWeight(squats, last)).toBe(60);
  });

  it("holds weight when both sets < 8 reps", () => {
    const last = [{ reps: 5, weight: 60 }, { reps: 6, weight: 60 }];
    expect(suggestWeight(squats, last)).toBe(60);
  });

  it("uses the work-set weight as the base (ignores warmups already filtered out)", () => {
    const last = [{ reps: 10, weight: 40 }, { reps: 10, weight: 40 }];
    const pullups = { type: "compound", name: "Pull-ups" };
    expect(suggestWeight(pullups, last)).toBe(41.25);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `progression.js` does not exist / exports undefined.

- [ ] **Step 3: Implement `progression.js`**

Create `src/lib/progression.js`:
```js
// Pure progression rules. No I/O.

export function incrementFor(exercise) {
  if (exercise.name === "Pull-ups") return 1.25;
  return exercise.type === "compound" ? 2.5 : 1.25;
}

// lastWorkSets: array of the two most recent work sets ({ reps, weight }) for
// this exercise, or empty/null when there is no history.
export function suggestWeight(exercise, lastWorkSets) {
  if (!lastWorkSets || lastWorkSets.length === 0) return null;
  const base = lastWorkSets[0].weight;
  const allHit = lastWorkSets.every((s) => s.reps >= 8);
  return allHit ? base + incrementFor(exercise) : base;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all progression tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/progression.js src/lib/progression.test.js
git commit -m "feat: add progression logic with tests"
```

---

## Task 3: Danish weight formatting (TDD)

**Files:**
- Create: `src/lib/format.js`
- Test: `src/lib/format.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/format.test.js`:
```js
import { describe, it, expect } from "vitest";
import { formatKg } from "./format";

describe("formatKg", () => {
  it("uses comma as decimal separator", () => {
    expect(formatKg(2.5)).toBe("2,5 kg");
  });
  it("drops trailing zeros for whole numbers", () => {
    expect(formatKg(60)).toBe("60 kg");
  });
  it("handles 1.25 increments", () => {
    expect(formatKg(41.25)).toBe("41,25 kg");
  });
  it("handles zero (bodyweight)", () => {
    expect(formatKg(0)).toBe("0 kg");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `format.js` missing.

- [ ] **Step 3: Implement `format.js`**

Create `src/lib/format.js`:
```js
export function formatKg(weight) {
  const n = Number(weight);
  const str = n
    .toLocaleString("da-DK", { maximumFractionDigits: 2 })
    .replace(/ /g, " ");
  return `${str} kg`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/format.js src/lib/format.test.js
git commit -m "feat: add Danish kg formatting with tests"
```

---

## Task 4: Supabase client

**Files:**
- Create: `src/lib/supabase.js`

- [ ] **Step 1: Implement the client**

Create `src/lib/supabase.js`:
```js
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Fail loud in dev so a missing .env is obvious.
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(url, anonKey);
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase.js
git commit -m "feat: add supabase client"
```

---

## Task 5: Data access layer

**Files:**
- Create: `src/data/queries.js`

- [ ] **Step 1: Implement queries**

Create `src/data/queries.js`:
```js
import { supabase } from "../lib/supabase";

// All strength exercises that have logged sets get history; plyo are excluded
// at the UI layer.

export async function fetchExercisesForDay(day) {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("day", day)
    .order("order_index", { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchAllExercises() {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .order("day", { ascending: true })
    .order("order_index", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createWorkout(day) {
  const { data, error } = await supabase
    .from("workouts")
    .insert({ day })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function insertSet({
  workoutId,
  exerciseId,
  setNumber,
  isWarmup,
  reps,
  weight,
}) {
  const { error } = await supabase.from("sets").insert({
    workout_id: workoutId,
    exercise_id: exerciseId,
    set_number: setNumber,
    is_warmup: isWarmup,
    reps,
    weight,
  });
  if (error) throw error;
}

// Returns the two work sets ([{reps, weight}]) from the most recent prior
// workout that logged this exercise, ordered by set_number. Empty if none.
export async function fetchLastWorkSets(exerciseId) {
  const { data, error } = await supabase
    .from("sets")
    .select("reps, weight, set_number, is_warmup, workout_id, created_at")
    .eq("exercise_id", exerciseId)
    .eq("is_warmup", false)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  if (!data || data.length === 0) return [];
  const latestWorkoutId = data[0].workout_id;
  return data
    .filter((s) => s.workout_id === latestWorkoutId)
    .sort((a, b) => a.set_number - b.set_number)
    .map((s) => ({ reps: s.reps, weight: Number(s.weight) }));
}

// History points: one entry per workout for an exercise, using the top work-set
// weight, ordered oldest-first for charting.
export async function fetchExerciseHistory(exerciseId) {
  const { data, error } = await supabase
    .from("sets")
    .select("reps, weight, set_number, is_warmup, workout_id, created_at")
    .eq("exercise_id", exerciseId)
    .eq("is_warmup", false)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const byWorkout = new Map();
  for (const s of data) {
    if (!byWorkout.has(s.workout_id)) {
      byWorkout.set(s.workout_id, {
        workoutId: s.workout_id,
        date: s.created_at,
        weight: Number(s.weight),
        sets: [],
      });
    }
    const entry = byWorkout.get(s.workout_id);
    entry.weight = Math.max(entry.weight, Number(s.weight));
    entry.sets.push({ setNumber: s.set_number, reps: s.reps });
  }
  return Array.from(byWorkout.values()).map((e) => ({
    ...e,
    sets: e.sets.sort((a, b) => a.setNumber - b.setNumber),
  }));
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/data/queries.js
git commit -m "feat: add supabase data access layer"
```

---

## Task 6: Shared Button + RepInput components

**Files:**
- Create: `src/components/Button.jsx`, `src/components/RepInput.jsx`

- [ ] **Step 1: Implement Button**

Create `src/components/Button.jsx`:
```jsx
export default function Button({ children, onClick, variant = "primary", className = "" }) {
  const base =
    "w-full min-h-[64px] rounded-2xl text-xl font-semibold flex items-center justify-center active:scale-[0.98] transition-transform";
  const variants = {
    primary: "bg-accent text-black",
    surface: "bg-surface text-gray-100",
  };
  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Implement RepInput**

Create `src/components/RepInput.jsx`:
```jsx
export default function RepInput({ value, onChange }) {
  const dec = () => onChange(Math.max(0, value - 1));
  const inc = () => onChange(value + 1);
  return (
    <div className="flex items-center justify-between gap-4">
      <button
        onClick={dec}
        className="w-20 h-20 rounded-2xl bg-surface text-4xl font-bold active:scale-95"
      >
        −
      </button>
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")) || 0)}
        className="w-24 text-center text-5xl font-bold bg-transparent outline-none"
      />
      <button
        onClick={inc}
        className="w-20 h-20 rounded-2xl bg-surface text-4xl font-bold active:scale-95"
      >
        +
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/Button.jsx src/components/RepInput.jsx
git commit -m "feat: add Button and RepInput components"
```

---

## Task 7: PlyoCard and StrengthCard

**Files:**
- Create: `src/components/PlyoCard.jsx`, `src/components/StrengthCard.jsx`

- [ ] **Step 1: Implement PlyoCard**

Create `src/components/PlyoCard.jsx`:
```jsx
import Button from "./Button";

export default function PlyoCard({ exercise, onDone }) {
  return (
    <div className="flex flex-col gap-8 h-full justify-center px-6">
      <div className="text-center">
        <p className="text-accent text-sm uppercase tracking-widest mb-2">Plyometrisk</p>
        <h1 className="text-4xl font-bold">{exercise.name}</h1>
        <p className="text-gray-400 mt-4 text-lg">Påmindelse — udfør sættene, ingen logning.</p>
      </div>
      <Button onClick={onDone}>Færdig</Button>
    </div>
  );
}
```

- [ ] **Step 2: Implement StrengthCard**

StrengthCard drives one strength exercise through phases: `weight` (confirm/enter weight) → `warmup` (one tap) → `work1` (reps) → `work2` (reps). It reports each completed set up via callbacks. The parent owns persistence.

Create `src/components/StrengthCard.jsx`:
```jsx
import { useState } from "react";
import Button from "./Button";
import RepInput from "./RepInput";
import { formatKg } from "../lib/format";

// props:
//   exercise        - { id, name, type }
//   suggestedWeight  - number | null (null => no history, user enters weight)
//   onWarmup(weight)        - logs warmup
//   onWorkSet(setNumber, reps, weight) - logs a work set
//   onComplete()            - advance to next exercise
export default function StrengthCard({
  exercise,
  suggestedWeight,
  onWarmup,
  onWorkSet,
  onComplete,
}) {
  const hasHistory = suggestedWeight !== null;
  const [phase, setPhase] = useState(hasHistory ? "weight" : "enterWeight");
  const [weight, setWeight] = useState(hasHistory ? suggestedWeight : 0);
  const [weightInput, setWeightInput] = useState("");
  const [reps, setReps] = useState(8);

  const confirmEnteredWeight = () => {
    const w = Number(weightInput.replace(",", "."));
    if (Number.isNaN(w)) return;
    setWeight(w);
    setPhase("weight");
  };

  const startWarmup = () => {
    onWarmup(weight);
    setPhase("work1");
  };

  const submitWork = (setNumber) => {
    onWorkSet(setNumber, reps, weight);
    if (setNumber === 1) {
      setReps(8);
      setPhase("work2");
    } else {
      onComplete();
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full justify-center px-6">
      <div className="text-center">
        <p className="text-accent text-sm uppercase tracking-widest mb-2">{exercise.type}</p>
        <h1 className="text-4xl font-bold">{exercise.name}</h1>
      </div>

      {phase === "enterWeight" && (
        <div className="flex flex-col gap-6">
          <p className="text-center text-gray-400 text-lg">Indtast startvægt (kg)</p>
          <input
            inputMode="decimal"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            placeholder="0"
            className="w-full text-center text-6xl font-bold bg-surface rounded-2xl py-6 outline-none"
          />
          <Button onClick={confirmEnteredWeight}>Bekræft vægt</Button>
        </div>
      )}

      {phase === "weight" && (
        <div className="flex flex-col gap-6">
          <p className="text-center text-gray-400 text-lg">Foreslået vægt</p>
          <p className="text-center text-7xl font-bold">{formatKg(weight)}</p>
          <Button onClick={startWarmup}>Warmup færdig</Button>
        </div>
      )}

      {(phase === "work1" || phase === "work2") && (
        <div className="flex flex-col gap-8">
          <p className="text-center text-gray-400 text-lg">
            Arbejdssæt {phase === "work1" ? 1 : 2} · {formatKg(weight)} · reps til failure
          </p>
          <RepInput value={reps} onChange={setReps} />
          <Button onClick={() => submitWork(phase === "work1" ? 1 : 2)}>
            Gem sæt {phase === "work1" ? 1 : 2}
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/PlyoCard.jsx src/components/StrengthCard.jsx
git commit -m "feat: add PlyoCard and StrengthCard"
```

---

## Task 8: Home page

**Files:**
- Create: `src/pages/Home.jsx`

- [ ] **Step 1: Implement Home**

Create `src/pages/Home.jsx`:
```jsx
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

const DAYS = [
  { key: "mon", label: "Mandag" },
  { key: "wed", label: "Onsdag" },
  { key: "fri", label: "Fredag" },
];

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-6 h-full justify-center px-6 max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-center mb-2">Vælg træningsdag</h1>
      {DAYS.map((d) => (
        <Button key={d.key} onClick={() => navigate(`/workout/${d.key}`)}>
          {d.label}
        </Button>
      ))}
      <Button variant="surface" className="mt-6" onClick={() => navigate("/history")}>
        Historik
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Home.jsx
git commit -m "feat: add Home page"
```

---

## Task 9: Workout page (orchestration + progressive save)

**Files:**
- Create: `src/pages/Workout.jsx`

- [ ] **Step 1: Implement Workout**

Create `src/pages/Workout.jsx`:
```jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchExercisesForDay,
  fetchLastWorkSets,
  createWorkout,
  insertSet,
} from "../data/queries";
import { suggestWeight } from "../lib/progression";
import PlyoCard from "../components/PlyoCard";
import StrengthCard from "../components/StrengthCard";
import Button from "../components/Button";

export default function Workout() {
  const { day } = useParams();
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [suggestions, setSuggestions] = useState({}); // exerciseId -> number|null
  const [workoutId, setWorkoutId] = useState(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchExercisesForDay(day);
        const strength = list.filter((e) => e.type !== "plyo");
        const entries = await Promise.all(
          strength.map(async (e) => {
            const last = await fetchLastWorkSets(e.id);
            return [e.id, suggestWeight(e, last)];
          })
        );
        const workout = await createWorkout(day);
        if (cancelled) return;
        setExercises(list);
        setSuggestions(Object.fromEntries(entries));
        setWorkoutId(workout.id);
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

  const advance = () => {
    if (index + 1 >= exercises.length) {
      navigate("/");
    } else {
      setIndex(index + 1);
    }
  };

  const logWarmup = async (exerciseId, weight) => {
    await insertSet({
      workoutId,
      exerciseId,
      setNumber: 0,
      isWarmup: true,
      reps: null,
      weight,
    });
  };

  const logWorkSet = async (exerciseId, setNumber, reps, weight) => {
    await insertSet({
      workoutId,
      exerciseId,
      setNumber,
      isWarmup: false,
      reps,
      weight,
    });
  };

  if (loading) return <Centered>Indlæser…</Centered>;
  if (error) return <Centered>Fejl: {error}</Centered>;
  if (exercises.length === 0) return <Centered>Ingen øvelser for dagen.</Centered>;

  const ex = exercises[index];
  const progress = `${index + 1} / ${exercises.length}`;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 text-gray-400">
        <button onClick={() => navigate("/")}>Afbryd</button>
        <span>{progress}</span>
      </div>
      <div className="flex-1">
        {ex.type === "plyo" ? (
          <PlyoCard exercise={ex} onDone={advance} />
        ) : (
          <StrengthCard
            key={ex.id}
            exercise={ex}
            suggestedWeight={suggestions[ex.id] ?? null}
            onWarmup={(weight) => logWarmup(ex.id, weight)}
            onWorkSet={(setNumber, reps, weight) =>
              logWorkSet(ex.id, setNumber, reps, weight)
            }
            onComplete={advance}
          />
        )}
      </div>
    </div>
  );
}

function Centered({ children }) {
  return (
    <div className="h-full flex items-center justify-center text-gray-300 text-lg px-6 text-center">
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Workout.jsx
git commit -m "feat: add Workout page with progressive save"
```

---

## Task 10: History list page

**Files:**
- Create: `src/pages/History.jsx`

- [ ] **Step 1: Implement History**

Create `src/pages/History.jsx`:
```jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllExercises } from "../data/queries";

const DAY_LABELS = { mon: "Mandag", wed: "Onsdag", fri: "Fredag" };

export default function History() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllExercises()
      .then((list) => setExercises(list.filter((e) => e.type !== "plyo")))
      .catch((e) => setError(e.message));
  }, []);

  const byDay = ["mon", "wed", "fri"].map((day) => ({
    day,
    items: exercises.filter((e) => e.day === day),
  }));

  return (
    <div className="px-6 py-4 max-w-md mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate("/")} className="text-gray-400">
          ← Tilbage
        </button>
        <h1 className="text-2xl font-bold">Historik</h1>
      </div>
      {error && <p className="text-red-400">Fejl: {error}</p>}
      {byDay.map(({ day, items }) => (
        <div key={day} className="mb-6">
          <h2 className="text-accent text-sm uppercase tracking-widest mb-2">
            {DAY_LABELS[day]}
          </h2>
          <div className="flex flex-col gap-2">
            {items.map((e) => (
              <button
                key={e.id}
                onClick={() => navigate(`/history/${e.id}`)}
                className="bg-surface rounded-xl px-4 py-4 text-left text-lg active:scale-[0.99]"
              >
                {e.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/pages/History.jsx
git commit -m "feat: add history list page"
```

---

## Task 11: Exercise history graph page

**Files:**
- Create: `src/pages/ExerciseHistory.jsx`

- [ ] **Step 1: Implement ExerciseHistory**

Create `src/pages/ExerciseHistory.jsx`:
```jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { fetchExerciseHistory, fetchAllExercises } from "../data/queries";
import { formatKg } from "../lib/format";

export default function ExerciseHistory() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const id = Number(exerciseId);
    Promise.all([fetchExerciseHistory(id), fetchAllExercises()])
      .then(([hist, all]) => {
        setHistory(hist);
        const found = all.find((e) => e.id === id);
        setName(found ? found.name : "Øvelse");
      })
      .catch((e) => setError(e.message));
  }, [exerciseId]);

  const chartData = history.map((h) => ({
    date: new Date(h.date).toLocaleDateString("da-DK", { day: "2-digit", month: "2-digit" }),
    weight: h.weight,
  }));

  return (
    <div className="px-6 py-4 max-w-md mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate("/history")} className="text-gray-400">
          ← Tilbage
        </button>
        <h1 className="text-2xl font-bold">{name}</h1>
      </div>
      {error && <p className="text-red-400">Fejl: {error}</p>}

      {chartData.length === 0 ? (
        <p className="text-gray-400">Ingen logget historik endnu.</p>
      ) : (
        <>
          <div className="h-56 mb-8 bg-surface rounded-2xl p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="#2a2a2e" />
                <XAxis dataKey="date" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} width={32} />
                <Tooltip
                  contentStyle={{ background: "#161618", border: "none", borderRadius: 8 }}
                  formatter={(v) => formatKg(v)}
                />
                <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-3">
            {[...history].reverse().map((h) => (
              <div key={h.workoutId} className="bg-surface rounded-xl px-4 py-3 flex justify-between">
                <span className="text-gray-300">
                  {new Date(h.date).toLocaleDateString("da-DK")}
                </span>
                <span>
                  {formatKg(h.weight)} ·{" "}
                  {h.sets.map((s) => s.reps).join(" / ")} reps
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/pages/ExerciseHistory.jsx
git commit -m "feat: add exercise history graph page"
```

---

## Task 12: Wire up router

**Files:**
- Modify: `src/App.jsx`, `src/main.jsx`

- [ ] **Step 1: Implement App routes**

Replace `src/App.jsx`:
```jsx
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Workout from "./pages/Workout";
import History from "./pages/History";
import ExerciseHistory from "./pages/ExerciseHistory";

export default function App() {
  return (
    <div className="h-full">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/workout/:day" element={<Workout />} />
        <Route path="/history" element={<History />} />
        <Route path="/history/:exerciseId" element={<ExerciseHistory />} />
      </Routes>
    </div>
  );
}
```

- [ ] **Step 2: Implement main.jsx with router**

Replace `src/main.jsx`:
```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 3: Verify build and tests**

Run: `npm run build && npm test`
Expected: build succeeds; all unit tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx src/main.jsx
git commit -m "feat: wire up router"
```

---

## Task 13: Manual verification

**Files:** none (verification only)

- [ ] **Step 1: Create `.env`**

Create `/Users/jeppe/gymtracker/.env` with the real Supabase URL and anon key (user provides). Confirm `supabase/schema.sql` has been run in the Supabase SQL Editor.

- [ ] **Step 2: Run the dev server**

Run: `npm run dev`
Open the printed localhost URL in a mobile viewport (browser devtools device mode).

- [ ] **Step 3: Walk the happy path**

- Home → tap Mandag.
- Box jumps (plyo) shows reminder + Færdig → tap.
- Smith incline bench: no history → enter a start weight → confirm → Warmup færdig → enter reps for set 1 → Gem → set 2 → Gem.
- Continue through all exercises → after Dips, returns to Home.
- Tap Historik → tap Smith incline bench → confirm a data point appears on the graph and a session row lists the reps.

Expected: each step advances with a single tap or single number entry; no console errors; data appears in Supabase `workouts`/`sets` tables.

- [ ] **Step 4: Verify progression on a second session**

Run a second Mandag workout. For an exercise where you logged both work sets ≥ 8 reps, confirm the suggested weight increased by the correct increment (compound +2,5 / isolation +1,25). For one logged < 8, confirm the weight held.

- [ ] **Step 5: Commit any fixes found during verification**

```bash
git add -A
git commit -m "fix: address issues found in manual verification"
```

---

## Self-Review Notes

- **Spec coverage:** day selection (T8), one-exercise-at-a-time flow (T9), plyo reminder no-log (T7/T9), suggested weight + warmup tap + two work sets (T7), progressive save (T9), progression rules incl. pull-ups special case (T2), end workout (T9), history list + graph (T10/T11), Danish decimals (T3), dark mobile UI (T1/T6/T7), schema + seed (supabase/schema.sql, done). All covered.
- **Pull-ups:** weight = added belt weight; 0 = bodyweight. Handled by treating weight as numeric and the 1.25 increment special-case in `incrementFor`.
- **Type consistency:** `insertSet`, `fetchLastWorkSets`, `suggestWeight(exercise, lastWorkSets)`, `formatKg` signatures consistent across tasks.
