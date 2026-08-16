import { describe, it, expect, beforeEach } from "vitest";
import {
  loadAchievements,
  saveAchievements,
  checkAchievements,
  getAchievementList,
  isoWeekKey,
  ACHIEVEMENTS,
} from "./achievements";

beforeEach(() => {
  localStorage.clear();
});

// Hjælper: session uden fremgang, uden volumen, midt på dagen.
const session = (over = {}) => ({
  progressed: [],
  notProgressed: [],
  maxWeight: 0,
  volume: 0,
  day: null,
  date: new Date("2026-06-10T12:00:00"),
  ...over,
});

const idsOf = (result) => result.map((a) => a.id);

describe("ACHIEVEMENTS", () => {
  it("har unikke id'er", () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("har titel, beskrivelse, ikon, kategori og tint på alle", () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.title, a.id).toBeTruthy();
      expect(a.description, a.id).toBeTruthy();
      expect(a.icon, a.id).toBeTruthy();
      expect(a.category, a.id).toBeTruthy();
      expect(a.tint, a.id).toBeTruthy();
    }
  });
});

describe("loadAchievements", () => {
  it("returnerer tomt state når localStorage er tom", () => {
    expect(loadAchievements()).toEqual({
      unlocked: {},
      progressStreaks: {},
      totalVolume: 0,
      week: null,
      perfectWeeks: 0,
    });
  });

  it("returnerer gemt state", () => {
    const state = {
      unlocked: { first_workout: "2026-01-01" },
      progressStreaks: {},
      totalVolume: 1200,
      week: null,
      perfectWeeks: 0,
    };
    localStorage.setItem("gymtracker_achievements", JSON.stringify(state));
    expect(loadAchievements()).toEqual(state);
  });

  it("udfylder manglende felter i ældre gemt state", () => {
    localStorage.setItem(
      "gymtracker_achievements",
      JSON.stringify({ unlocked: { first_workout: "2026-01-01" }, progressStreaks: { ex1: 2 } })
    );
    const state = loadAchievements();
    expect(state.totalVolume).toBe(0);
    expect(state.week).toBeNull();
    expect(state.perfectWeeks).toBe(0);
    expect(state.progressStreaks.ex1).toBe(2);
  });

  it("returnerer tomt state ved korrupt JSON", () => {
    localStorage.setItem("gymtracker_achievements", "ikke-json");
    expect(loadAchievements().unlocked).toEqual({});
  });
});

describe("isoWeekKey", () => {
  it("giver samme nøgle for mandag og søndag i samme ISO-uge", () => {
    expect(isoWeekKey(new Date("2026-06-08T10:00:00"))).toBe(
      isoWeekKey(new Date("2026-06-14T10:00:00"))
    );
  });

  it("giver forskellig nøgle for tilstødende uger", () => {
    expect(isoWeekKey(new Date("2026-06-14T10:00:00"))).not.toBe(
      isoWeekKey(new Date("2026-06-15T10:00:00"))
    );
  });
});

describe("checkAchievements — milepæle", () => {
  it.each([
    [1, "first_workout"],
    [10, "workouts_10"],
    [25, "workouts_25"],
    [50, "workouts_50"],
    [100, "workouts_100"],
  ])("låser %s træninger op som %s", (count, id) => {
    expect(idsOf(checkAchievements(session(), count))).toContain(id);
  });
});

describe("checkAchievements — styrke", () => {
  it.each([
    [50, "weight_50"],
    [100, "weight_100"],
    [140, "weight_140"],
  ])("låser op ved maxWeight %s", (maxWeight, id) => {
    expect(idsOf(checkAchievements(session({ maxWeight }), 1))).toContain(id);
  });

  it("låser ikke weight_100 op ved 99 kg", () => {
    expect(idsOf(checkAchievements(session({ maxWeight: 99 }), 1))).not.toContain("weight_100");
  });
});

describe("checkAchievements — fremgang", () => {
  it("låser first_progress op ved første vægtfremgang", () => {
    const result = checkAchievements(session({ progressed: [{ exerciseId: "ex1" }] }), 1);
    expect(idsOf(result)).toContain("first_progress");
  });

  it("låser progress_streak_3 op ved 3 sessioners streak", () => {
    saveAchievements({ ...loadAchievements(), progressStreaks: { ex1: 2 } });
    const result = checkAchievements(session({ progressed: [{ exerciseId: "ex1" }] }), 3);
    expect(idsOf(result)).toContain("progress_streak_3");
  });

  it("låser progress_streak_5 op ved 5 sessioners streak", () => {
    saveAchievements({ ...loadAchievements(), progressStreaks: { ex1: 4 } });
    const result = checkAchievements(session({ progressed: [{ exerciseId: "ex1" }] }), 5);
    expect(idsOf(result)).toContain("progress_streak_5");
  });

  it("resetter streak for øvelse uden fremgang", () => {
    saveAchievements({ ...loadAchievements(), progressStreaks: { ex1: 2 } });
    checkAchievements(session({ notProgressed: ["ex1"] }), 1);
    expect(loadAchievements().progressStreaks.ex1).toBe(0);
  });
});

describe("checkAchievements — volumen", () => {
  it("låser volume_2000 op ved 2.000 kg i én session", () => {
    expect(idsOf(checkAchievements(session({ volume: 2000 }), 1))).toContain("volume_2000");
  });

  it("låser volume_5000 op ved 5.000 kg i én session", () => {
    expect(idsOf(checkAchievements(session({ volume: 5000 }), 1))).toContain("volume_5000");
  });

  it("akkumulerer total volumen på tværs af sessioner", () => {
    checkAchievements(session({ volume: 1000 }), 1);
    checkAchievements(session({ volume: 1500 }), 2);
    expect(loadAchievements().totalVolume).toBe(2500);
  });

  it("låser total_volume_50000 op når summen passerer 50.000 kg", () => {
    saveAchievements({ ...loadAchievements(), totalVolume: 49000 });
    expect(idsOf(checkAchievements(session({ volume: 1000 }), 2))).toContain("total_volume_50000");
  });

  it("låser total_volume_100000 op når summen passerer 100.000 kg", () => {
    saveAchievements({ ...loadAchievements(), totalVolume: 99000 });
    expect(idsOf(checkAchievements(session({ volume: 2000 }), 2))).toContain(
      "total_volume_100000"
    );
  });
});

describe("checkAchievements — tid på dagen", () => {
  it("låser early_bird op før kl. 7", () => {
    const result = checkAchievements(session({ date: new Date("2026-06-10T06:30:00") }), 1);
    expect(idsOf(result)).toContain("early_bird");
  });

  it("låser night_owl op fra kl. 21", () => {
    const result = checkAchievements(session({ date: new Date("2026-06-10T21:05:00") }), 1);
    expect(idsOf(result)).toContain("night_owl");
  });

  it("låser ingen af dem op midt på dagen", () => {
    const ids = idsOf(checkAchievements(session(), 1));
    expect(ids).not.toContain("early_bird");
    expect(ids).not.toContain("night_owl");
  });
});

describe("checkAchievements — konsistens", () => {
  const trainOn = (day, dateStr, count) =>
    checkAchievements(session({ day, date: new Date(dateStr) }), count);

  it("låser perfect_week op når mandag, onsdag og fredag er taget i samme uge", () => {
    trainOn("mon", "2026-06-08T12:00:00", 1);
    trainOn("wed", "2026-06-10T12:00:00", 2);
    const result = trainOn("fri", "2026-06-12T12:00:00", 3);
    expect(idsOf(result)).toContain("perfect_week");
  });

  it("låser ikke perfect_week op når dagene ligger i hver sin uge", () => {
    trainOn("mon", "2026-06-08T12:00:00", 1);
    trainOn("wed", "2026-06-17T12:00:00", 2);
    const result = trainOn("fri", "2026-06-26T12:00:00", 3);
    expect(idsOf(result)).not.toContain("perfect_week");
  });

  it("tæller kun én perfekt uge selv om man træner igen samme uge", () => {
    trainOn("mon", "2026-06-08T12:00:00", 1);
    trainOn("wed", "2026-06-10T12:00:00", 2);
    trainOn("fri", "2026-06-12T12:00:00", 3);
    trainOn("fri", "2026-06-13T12:00:00", 4);
    expect(loadAchievements().perfectWeeks).toBe(1);
  });

  it("låser perfect_weeks_4 op efter fire perfekte uger", () => {
    saveAchievements({ ...loadAchievements(), perfectWeeks: 3 });
    trainOn("mon", "2026-06-08T12:00:00", 1);
    trainOn("wed", "2026-06-10T12:00:00", 2);
    const result = trainOn("fri", "2026-06-12T12:00:00", 3);
    expect(idsOf(result)).toContain("perfect_weeks_4");
  });
});

describe("checkAchievements — generelt", () => {
  it("returnerer ikke allerede unlockede achievements igen", () => {
    checkAchievements(session(), 1);
    expect(idsOf(checkAchievements(session(), 1))).not.toContain("first_workout");
  });

  it("gemmer unlock-tidspunkt i localStorage", () => {
    checkAchievements(session(), 1);
    expect(loadAchievements().unlocked.first_workout).toBeDefined();
  });

  it("virker med minimal sessionData (bagudkompatibelt)", () => {
    const result = checkAchievements({ progressed: [], notProgressed: [], maxWeight: 60 }, 1);
    expect(idsOf(result)).toContain("weight_50");
  });
});

describe("getAchievementList", () => {
  it("returnerer alle achievements med unlockedAt = null når intet er låst op", () => {
    const list = getAchievementList();
    expect(list).toHaveLength(ACHIEVEMENTS.length);
    expect(list.every((a) => a.unlockedAt === null)).toBe(true);
  });

  it("sætter unlockedAt på de låste op", () => {
    checkAchievements(session(), 1);
    const first = getAchievementList().find((a) => a.id === "first_workout");
    expect(first.unlockedAt).toBeTruthy();
    expect(new Date(first.unlockedAt).toString()).not.toBe("Invalid Date");
  });

  it("bevarer rækkefølgen fra ACHIEVEMENTS", () => {
    expect(getAchievementList().map((a) => a.id)).toEqual(ACHIEVEMENTS.map((a) => a.id));
  });
});
