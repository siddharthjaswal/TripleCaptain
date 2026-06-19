import { describe, expect, it } from "vitest";
import { computePriceWatch, type PriceElement } from "./price";

const teamShortById = new Map([
  [1, "ARS"],
  [2, "AVL"],
]);

function el(id: number, partial: Partial<PriceElement>): PriceElement {
  return { id, web_name: `P${id}`, element_type: 3, team: 1, ...partial };
}

describe("computePriceWatch", () => {
  it("is empty when there is no transfer activity", () => {
    const els = [el(1, { transfers_in_event: 0, transfers_out_event: 0 })];
    const r = computePriceWatch({ elements: els, totalPlayers: 1_000_000, teamShortById });
    expect(r.risers).toHaveLength(0);
    expect(r.fallers).toHaveLength(0);
  });

  it("returns empty when totalPlayers is zero (no divide-by-zero)", () => {
    const els = [el(1, { transfers_in_event: 50_000 })];
    const r = computePriceWatch({ elements: els, totalPlayers: 0, teamShortById });
    expect(r).toEqual({ risers: [], fallers: [] });
  });

  it("splits risers and fallers by net flow and ranks by magnitude", () => {
    const total = 1_000_000;
    const els = [
      el(1, { transfers_in_event: 60_000, transfers_out_event: 5_000 }), // +5.5%
      el(2, { transfers_in_event: 1_000, transfers_out_event: 40_000, team: 2 }), // -3.9%
      el(3, { transfers_in_event: 1_000, transfers_out_event: 1_500 }), // -0.05% → noise, ignored
      el(4, { transfers_in_event: 30_000, transfers_out_event: 1_000 }), // +2.9%
    ];
    const r = computePriceWatch({ elements: els, totalPlayers: total, teamShortById });

    expect(r.risers.map((c) => c.id)).toEqual([1, 4]); // sorted by flow desc
    expect(r.fallers.map((c) => c.id)).toEqual([2]);
    expect(r.risers[0].confidence).toBe("high"); // 5.5% ≥ 2.5
    expect(r.risers[0].teamShort).toBe("ARS");
    expect(r.fallers[0].direction).toBe("fall");
    // id 3 is below the noise floor and excluded entirely.
    expect([...r.risers, ...r.fallers].some((c) => c.id === 3)).toBe(false);
  });
});
