import { describe, it, expect } from "vitest";
import { formatKg } from "./format";

describe("formatKg", () => {
  it("uses comma as decimal separator", () => {
    expect(formatKg(2.5)).toBe("2,5 kg");
  });
  it("drops trailing zeros for whole numbers", () => {
    expect(formatKg(60)).toBe("60 kg");
  });
  it("handles 1.25 increments", () => {
    expect(formatKg(41.25)).toBe("41,25 kg");
  });
  it("handles zero (bodyweight)", () => {
    expect(formatKg(0)).toBe("0 kg");
  });
});
