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
