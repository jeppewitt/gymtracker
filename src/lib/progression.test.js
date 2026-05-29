import { describe, it, expect } from "vitest";
import { incrementFor, suggestWeight } from "./progression";

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
