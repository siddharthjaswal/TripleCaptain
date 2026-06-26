import { describe, expect, it } from "vitest";
import { computeRivalsAnalysis, type RivalSquad } from "./rivals";

function sq(entryId: number, squad: number[], captain: number, rank = entryId): RivalSquad {
  return { entryId, name: `T${entryId}`, manager: `M${entryId}`, rank, squad, captain };
}

describe("computeRivalsAnalysis", () => {
  const me = sq(1, [10, 11, 12, 13, 14], 10);
  const rivals = [
    sq(2, [10, 11, 20, 21, 22], 10), // shares 10,11; captains 10 (same)
    sq(3, [10, 12, 30, 31, 32], 11), // shares 10,12; captains 11 (differs)
    sq(4, [10, 40, 41, 42, 43], 10), // shares 10; captains 10
  ];
  const a = computeRivalsAnalysis({ me, rivals });

  it("tallies field captaincy with the field size including you", () => {
    expect(a.fieldSize).toBe(3);
    // element 10 captained by me + rivals 2 & 4 = 3 of 4
    const top = a.captaincy[0];
    expect(top.element).toBe(10);
    expect(top.count).toBe(3);
    expect(top.isMine).toBe(true);
    expect(top.pct).toBeCloseTo((3 / 4) * 100, 1);
  });

  it("finds your differentials (low rival ownership)", () => {
    // 13 and 14 are owned by zero rivals → strongest differentials
    const ids = a.differentials.map((d) => d.element);
    expect(ids).toContain(13);
    expect(ids).toContain(14);
    expect(a.differentials[0].rivalCount).toBe(0);
    // 10 is owned by all 3 rivals (100%) → NOT a differential
    expect(ids).not.toContain(10);
  });

  it("finds template gaps (owned by most rivals, not by you)", () => {
    // No single non-owned player is held by >=50% here (each rival's extras are unique)
    expect(a.templateGaps.every((g) => g.rivalPct >= 50)).toBe(true);
  });

  it("computes per-rival overlap and captain difference, ordered by rank", () => {
    expect(a.rivals.map((r) => r.entryId)).toEqual([2, 3, 4]);
    expect(a.rivals[0].overlap).toBe(2); // rival 2 shares 10,11
    expect(a.rivals[0].differsCaptain).toBe(false); // same captain 10
    expect(a.rivals[1].differsCaptain).toBe(true); // rival 3 captains 11
  });

  it("handles an empty field without dividing by zero", () => {
    const solo = computeRivalsAnalysis({ me, rivals: [] });
    expect(solo.fieldSize).toBe(0);
    expect(solo.differentials.every((d) => d.rivalPct === 0)).toBe(true);
    expect(solo.captaincy[0].pct).toBe(100); // only you in the field
  });
});
