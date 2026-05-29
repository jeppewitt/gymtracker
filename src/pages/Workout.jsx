import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchExercisesForDay,
  fetchLastWorkSets,
  createWorkout,
  insertManySets,
} from "../data/queries";
import { suggestWeight } from "../lib/progression";
import ExerciseCard from "../components/ExerciseCard";
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
  const [data, setData] = useState({}); // exerciseId -> { warmupWeight, sets:[{weight,reps}] }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
            const s = suggestWeight(e, last);
            const w = s != null ? String(s).replace(".", ",") : "";
            return [
              e.id,
              {
                warmupWeight: w,
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
      navigate("/");
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
          />
        ))}
      </div>
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
