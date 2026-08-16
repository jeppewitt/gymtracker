const KEY = "gymtracker_achievements";

// Kategorier grupperer badges på achievements-siden (Apple Fitness-stil).
export const CATEGORIES = [
  { id: "milestone", label: "Milepæle" },
  { id: "strength", label: "Styrke" },
  { id: "progress", label: "Fremgang" },
  { id: "volume", label: "Volumen" },
  { id: "consistency", label: "Konsistens" },
  { id: "timing", label: "Tidspunkt" },
];

// tint = Tailwind gradient-klasser til badge-skiven. Skrives som hele literals,
// så Tailwind kan finde dem ved scanning.
export const ACHIEVEMENTS = [
  // --- Milepæle ---
  {
    id: "first_workout",
    title: "Første skridt",
    description: "Gennemfør din første træning",
    icon: "🥇",
    category: "milestone",
    tint: "from-amber-300 via-amber-400 to-orange-500",
  },
  {
    id: "workouts_10",
    title: "Ti på stribe",
    description: "10 træninger gennemført",
    icon: "🔟",
    category: "milestone",
    tint: "from-amber-300 via-orange-400 to-orange-600",
  },
  {
    id: "workouts_25",
    title: "Halvvejs til 50",
    description: "25 træninger gennemført",
    icon: "⭐",
    category: "milestone",
    tint: "from-yellow-300 via-amber-400 to-orange-500",
  },
  {
    id: "workouts_50",
    title: "Halvhundrede",
    description: "50 træninger gennemført",
    icon: "🏆",
    category: "milestone",
    tint: "from-yellow-200 via-amber-400 to-amber-600",
  },
  {
    id: "workouts_100",
    title: "Centurion",
    description: "100 træninger gennemført",
    icon: "💯",
    category: "milestone",
    tint: "from-orange-300 via-red-400 to-rose-600",
  },

  // --- Styrke ---
  {
    id: "weight_50",
    title: "Halvvejs til 100",
    description: "Løft mindst 50 kg i et sæt",
    icon: "🏋️",
    category: "strength",
    tint: "from-rose-300 via-rose-400 to-red-600",
  },
  {
    id: "weight_100",
    title: "Trecifret",
    description: "Løft mindst 100 kg i et sæt",
    icon: "💪",
    category: "strength",
    tint: "from-rose-400 via-red-500 to-red-700",
  },
  {
    id: "weight_140",
    title: "Tungt skyts",
    description: "Løft mindst 140 kg i et sæt",
    icon: "🦍",
    category: "strength",
    tint: "from-red-500 via-rose-600 to-slate-800",
  },

  // --- Fremgang ---
  {
    id: "first_progress",
    title: "På vej op",
    description: "Stig i vægt for første gang",
    icon: "📈",
    category: "progress",
    tint: "from-emerald-300 via-emerald-400 to-teal-600",
  },
  {
    id: "progress_streak_3",
    title: "Momentum",
    description: "Stig i vægt 3 sessioner i træk på samme øvelse",
    icon: "🔥",
    category: "progress",
    tint: "from-lime-300 via-emerald-400 to-emerald-600",
  },
  {
    id: "progress_streak_5",
    title: "Uimodståelig",
    description: "Stig i vægt 5 sessioner i træk på samme øvelse",
    icon: "🚀",
    category: "progress",
    tint: "from-emerald-400 via-teal-500 to-cyan-600",
  },

  // --- Volumen ---
  {
    id: "volume_2000",
    title: "To ton",
    description: "Løft 2.000 kg samlet i én træning",
    icon: "🧱",
    category: "volume",
    tint: "from-indigo-300 via-indigo-400 to-violet-600",
  },
  {
    id: "volume_5000",
    title: "Fem ton",
    description: "Løft 5.000 kg samlet i én træning",
    icon: "🏔️",
    category: "volume",
    tint: "from-violet-400 via-purple-500 to-indigo-700",
  },
  {
    id: "total_volume_50000",
    title: "Halvtreds ton",
    description: "Løft 50.000 kg i alt",
    icon: "🌍",
    category: "volume",
    tint: "from-sky-300 via-indigo-400 to-violet-600",
  },
  {
    id: "total_volume_100000",
    title: "Hundrede ton",
    description: "Løft 100.000 kg i alt",
    icon: "🪐",
    category: "volume",
    tint: "from-violet-500 via-purple-600 to-slate-900",
  },

  // --- Konsistens ---
  {
    id: "perfect_week",
    title: "Perfekt uge",
    description: "Tag mandag, onsdag og fredag i samme uge",
    icon: "📅",
    category: "consistency",
    tint: "from-sky-300 via-sky-400 to-blue-600",
  },
  {
    id: "perfect_weeks_4",
    title: "Måned i rytme",
    description: "Fuldfør 4 perfekte uger",
    icon: "🗓️",
    category: "consistency",
    tint: "from-cyan-300 via-sky-500 to-blue-700",
  },

  // --- Tidspunkt ---
  {
    id: "early_bird",
    title: "Morgenfugl",
    description: "Træn før kl. 7",
    icon: "🌅",
    category: "timing",
    tint: "from-orange-200 via-pink-400 to-fuchsia-600",
  },
  {
    id: "night_owl",
    title: "Natteravn",
    description: "Træn efter kl. 21",
    icon: "🌙",
    category: "timing",
    tint: "from-fuchsia-400 via-purple-600 to-indigo-900",
  },
];

const PERFECT_WEEK_DAYS = ["mon", "wed", "fri"];
const MAX_STREAK = 5;

function emptyState() {
  return {
    unlocked: {},
    progressStreaks: {},
    totalVolume: 0,
    week: null, // { key, days: [], counted: bool }
    perfectWeeks: 0,
  };
}

export function loadAchievements() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    // Spread ovenpå defaults, så state gemt af en ældre version stadig virker.
    return { ...emptyState(), ...JSON.parse(raw) };
  } catch {
    return emptyState();
  }
}

export function saveAchievements(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // localStorage fuld eller utilgængelig — ignorér stille
  }
}

// ISO 8601-ugenøgle, fx "2026-W24". Uger går mandag–søndag, og uge 1 er den
// uge der indeholder årets første torsdag.
export function isoWeekKey(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // Flyt til ugens torsdag; den bestemmer både årstal og ugenummer.
  const dayIdx = (d.getDay() + 6) % 7; // mandag = 0
  d.setDate(d.getDate() - dayIdx + 3);
  const isoYear = d.getFullYear();
  const firstThursday = new Date(isoYear, 0, 4);
  const firstIdx = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstIdx + 3);
  const week = 1 + Math.round((d - firstThursday) / (7 * 24 * 60 * 60 * 1000));
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

// sessionData: {
//   progressed: [{ exerciseId }],   — øvelser der steg i vægt denne session
//   notProgressed: [exerciseId],     — øvelser der IKKE steg i vægt
//   maxWeight: number,               — højeste vægt logget i sessionen (kg)
//   volume?: number,                 — samlet løftet vægt i sessionen (reps × kg)
//   day?: "mon" | "wed" | "fri",     — hvilken træningsdag
//   date?: Date,                     — hvornår sessionen blev afsluttet
// }
// workoutCount: number (totalt antal workouts inkl. denne)
// Returns: array af nyligt unlockede achievement-objekter
export function checkAchievements(sessionData, workoutCount) {
  const state = loadAchievements();
  const newlyUnlocked = [];
  const volume = sessionData.volume ?? 0;
  const day = sessionData.day ?? null;
  const date = sessionData.date ?? new Date();

  function unlock(id) {
    if (!state.unlocked[id]) {
      state.unlocked[id] = new Date().toISOString();
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      if (def) newlyUnlocked.push(def);
    }
  }

  // --- Milepæle ---
  if (workoutCount >= 1) unlock("first_workout");
  if (workoutCount >= 10) unlock("workouts_10");
  if (workoutCount >= 25) unlock("workouts_25");
  if (workoutCount >= 50) unlock("workouts_50");
  if (workoutCount >= 100) unlock("workouts_100");

  // --- Fremgang ---
  if (sessionData.progressed.length > 0) {
    unlock("first_progress");
    for (const { exerciseId } of sessionData.progressed) {
      const next = (state.progressStreaks[exerciseId] || 0) + 1;
      state.progressStreaks[exerciseId] = Math.min(next, MAX_STREAK);
      if (state.progressStreaks[exerciseId] >= 3) unlock("progress_streak_3");
      if (state.progressStreaks[exerciseId] >= 5) unlock("progress_streak_5");
    }
  }

  for (const exerciseId of sessionData.notProgressed) {
    if (!sessionData.progressed.some((p) => p.exerciseId === exerciseId)) {
      state.progressStreaks[exerciseId] = 0;
    }
  }

  // --- Styrke ---
  if (sessionData.maxWeight >= 50) unlock("weight_50");
  if (sessionData.maxWeight >= 100) unlock("weight_100");
  if (sessionData.maxWeight >= 140) unlock("weight_140");

  // --- Volumen ---
  if (volume >= 2000) unlock("volume_2000");
  if (volume >= 5000) unlock("volume_5000");
  state.totalVolume += volume;
  if (state.totalVolume >= 50000) unlock("total_volume_50000");
  if (state.totalVolume >= 100000) unlock("total_volume_100000");

  // --- Konsistens: perfekt uge ---
  if (day) {
    const key = isoWeekKey(date);
    if (!state.week || state.week.key !== key) {
      state.week = { key, days: [], counted: false };
    }
    if (!state.week.days.includes(day)) state.week.days.push(day);
    const complete = PERFECT_WEEK_DAYS.every((d) => state.week.days.includes(d));
    if (complete && !state.week.counted) {
      state.week.counted = true;
      state.perfectWeeks += 1;
      unlock("perfect_week");
      if (state.perfectWeeks >= 4) unlock("perfect_weeks_4");
    }
  }

  // --- Tidspunkt ---
  const hour = date.getHours();
  if (hour < 7) unlock("early_bird");
  if (hour >= 21) unlock("night_owl");

  saveAchievements(state);
  return newlyUnlocked;
}

// Alle achievements i fast rækkefølge, beriget med hvornår de blev låst op
// (ISO-streng) eller null hvis de stadig er låst.
export function getAchievementList() {
  const { unlocked } = loadAchievements();
  return ACHIEVEMENTS.map((a) => ({ ...a, unlockedAt: unlocked[a.id] ?? null }));
}
