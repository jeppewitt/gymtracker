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
          <button onClick={() => navigate("/workouts")} className="text-slate-400 text-lg mb-0.5 block">
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
