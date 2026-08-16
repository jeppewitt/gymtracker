const SIZES = {
  sm: { ring: "w-11 h-11", icon: "text-lg" },
  md: { ring: "w-[4.5rem] h-[4.5rem]", icon: "text-3xl" },
  lg: { ring: "w-32 h-32", icon: "text-6xl" },
};

// Cirkulær medalje i Apple Fitness-stil: gradient-skive med glans og
// hvid kant. Låste badges vises som en dæmpet grå skive med hængelås.
export default function AchievementBadge({ achievement, size = "md" }) {
  const { ring, icon } = SIZES[size] ?? SIZES.md;
  const unlocked = Boolean(achievement.unlockedAt);

  return (
    <div
      className={`${ring} relative rounded-full flex items-center justify-center shrink-0 ${
        unlocked
          ? `bg-gradient-to-br ${achievement.tint} shadow-lg shadow-slate-900/15`
          : "bg-gradient-to-br from-slate-200 to-slate-300"
      }`}
    >
      {/* Ydre hvid kant giver skiven dybde, som en præget medalje */}
      <span className="absolute inset-0 rounded-full ring-[3px] ring-inset ring-white/60" />
      {/* Glans i toppen */}
      <span className="absolute inset-x-1 top-1 h-1/2 rounded-full bg-gradient-to-b from-white/45 to-transparent" />
      <span
        className={`${icon} relative leading-none ${
          unlocked ? "drop-shadow-sm" : "opacity-40 grayscale"
        }`}
        aria-hidden="true"
      >
        {unlocked ? achievement.icon : "🔒"}
      </span>
    </div>
  );
}
