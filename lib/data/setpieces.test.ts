import { describe, expect, it } from "vitest";
import { computeSetPieceTakers, type SetPieceElement } from "./setpieces";

const teamShortById = new Map([
  [1, "ARS"],
  [2, "AVL"],
]);
const teamNameById = new Map([
  [1, "Arsenal"],
  [2, "Aston Villa"],
]);

describe("computeSetPieceTakers", () => {
  it("orders takers by published order and highlights the first choice", () => {
    const elements: SetPieceElement[] = [
      { web_name: "Saka", team: 1, penalties_order: 1, direct_freekicks_order: 2 },
      { web_name: "Ødegaard", team: 1, penalties_order: 3, corners_and_indirect_freekicks_order: null },
      { web_name: "Rice", team: 1, direct_freekicks_order: 1, corners_and_indirect_freekicks_order: 1 },
    ];
    const [arsenal] = computeSetPieceTakers({ elements, teamShortById, teamNameById });
    expect(arsenal.teamShort).toBe("ARS");
    expect(arsenal.penalties.map((p) => p.name)).toEqual(["Saka", "Ødegaard"]);
    expect(arsenal.freekicks.map((p) => p.name)).toEqual(["Rice", "Saka"]);
    expect(arsenal.corners.map((p) => p.name)).toEqual(["Rice"]);
  });

  it("skips clubs with no taker data and sorts by team name", () => {
    const elements: SetPieceElement[] = [
      { web_name: "Watkins", team: 2, penalties_order: 1 },
      { web_name: "NoData", team: 1, penalties_order: null, direct_freekicks_order: null },
    ];
    const result = computeSetPieceTakers({ elements, teamShortById, teamNameById });
    expect(result).toHaveLength(1);
    expect(result[0].teamName).toBe("Aston Villa");
  });
});
