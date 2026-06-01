import { describe, it, expect } from "vitest";
import { incrementFor, suggestWeight, warmupWeight } from "./progression";

describe("incrementFor", () => {
  it("compound is 2.5", () => {
    expect(incrementFor({ type: "compound", name: "Squats" })).toBe(2.5);
  });
  it("isolation is 1.25", () => {
    expect(incrementFor({ type: "isolation", name: "Leg curls" })).toBe(1.25);
  });
  it("pull-ups are 1.25 even though compound", () => {
    expect(incrementFor({ type: "compound", name: "Pull-ups" })).toBe(1.25);
  });
  it("DB exercises are 2", () => {
    expect(incrementFor({ type: "compound", name: "DB bench press" })).toBe(2);
    expect(incrementFor({ type: "isolation", name: "Incline DB curls" })).toBe(2);
  });
  it("Lateral raises are 2", () => {
    expect(incrementFor({ type: "isolation", name: "Lateral raises" })).toBe(2);
  });
});

describe("suggestWeight", () => {
  const squats = { type: "compound", name: "Squats" };

  it("returns null when there is no history", () => {
    expect(suggestWeight(squats, [])).toBeNull();
    expect(suggestWeight(squats, null)).toBeNull();
  });

  it("adds increment when both work sets >= 8 reps", () => {
    const last = [{ reps: 8, weight: 60 }, { reps: 9, weight: 60 }];
    expect(suggestWeight(squats, last)).toBe(62.5);
  });

  it("holds weight when one set < 8 reps", () => {
    const last = [{ reps: 8, weight: 60 }, { reps: 7, weight: 60 }];
    expect(suggestWeight(squats, last)).toBe(60);
  });

  it("holds weight when both sets < 8 reps", () => {
    const last = [{ reps: 5, weight: 60 }, { reps: 6, weight: 60 }];
    expect(suggestWeight(squats, last)).toBe(60);
  });

  it("uses the work-set weight as the base for pull-ups", () => {
    const last = [{ reps: 10, weight: 40 }, { reps: 10, weight: 40 }];
    const pullups = { type: "compound", name: "Pull-ups" };
    expect(suggestWeight(pullups, last)).toBe(41.25);
  });
});

describe("warmupWeight", () => {
  it("is null when there is no working weight", () => {
    expect(warmupWeight(null)).toBeNull();
  });

  it("is ~50% of the working weight, rounded to nearest 2.5 kg", () => {
    expect(warmupWeight(100)).toBe(50);
    expect(warmupWeight(60)).toBe(30);
    expect(warmupWeight(50)).toBe(25);
  });

  it("rounds to the nearest 2.5 kg increment", () => {
    // 80 * 0.5 = 40 -> 40
    expect(warmupWeight(80)).toBe(40);
    // 45 * 0.5 = 22.5 -> 22.5
    expect(warmupWeight(45)).toBe(22.5);
  });

  it("stays at 0 for bodyweight-only (e.g. pull-ups with no added weight)", () => {
    expect(warmupWeight(0)).toBe(0);
  });
});
