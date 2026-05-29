import SetRow from "./SetRow";

const TYPE_LABEL = { compound: "Compound", isolation: "Isolation", plyo: "Plyo" };
const TYPE_STYLE = {
  compound: "bg-indigo-50 text-indigo-600",
  isolation: "bg-violet-50 text-violet-600",
  plyo: "bg-amber-50 text-amber-600",
};

// value shape (strength only):
//   { warmupWeight: string, sets: [{ weight: string, reps: string }, ...] }
export default function ExerciseCard({ exercise, value, onChange }) {
  const isPlyo = exercise.type === "plyo";

  const setWarmup = (w) => onChange({ ...value, warmupWeight: w });
  const setSetField = (i, field, v) =>
    onChange({
      ...value,
      sets: value.sets.map((s, j) => (j === i ? { ...s, [field]: v } : s)),
    });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-slate-900">{exercise.name}</h2>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${TYPE_STYLE[exercise.type]}`}
        >
          {TYPE_LABEL[exercise.type]}
        </span>
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
