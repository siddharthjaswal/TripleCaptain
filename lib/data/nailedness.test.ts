import { describe, expect, it } from "vitest";
import { computeNailedness } from "./nailedness";

describe("computeNailedness", () => {
  it("rates an ever-present starter as nailed", () => {
    const r = computeNailedness({ status: "a", minutes: 3300, starts: 37, gamesPlayed: 38 });
    expect(r.tier).toBe("nailed");
    expect(r.startProb).toBeGreaterThanOrEqual(80);
    expect(r.available).toBe(true);
  });

  it("rates a heavily-rotated player as rotation risk", () => {
    const r = computeNailedness({ status: "a", minutes: 1100, starts: 14, gamesPlayed: 38 });
    expect(r.tier).toBe("rotation");
  });

  it("flags an injured player as unavailable with 0%", () => {
    const r = computeNailedness({ status: "i", minutes: 2000, starts: 25, gamesPlayed: 30 });
    expect(r.tier).toBe("unavailable");
    expect(r.startProb).toBe(0);
    expect(r.available).toBe(false);
    expect(r.label).toBe("Injured");
  });

  it("uses the chance percentage for a doubt", () => {
    const r = computeNailedness({ status: "d", chanceNext: 25, minutes: 2500, starts: 30, gamesPlayed: 32 });
    expect(r.tier).toBe("doubt");
    expect(r.startProb).toBe(25);
    expect(r.available).toBe(false); // <50%
  });

  it("discounts an available player carrying a fitness flag (<100%)", () => {
    const full = computeNailedness({ status: "a", chanceNext: 100, minutes: 3000, starts: 34, gamesPlayed: 36 });
    const flagged = computeNailedness({ status: "a", chanceNext: 75, minutes: 3000, starts: 34, gamesPlayed: 36 });
    expect(flagged.startProb).toBeLessThan(full.startProb);
  });

  it("caps a barely-used player at fringe regardless", () => {
    const r = computeNailedness({ status: "a", minutes: 40, starts: 0, gamesPlayed: 20 });
    expect(r.tier).toBe("fringe");
    expect(r.startProb).toBeLessThanOrEqual(15);
  });

  it("never divides by zero when no games have been played", () => {
    const r = computeNailedness({ status: "a", minutes: 0, starts: 0, gamesPlayed: 0 });
    expect(Number.isFinite(r.startProb)).toBe(true);
  });
});
