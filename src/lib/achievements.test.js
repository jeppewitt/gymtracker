import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  loadAchievements,
  saveAchievements,
  checkAchievements,
  ACHIEVEMENTS,
} from "./achievements";

const emptyState = () => ({ unlocked: {}, progressStreaks: {} });

beforeEach(() => {
  localStorage.clear();
});

describe("loadAchievements", () => {
  it("returnerer tomt state når localStorage er tom", () => {
    expect(loadAchievements()).toEqual({ unlocked: {}, progressStreaks: {} });
  });

  it("returnerer gemt state", () => {
    const state = { unlocked: { first_workout: "2026-01-01" }, progressStreaks: {} };
    localStorage.setItem("gymtracker_achievements", JSON.stringify(state));
    expect(loadAchievements()).toEqual(state);
  });

  it("returnerer tomt state ved korrupt JSON", () => {
    localStorage.setItem("gymtracker_achievements", "ikke-json");
    expect(loadAchievements()).toEqual({ unlocked: {}, progressStreaks: {} });
  });
});

describe("checkAchievements", () => {
  const noProgress = { progressed: [], notProgressed: ["ex1"], maxWeight: 0 };

  it("låser first_workout op ved 1 workout", () => {
    const result = checkAchievements(noProgress, 1);
    expect(result.map((a) => a.id)).toContain("first_workout");
  });

  it("låser workouts_10 op ved 10 workouts", () => {
    const result = checkAchievements(noProgress, 10);
    expect(result.map((a) => a.id)).toContain("workouts_10");
  });

  it("låser workouts_25 op ved 25 workouts", () => {
    const result = checkAchievements(noProgress, 25);
    expect(result.map((a) => a.id)).toContain("workouts_25");
  });

  it("låser first_progress op ved første vægtfremgang", () => {
    const session = { progressed: [{ exerciseId: "ex1" }], notProgressed: [], maxWeight: 60 };
    const result = checkAchievements(session, 1);
    expect(result.map((a) => a.id)).toContain("first_progress");
  });

  it("låser weight_50 op ved maxWeight >= 50", () => {
    const session = { progressed: [], notProgressed: [], maxWeight: 50 };
    const result = checkAchievements(session, 1);
    expect(result.map((a) => a.id)).toContain("weight_50");
  });

  it("låser weight_100 op ved maxWeight >= 100", () => {
    const session = { progressed: [], notProgressed: [], maxWeight: 100 };
    const result = checkAchievements(session, 1);
    expect(result.map((a) => a.id)).toContain("weight_100");
  });

  it("låser progress_streak_3 op ved 3 sessioners streak", () => {
    // 2 tidligere sessioner med fremgang på ex1
    saveAchievements({ unlocked: {}, progressStreaks: { ex1: 2 } });
    const session = { progressed: [{ exerciseId: "ex1" }], notProgressed: [], maxWeight: 60 };
    const result = checkAchievements(session, 3);
    expect(result.map((a) => a.id)).toContain("progress_streak_3");
  });

  it("resetter streak for øvelse uden fremgang", () => {
    saveAchievements({ unlocked: {}, progressStreaks: { ex1: 2 } });
    const session = { progressed: [], notProgressed: ["ex1"], maxWeight: 60 };
    checkAchievements(session, 1);
    expect(loadAchievements().progressStreaks.ex1).toBe(0);
  });

  it("returnerer ikke allerede unlockede achievements igen", () => {
    saveAchievements({ unlocked: { first_workout: "2026-01-01" }, progressStreaks: {} });
    const result = checkAchievements(noProgress, 1);
    expect(result.map((a) => a.id)).not.toContain("first_workout");
  });

  it("gemmer state i localStorage", () => {
    checkAchievements(noProgress, 1);
    const state = loadAchievements();
    expect(state.unlocked.first_workout).toBeDefined();
  });
});
