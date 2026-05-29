function NumberField({ value, onChange, decimal = false }) {
  return (
    <input
      inputMode={decimal ? "decimal" : "numeric"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="0"
      className="w-16 text-center text-lg font-bold text-slate-900 bg-white rounded-xl border border-slate-200 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
    />
  );
}

// A single editable set line: weight (always) × reps (work sets only).
export default function SetRow({ label, weight, reps, showReps, onWeight, onReps }) {
  return (
    <div className="flex items-center gap-2.5 bg-slate-50 rounded-2xl px-4 py-3">
      <span className="text-slate-500 font-bold text-sm w-16 shrink-0">{label}</span>
      <NumberField value={weight} onChange={onWeight} decimal />
      <span className="text-slate-400 text-sm">kg</span>
      {showReps ? (
        <>
          <span className="text-slate-300 font-bold">×</span>
          <NumberField value={reps} onChange={onReps} />
          <span className="text-slate-400 text-sm">reps</span>
        </>
      ) : (
        <span className="text-slate-400 text-sm">opvarmning</span>
      )}
    </div>
  );
}
