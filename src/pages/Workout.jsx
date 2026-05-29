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
    try {
      await insertSet({
        workoutId,
        exerciseId,
        setNumber: 0,
        isWarmup: true,
        reps: null,
        weight,
      });
    } catch (e) {
      setError(e.message);
    }
  };

  const logWorkSet = async (exerciseId, setNumber, reps, weight) => {
    try {
      await insertSet({
        workoutId,
        exerciseId,
        setNumber,
        isWarmup: false,
        reps,
        weight,
      });
    } catch (e) {
      setError(e.message);
    }
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
