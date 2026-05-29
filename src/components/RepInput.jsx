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
