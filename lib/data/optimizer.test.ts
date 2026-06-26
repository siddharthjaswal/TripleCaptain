import { describe, expect, it } from "vitest";
import { suggestTransfers, pickBestXI, clubKey } from "./optimizer";
import type { ProjectionResult, Position } from "./types";

function p(
  id: number,
  position: Position,
  xPoints: number,
  o: Partial<ProjectionResult> = {},
): ProjectionResult {
  return {
    id,
    name: `P${id}`,
    position,
    teamShort: o.teamShort ?? `T${id}`,
    price: o.price ?? 5,
    xPoints,
    ceiling: o.ceiling ?? xPoints * 1.6,
    floor: o.floor ?? xPoints * 0.6,
    capScore: o.capScore ?? xPoints,
    startProb: o.startProb ?? 1,
    value: o.value ?? xPoints / (o.price ?? 5),
    archetype: o.archetype ?? "balanced",
    reasons: o.reasons ?? [],
  };
}

// A legal 15-man squad: 2 GK, 5 DEF, 5 MID, 3 FWD.
function squad15(): ProjectionResult[] {
  const s: ProjectionResult[] = [];
  let id = 1;
  const add = (pos: Position, n: number, base: number) => {
    for (let i = 0; i < n; i++) s.push(p(id++, pos, base - i));
  };
  add("GK", 2, 4);
  add("DEF", 5, 5);
  add("MID", 5, 6);
  add("FWD", 3, 7);
  return s;
}

describe("clubKey", () => {
  it("is deterministic and distinguishes clubs", () => {
    expect(clubKey("ARS")).toBe(clubKey("ARS"));
    expect(clubKey("ARS")).not.toBe(clubKey("AVL"));
  });
});

describe("pickBestXI", () => {
  it("picks a legal XI (1 GK + 10 outfield within bounds) with 4 on the bench", () => {
    const xi = pickBestXI(squad15());
    expect(xi.starters).toHaveLength(11);
    expect(xi.bench).toHaveLength(4);
    expect(xi.formation).toMatch(/^\d-\d-\d$/);
  });

  it("starts the highest-xP players (the strongest forward is never benched)", () => {
    const s = squad15();
    const topFwd = [...s].filter((x) => x.position === "FWD").sort((a, b) => b.xPoints - a.xPoints)[0];
    const xi = pickBestXI(s);
    expect(xi.starters).toContain(topFwd.id);
  });

  it("returns empty for an empty squad", () => {
    expect(pickBestXI([]).starters).toHaveLength(0);
  });
});

describe("suggestTransfers", () => {
  it("suggests a net-positive single swap and skips when nothing beats the hit", () => {
    const squad = [p(1, "MID", 3, { price: 5 })];
    const candidates = [
      p(2, "MID", 8, { price: 5 }), // +5 xP, clear upgrade
      p(3, "FWD", 9, { price: 5 }), // wrong position — ignored
    ];
    const out = suggestTransfers({ squad, candidates, bank: 0, freeTransfers: 1, maxSuggestions: 5 });
    expect(out).toHaveLength(1);
    expect(out[0].outId).toBe(1);
    expect(out[0].inId).toBe(2);
    expect(out[0].netGain).toBeGreaterThan(0);
    expect(out[0].hit).toBe(0); // free transfer
  });

  it("applies the -4 hit when no free transfer is available", () => {
    const squad = [p(1, "MID", 4, { price: 5 })];
    const candidates = [p(2, "MID", 6, { price: 5 })]; // +2 xP < 4-pt hit
    const out = suggestTransfers({ squad, candidates, bank: 0, freeTransfers: 0 });
    // +2 gain doesn't beat the -4 hit → no suggestion
    expect(out).toHaveLength(0);
  });

  it("respects affordability (bank + sell value)", () => {
    const squad = [p(1, "MID", 4, { price: 5 })];
    const candidates = [p(2, "MID", 9, { price: 9 })]; // needs 9, have 5 + bank 1 = 6
    const out = suggestTransfers({ squad, candidates, bank: 1, freeTransfers: 1 });
    expect(out).toHaveLength(0);
  });
});
