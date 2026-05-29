export default function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled = false,
}) {
  const base =
    "w-full min-h-[60px] rounded-2xl text-lg font-semibold flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100";
  const variants = {
    primary:
      "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-200",
    outline: "bg-white text-slate-700 border border-slate-200 shadow-sm",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
