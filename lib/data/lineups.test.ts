import { describe, expect, it } from "vitest";
import { predictClubXI, type LineupPlayer } from "./lineups";

function squad(): LineupPlayer[] {
  const ps: LineupPlayer[] = [];
  // 3 GKs, 8 DEF, 8 MID, 5 FWD — plenty for a legal XI.
  const add = (type: number, n: number) => {
    for (let i = 0; i < n; i++)
      ps.push({ name: `${type}-${i}`, elementType: type, status: "a", minutes: 3000 - i * 200, starts: 34 - i * 3 });
  };
  add(1, 3);
  add(2, 8);
  add(3, 8);
  add(4, 5);
  return ps;
}

describe("predictClubXI", () => {
  it("returns a legal 11 with one GK and a valid formation", () => {
    const xi = predictClubXI({ players: squad(), teamShort: "TST", teamName: "Test", gamesPlayed: 38 });
    const outfield = xi.lines.DEF.length + xi.lines.MID.length + xi.lines.FWD.length;
    expect(xi.lines.GK).toHaveLength(1);
    expect(outfield).toBe(10);
    expect(xi.lines.DEF.length).toBeGreaterThanOrEqual(3);
    expect(xi.lines.MID.length).toBeGreaterThanOrEqual(2);
    expect(xi.lines.FWD.length).toBeGreaterThanOrEqual(1);
    expect(xi.formation).toMatch(/^\d-\d-\d$/);
    expect(xi.bench.length).toBeGreaterThan(0);
  });

  it("excludes injured/unavailable players from the XI", () => {
    const players = squad();
    // Knock out the best GK — the next should be picked instead.
    players[0] = { ...players[0], status: "i" };
    const xi = predictClubXI({ players, teamShort: "TST", teamName: "Test", gamesPlayed: 38 });
    expect(xi.lines.GK).toHaveLength(1);
    expect(xi.lines.GK[0]).not.toBe(players[0].name);
  });

  it("degrades gracefully with too few players", () => {
    const xi = predictClubXI({
      players: [{ name: "solo", elementType: 1, status: "a", minutes: 900, starts: 10 }],
      teamShort: "TST",
      teamName: "Test",
      gamesPlayed: 38,
    });
    expect(xi.formation).toBe("—");
    expect(xi.lines.GK).toHaveLength(1);
  });
});
