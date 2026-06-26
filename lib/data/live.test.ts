import { describe, expect, it } from "vitest";
import {
  projectFixtureBonus,
  computeLiveSummary,
  type LivePick,
  type LiveStat,
  type LiveFixture,
} from "./live";

describe("projectFixtureBonus", () => {
  it("awards 3/2/1 to the top three by BPS", () => {
    const b = projectFixtureBonus([
      { id: 1, bps: 40 },
      { id: 2, bps: 30 },
      { id: 3, bps: 20 },
      { id: 4, bps: 10 },
    ]);
    expect(b.get(1)).toBe(3);
    expect(b.get(2)).toBe(2);
    expect(b.get(3)).toBe(1);
    expect(b.has(4)).toBe(false);
  });

  it("handles a tie for top: 3,3,1", () => {
    const b = projectFixtureBonus([
      { id: 1, bps: 40 },
      { id: 2, bps: 40 },
      { id: 3, bps: 25 },
    ]);
    expect(b.get(1)).toBe(3);
    expect(b.get(2)).toBe(3);
    expect(b.get(3)).toBe(1);
  });

  it("handles a tie for second: 3,2,2", () => {
    const b = projectFixtureBonus([
      { id: 1, bps: 40 },
      { id: 2, bps: 30 },
      { id: 3, bps: 30 },
    ]);
    expect(b.get(1)).toBe(3);
    expect(b.get(2)).toBe(2);
    expect(b.get(3)).toBe(2);
  });

  it("ignores zero/negative BPS", () => {
    const b = projectFixtureBonus([{ id: 1, bps: 0 }, { id: 2, bps: -5 }]);
    expect(b.size).toBe(0);
  });
});

// --- computeLiveSummary harness ---
function pick(p: Partial<LivePick> & { element: number; position: number }): LivePick {
  return {
    multiplier: p.position <= 11 ? 1 : 0,
    isCaptain: false,
    isViceCaptain: false,
    elementType: 3,
    team: 1,
    ...p,
  };
}

describe("computeLiveSummary", () => {
  it("adds provisional bonus while a fixture is in play, doubles the captain", () => {
    // Two players, team 1 vs team 2, match in play. p1 is captain with top BPS.
    const picks: LivePick[] = [
      pick({ element: 1, position: 1, isCaptain: true, multiplier: 2, team: 1, elementType: 4 }),
      pick({ element: 2, position: 2, team: 2, elementType: 4 }),
      // fill a legal-ish bench (not exercised here)
      pick({ element: 90, position: 12, team: 3, elementType: 3 }),
    ];
    const liveById = new Map<number, LiveStat>([
      [1, { totalPoints: 6, minutes: 90, bps: 40 }],
      [2, { totalPoints: 2, minutes: 90, bps: 20 }],
    ]);
    const allPlayersTeam = new Map<number, number>([
      [1, 1],
      [2, 2],
    ]);
    const fixtures: LiveFixture[] = [{ teamH: 1, teamA: 2, started: true, finished: false }];

    const s = computeLiveSummary({ picks, liveById, fixtures, allPlayersTeam, averageScore: 30 });
    expect(s.isLive).toBe(true);
    // p1: (6 base + 3 bonus) * 2 = 18 ; p2: (2 + 0... wait p2 has 20 bps → bonus 2) → 2+2 = 4
    expect(s.livePoints).toBe(18 + 4);
    expect(s.provisionalBonus).toBe(3 * 2 + 2); // captain bonus doubled + p2 bonus
    expect(s.startersInPlay).toBe(2);
    expect(s.captain.element).toBe(1);
    expect(s.vsAverage).toBe(s.livePoints - 30);
  });

  it("does NOT add provisional bonus once the fixture is finished", () => {
    const picks: LivePick[] = [pick({ element: 1, position: 1, team: 1, elementType: 4 })];
    const liveById = new Map<number, LiveStat>([[1, { totalPoints: 9, minutes: 90, bps: 40 }]]);
    const allPlayersTeam = new Map<number, number>([[1, 1]]);
    const fixtures: LiveFixture[] = [{ teamH: 1, teamA: 2, started: true, finished: true }];
    const s = computeLiveSummary({ picks, liveById, fixtures, allPlayersTeam, averageScore: null });
    expect(s.livePoints).toBe(9); // bonus already in the 9
    expect(s.provisionalBonus).toBe(0);
    expect(s.startersPlayed).toBe(1);
    expect(s.isLive).toBe(false);
  });

  it("counts the whole bench under Bench Boost (no auto-subs)", () => {
    const picks: LivePick[] = [
      pick({ element: 1, position: 1, team: 1, elementType: 1, multiplier: 1 }),
      pick({ element: 2, position: 2, team: 1, elementType: 2, multiplier: 1 }),
      pick({ element: 3, position: 8, isViceCaptain: true, team: 1, elementType: 3, multiplier: 2 }), // vice has armband
      pick({ element: 4, position: 12, team: 2, elementType: 3, multiplier: 1 }), // bench plays (bboost)
      pick({ element: 5, position: 15, isCaptain: true, team: 2, elementType: 4, multiplier: 1 }), // benched captain, blanked
    ];
    const liveById = new Map<number, LiveStat>([
      [1, { totalPoints: 2, minutes: 90, bps: 0 }],
      [2, { totalPoints: 6, minutes: 90, bps: 0 }],
      [3, { totalPoints: 5, minutes: 90, bps: 0 }],
      [4, { totalPoints: 7, minutes: 90, bps: 0 }], // bench player scores — must count
      [5, { totalPoints: 0, minutes: 0, bps: 0 }],
    ]);
    const allPlayersTeam = new Map<number, number>([[1, 1], [2, 1], [3, 1], [4, 2], [5, 2]]);
    const fixtures: LiveFixture[] = [{ teamH: 1, teamA: 2, started: true, finished: true }];
    const s = computeLiveSummary({
      picks, liveById, fixtures, allPlayersTeam, averageScore: null, activeChip: "bboost",
    });
    // 2 + 6 + (5 vice ×2) + 7 + 0 = 25
    expect(s.livePoints).toBe(25);
    expect(s.benchPoints).toBe(0);
    expect(s.counted).toBe(5);
    expect(s.autoSubs).toHaveLength(0);
    expect(s.captain.usedVice).toBe(true);
    expect(s.captain.element).toBe(3);
  });

  it("auto-subs a starter who blanked (0 mins, match over) for a bench player who played", () => {
    const picks: LivePick[] = [
      // GK + 3 DEF + ... we keep it minimal but formation-legal for the swap check.
      pick({ element: 10, position: 1, team: 1, elementType: 1 }), // GK played
      pick({ element: 11, position: 2, team: 1, elementType: 2 }),
      pick({ element: 12, position: 3, team: 1, elementType: 2 }),
      pick({ element: 13, position: 4, team: 1, elementType: 2 }),
      pick({ element: 14, position: 5, team: 1, elementType: 3 }),
      pick({ element: 15, position: 6, team: 1, elementType: 3 }),
      pick({ element: 16, position: 7, team: 2, elementType: 3 }), // blanks (0 mins, finished)
      pick({ element: 17, position: 8, team: 1, elementType: 3 }),
      pick({ element: 18, position: 9, team: 1, elementType: 4 }),
      pick({ element: 19, position: 10, team: 1, elementType: 4 }),
      pick({ element: 20, position: 11, team: 1, elementType: 4 }),
      pick({ element: 30, position: 12, team: 1, elementType: 3 }), // bench MID, played
    ];
    const liveById = new Map<number, LiveStat>();
    for (const p of picks) liveById.set(p.element, { totalPoints: 2, minutes: 90, bps: 5 });
    liveById.set(16, { totalPoints: 0, minutes: 0, bps: 0 }); // the blanker
    const allPlayersTeam = new Map<number, number>(picks.map((p) => [p.element, p.team]));
    const fixtures: LiveFixture[] = [
      { teamH: 1, teamA: 9, started: true, finished: true },
      { teamH: 2, teamA: 8, started: true, finished: true },
    ];
    const s = computeLiveSummary({ picks, liveById, fixtures, allPlayersTeam, averageScore: null });
    expect(s.autoSubs).toContainEqual({ outElement: 16, inElement: 30 });
    expect(s.effectiveXi).toContain(30);
    expect(s.effectiveXi).not.toContain(16);
  });
});
