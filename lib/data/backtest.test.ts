import { describe, expect, it } from "vitest";
import { backtestFromMatches } from "./backtest";
import type { Match } from "./ratings";

function m(
  season: string,
  homeCode: number,
  awayCode: number,
  homeGoals: number,
  awayGoals: number,
): Match {
  return { season, event: 1, homeCode, awayCode, homeGoals, awayGoals, kickoff: null };
}

describe("backtestFromMatches", () => {
  it("returns null with fewer than two seasons", () => {
    expect(backtestFromMatches([m("2023-24", 1, 2, 1, 0)])).toBeNull();
  });

  it("scores the latest season against the rest", () => {
    // Two clubs, one clearly stronger; train on 2023-24, test on 2024-25.
    const train: Match[] = [];
    for (let i = 0; i < 6; i++) {
      train.push(m("2023-24", 1, 2, 3, 0)); // strong home wins
      train.push(m("2023-24", 2, 1, 0, 2)); // strong wins away too
    }
    const test: Match[] = [m("2024-25", 1, 2, 2, 0), m("2024-25", 2, 1, 0, 1)];

    const r = backtestFromMatches([...train, ...test]);
    expect(r).not.toBeNull();
    expect(r!.testSeason).toBe("2024-25");
    expect(r!.trainSeasons).toEqual(["2023-24"]);
    expect(r!.matches).toBe(2);
    // Metrics are well-formed percentages / non-negative losses.
    expect(r!.accuracy).toBeGreaterThanOrEqual(0);
    expect(r!.accuracy).toBeLessThanOrEqual(100);
    expect(r!.logLoss).toBeGreaterThan(0);
    expect(r!.uniformLogLoss).toBeCloseTo(Math.log(3), 2);
    expect(r!.brier).toBeGreaterThanOrEqual(0);
    // Outcome distribution sums to ~100.
    expect(r!.homeWinPct + r!.drawPct + r!.awayWinPct).toBeCloseTo(100, 0);
  });

  it("skips test matches whose teams never appeared in training", () => {
    const train = [m("2023-24", 1, 2, 1, 0), m("2023-24", 2, 1, 1, 1)];
    // Test match uses code 99, unseen in training → predictMatch returns null → skipped.
    const test = [m("2024-25", 99, 1, 2, 0)];
    const r = backtestFromMatches([...train, ...test]);
    expect(r).toBeNull(); // only the unseen match in the test season → nothing scored
  });
});
