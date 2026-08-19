import { describe, it, expect, beforeEach } from "vitest";
import {
  loadDraft,
  loadAnyDraft,
  saveDraft,
  clearDraft,
  draftHasInput,
  DRAFT_MAX_AGE_MS,
} from "./workoutDraft";

const draft = {
  day: "mon",
  exercises: [{ id: 1, name: "Bænkpres", type: "compound" }],
  data: { 1: { warmupWeight: "40", sets: [{ weight: "60", reps: "8" }] } },
  lastWeights: { 1: 57.5 },
  progressedBy: { 1: 2.5 },
};

beforeEach(() => {
  localStorage.clear();
});

describe("workoutDraft", () => {
  it("gemmer og genskaber en kladde for samme dag", () => {
    saveDraft(draft, 1000);
    const loaded = loadDraft("mon", 2000);
    expect(loaded.data).toEqual(draft.data);
    expect(loaded.lastWeights).toEqual(draft.lastWeights);
    expect(loaded.updatedAt).toBe(1000);
  });

  it("returnerer null for en anden dag", () => {
    saveDraft(draft, 1000);
    expect(loadDraft("fri", 2000)).toBeNull();
  });

  it("returnerer null når der ingen kladde er", () => {
    expect(loadAnyDraft()).toBeNull();
  });

  it("kasserer en kladde der er ældre end maksalderen", () => {
    saveDraft(draft, 0);
    expect(loadAnyDraft(DRAFT_MAX_AGE_MS + 1)).toBeNull();
    expect(localStorage.getItem("gymtracker_workout_draft_v1")).toBeNull();
  });

  it("beholder en kladde lige under maksalderen", () => {
    saveDraft(draft, 0);
    expect(loadAnyDraft(DRAFT_MAX_AGE_MS - 1)).not.toBeNull();
  });

  it("returnerer null ved ulæseligt indhold", () => {
    localStorage.setItem("gymtracker_workout_draft_v1", "ikke-json");
    expect(loadAnyDraft()).toBeNull();
  });

  it("clearDraft fjerner kladden", () => {
    saveDraft(draft, 1000);
    clearDraft();
    expect(loadAnyDraft(1000)).toBeNull();
  });

  it("draftHasInput er falsk når kun forslagene står der", () => {
    const untouched = {
      ...draft,
      data: { 1: { warmupWeight: "40", sets: [{ weight: "60", reps: "" }] } },
    };
    expect(draftHasInput(untouched)).toBe(false);
    expect(draftHasInput(draft)).toBe(true);
    expect(draftHasInput(null)).toBe(false);
  });
});
