import { describe, it, expect } from "vitest";
import { groupVariants, resolveSelected } from "./variants";

const rdl = { id: 4, name: "Romanian deadlift", day: "wed", order_index: 4, alternative_for: null };
const dl = { id: 22, name: "Deadlift", day: "wed", order_index: 4, alternative_for: 4 };
const bench = { id: 3, name: "DB bench press", day: "wed", order_index: 3, alternative_for: null };

describe("groupVariants", () => {
  it("samler varianter under deres hovedøvelse", () => {
    const groups = groupVariants([dl, rdl, bench]);
    expect(groups.map((g) => g.primary.id)).toEqual([3, 4]); // rutinens rækkefølge
    expect(groups[1].variants.map((v) => v.name)).toEqual([
      "Romanian deadlift",
      "Deadlift",
    ]);
  });

  it("giver øvelser uden varianter en gruppe med kun dem selv", () => {
    expect(groupVariants([bench])[0].variants).toEqual([bench]);
  });
});

describe("resolveSelected", () => {
  const groups = groupVariants([rdl, dl, bench]);

  it("vælger hovedøvelsen når intet er valgt", () => {
    expect(resolveSelected(groups).map((g) => g.selected.name)).toEqual([
      "DB bench press",
      "Romanian deadlift",
    ]);
  });

  it("vælger varianten når den er valgt", () => {
    const res = resolveSelected(groups, { 4: 22 });
    expect(res[1].selected.name).toBe("Deadlift");
  });

  it("falder tilbage til hovedøvelsen ved et ukendt valg", () => {
    const res = resolveSelected(groups, { 4: 999 });
    expect(res[1].selected.name).toBe("Romanian deadlift");
  });
});
