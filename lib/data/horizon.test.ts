import { describe, expect, it } from "vitest";
import { buildSquadHorizon, fdrMultiplier, type HorizonPlayer, type HorizonFixtureMeta } from "./horizon";

const teamShortById = new Map([
  [1, "ARS"],
  [2, "AVL"],
  [3, "CHE"],
]);

function player(p: Partial<HorizonPlayer> = {}): HorizonPlayer {
  return {
    element: 1,
    name: "Player",
    position: "MID",
    teamId: 1,
    teamShort: "ARS",
    price: 7,
    baseXp: 5,
    ...p,
  };
}

describe("fdrMultiplier", () => {
  it("is 1.0 at FDR 3, higher for easy, lower for hard", () => {
    expect(fdrMultiplier(3)).toBeCloseTo(1.0, 5);
    expect(fdrMultiplier(1)).toBeGreaterThan(1.2);
    expect(fdrMultiplier(5)).toBeLessThan(0.8);
  });
});

describe("buildSquadHorizon", () => {
  const fixtures: HorizonFixtureMeta[] = [
    { event: 1, teamH: 1, teamA: 2, fdrH: 2, fdrA: 4 }, // ARS home vs AVL (easy for ARS)
    { event: 2, teamH: 3, teamA: 1, fdrH: 2, fdrA: 5 }, // ARS away at CHE (hard)
    // event 3: ARS blank (no fixture)
    { event: 4, teamH: 1, teamA: 2, fdrH: 3, fdrA: 3 }, // double for ARS: also...
    { event: 4, teamH: 3, teamA: 1, fdrH: 3, fdrA: 3 }, // ...away at CHE same GW
  ];

  it("projects per-GW xP scaled by FDR, with blanks at 0 and doubles summed", () => {
    const { gws, rows } = buildSquadHorizon({
      squad: [player()],
      fixtures,
      teamShortById,
      fromGw: 1,
      horizon: 4,
    });
    expect(gws).toEqual([1, 2, 3, 4]);
    const r = rows[0];
    // GW1: easy (FDR2) → 5 * 1.26 = 6.3
    expect(r.cells[0].xp).toBeCloseTo(5 * fdrMultiplier(2), 1);
    expect(r.cells[0].opponents[0]).toEqual({ short: "AVL", home: true, fdr: 2 });
    // GW2: hard away (FDR5) → 5 * 0.74 = 3.7
    expect(r.cells[1].xp).toBeCloseTo(5 * fdrMultiplier(5), 1);
    // GW3: blank
    expect(r.cells[2].opponents).toHaveLength(0);
    expect(r.cells[2].xp).toBe(0);
    // GW4: double (two fixtures) → sum of both
    expect(r.cells[3].opponents).toHaveLength(2);
    expect(r.cells[3].xp).toBeCloseTo(5 * fdrMultiplier(3) * 2, 1);
    // total = sum of cells
    expect(r.total).toBeCloseTo(r.cells.reduce((s, c) => s + c.xp, 0), 1);
  });
});
