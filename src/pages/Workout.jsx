import { useEffect, useRef, useState } from "react";
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
import { loadDraft, saveDraft, clearDraft } from "../lib/workoutDraft";
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
  const [restored, setRestored] = useState(false); // kladde blev genskabt
  const [confirmCancel, setConfirmCancel] = useState(false);

  // Kladden skal kunne gemmes fra event-handlers uden for React-renderen
  // (fx når fanen lukkes), så vi holder den seneste state i en ref.
  const draftRef = useRef(null);
  draftRef.current = { day, exercises, data, lastWeights, progressedBy: progressedByMap };

  useEffect(() => {
    let cancelled = false;
    // Har vi en kladde fra en afbrudt træning, viser vi den med det samme —
    // uden at vente på netværket, som måske slet ikke svarer i kælderen.
    const draft = loadDraft(day);
    if (draft) {
      setExercises(draft.exercises);
      setData(draft.data);
      setLastWeights(draft.lastWeights ?? {});
      setProgressedByMap(draft.progressedBy ?? {});
      setLoading(false);
      setRestored(true);
    }
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
                  { weight: w, reps: "" },
                  { weight: w, reps: "" },
                ],
              },
            ];
          })
        );
        if (cancelled) return;
        setExercises(list);
        // Kladdens indtastninger vinder over de nyberegnede forslag; øvelser
        // der er kommet til siden kladden blev gemt, får forslagene.
        setData((prev) =>
          draft ? { ...Object.fromEntries(entries), ...prev } : Object.fromEntries(entries)
        );
        setLastWeights(lastWeightsAcc);
        setProgressedByMap(progressedAcc);
      } catch (e) {
        // Fejler netværket, men har vi en kladde, kan træningen fortsætte.
        if (!cancelled && !draft) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [day]);

  // Autogem kladden mens der tastes. Debounce, så vi ikke skriver til
  // localStorage ved hvert tastetryk.
  useEffect(() => {
    if (loading || summary || exercises.length === 0) return;
    const t = setTimeout(() => saveDraft(draftRef.current), 400);
    return () => clearTimeout(t);
  }, [data, exercises, loading, summary]);

  // Når mobilen sender appen i baggrunden, kan fanen blive smidt ud uden
  // varsel — så skal det seneste også være gemt, ikke kun det debouncede.
  useEffect(() => {
    if (loading || summary) return;
    const flush = () => {
      if (draftRef.current?.exercises?.length > 0) saveDraft(draftRef.current);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [loading, summary]);

  const update = (exId, next) => setData((d) => ({ ...d, [exId]: next }));

  const cancel = () => {
    if (!confirmCancel) {
      setConfirmCancel(true);
      return;
    }
    clearDraft();
    navigate("/");
  };

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
      // Træningen ligger i databasen nu — kladden har gjort sit.
      clearDraft();

      // Achievement-tjek
      const strengthExs = exercises.filter((e) => e.type !== "plyo");
      const progressed = [];
      const notProgressed = [];
      let maxWeight = 0;
      let volume = 0;
      for (const ex of strengthExs) {
        const d = data[ex.id];
        const loggedMax = d && d.sets.length > 0
          ? Math.max(...d.sets.map((s) => parseNum(s.weight)))
          : 0;
        maxWeight = Math.max(maxWeight, loggedMax);
        // Volumen = reps × vægt, kun arbejdssæt (opvarmning tæller ikke med).
        for (const s of d?.sets ?? []) {
          volume += (parseInt(s.reps, 10) || 0) * parseNum(s.weight);
        }
        if (loggedMax > (lastWeights[ex.id] ?? 0)) {
          progressed.push({ exerciseId: ex.id });
        } else {
          notProgressed.push(ex.id);
        }
      }
      const workoutCount = await fetchWorkoutCount();
      const newAchievements = checkAchievements(
        { progressed, notProgressed, maxWeight, volume, day, date: new Date() },
        workoutCount
      );

      setSaving(false);
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
            onClick={cancel}
          >
            {confirmCancel ? "Slet træning?" : "✕ Annuller"}
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

      {restored && (
        <p className="mx-5 mb-3 rounded-2xl bg-indigo-50 text-indigo-600 text-sm font-medium px-4 py-3">
          Vi fortsatte din igangværende træning — intet gik tabt.
        </p>
      )}

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
