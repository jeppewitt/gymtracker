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
// variants: øvelsen selv + de varianter den kan byttes ud med (fx romanian
// deadlift ↔ dødløft). Er der kun én, vises ingen vælger.
export default function ExerciseCard({
  exercise,
  value,
  onChange,
  progressedBy,
  variants = [],
  onSelectVariant,
}) {
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

      {variants.length > 1 && (
        <div className="flex gap-1.5 mb-4 p-1 rounded-2xl bg-slate-100">
          {variants.map((v) => (
            <button
              key={v.id}
              onClick={() => onSelectVariant?.(v.id)}
              className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                v.id === exercise.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              {v.name}
            </button>
          ))}
        </div>
      )}

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
