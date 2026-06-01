const KEY = "gymtracker_achievements";

export const ACHIEVEMENTS = [
  { id: "first_workout", title: "Første skridt", description: "Gennemfør din første træning" },
  { id: "workouts_10", title: "10 i træk", description: "10 træninger gennemført" },
  { id: "workouts_25", title: "Halvvejs til 50", description: "25 træninger gennemført" },
  { id: "first_progress", title: "På vej op", description: "Første gang du stiger i vægt" },
  { id: "progress_streak_3", title: "Momentum", description: "Steg i vægt 3 sessioner i streg på samme øvelse" },
  { id: "weight_50", title: "Halvvejs til 100", description: "Løftede ≥ 50 kg i et sæt" },
  { id: "weight_100", title: "Trecifret", description: "Løftede ≥ 100 kg i et sæt" },
];

export function loadAchievements() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { unlocked: {}, progressStreaks: {} };
    return JSON.parse(raw);
  } catch {
    return { unlocked: {}, progressStreaks: {} };
  }
}

export function saveAchievements(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // localStorage fuld eller utilgængelig — ignorér stille
  }
}

// sessionData: {
//   progressed: [{ exerciseId }],   — øvelser der steg i vægt denne session
//   notProgressed: [exerciseId],     — øvelser der IKKE steg i vægt
//   maxWeight: number,               — højeste vægt logget i sessionen (kg)
// }
// workoutCount: number (totalt antal workouts inkl. denne)
// Returns: array af nyligt unlockede achievement-objekter
export function checkAchievements(sessionData, workoutCount) {
  const state = loadAchievements();
  const newlyUnlocked = [];

  function unlock(id) {
    if (!state.unlocked[id]) {
      state.unlocked[id] = new Date().toISOString();
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      if (def) newlyUnlocked.push(def);
    }
  }

  if (workoutCount >= 1) unlock("first_workout");
  if (workoutCount >= 10) unlock("workouts_10");
  if (workoutCount >= 25) unlock("workouts_25");

  if (sessionData.progressed.length > 0) {
    unlock("first_progress");
    for (const { exerciseId } of sessionData.progressed) {
      state.progressStreaks[exerciseId] = (state.progressStreaks[exerciseId] || 0) + 1;
      // Cap streak ved 3
      if (state.progressStreaks[exerciseId] > 3) {
        state.progressStreaks[exerciseId] = 3;
      }
      if (state.progressStreaks[exerciseId] >= 3) unlock("progress_streak_3");
    }
  }

  for (const exerciseId of sessionData.notProgressed) {
    if (!sessionData.progressed.some((p) => p.exerciseId === exerciseId)) {
      state.progressStreaks[exerciseId] = 0;
    }
  }

  if (sessionData.maxWeight >= 50) unlock("weight_50");
  if (sessionData.maxWeight >= 100) unlock("weight_100");

  saveAchievements(state);
  return newlyUnlocked;
}
