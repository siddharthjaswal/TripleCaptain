import { describe, expect, it } from "vitest";
import { predictMatch } from "./predict";
import type { TeamRatings } from "./ratings";

type TeamRating = NonNullable<ReturnType<TeamRatings["teams"]["get"]>>;
function team(code: number, o: Partial<TeamRating> = {}): TeamRating {
  return { code, elo: 1500, attackHome: 1, attackAway: 1, defenceHome: 1, defenceAway: 1, games: 100, ...o };
}

function ratings(): TeamRatings {
  return {
    leagueAvgHomeGoals: 1.5,
    leagueAvgAwayGoals: 1.15,
    teams: new Map([
      // Strong home side, weak away side.
      [1, team(1, { elo: 1750, attackHome: 1.5, defenceHome: 0.7 })],
      [2, team(2, { elo: 1300, attackAway: 0.7, defenceAway: 1.3 })],
      [3, team(3)], // average
    ]),
  };
}

describe("predictMatch", () => {
  it("returns null when a team is unknown", () => {
    expect(predictMatch(1, 999, ratings())).toBeNull();
  });

  it("1X2 probabilities are percentages that sum to ~100", () => {
    const f = predictMatch(1, 2, ratings())!;
    expect(f.pHome + f.pDraw + f.pAway).toBeCloseTo(100, 0);
    [f.pHome, f.pDraw, f.pAway, f.bttsPct, f.homeCsPct, f.awayCsPct].forEach((p) => {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(100);
    });
  });

  it("favours a strong home side over a weak away side", () => {
    const f = predictMatch(1, 2, ratings())!;
    expect(f.pHome).toBeGreaterThan(f.pAway);
    expect(f.xHome).toBeGreaterThan(f.xAway);
    expect(f.homeCsPct).toBeGreaterThan(f.awayCsPct);
  });

  it("home advantage makes the same matchup favour the home team", () => {
    const r = ratings();
    const home3v3 = predictMatch(3, 3, r)!; // identical sides → home edge only
    expect(home3v3.pHome).toBeGreaterThanOrEqual(home3v3.pAway);
    expect(home3v3.topScores.length).toBeGreaterThan(0);
  });
});
