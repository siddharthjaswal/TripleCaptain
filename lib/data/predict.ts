import type { TeamRatings } from "./ratings";

/**
 * Deterministic match predictor: independent Poisson over scorelines, with
 * expected goals from each team's attack/defence strength plus a small Elo
 * nudge so clear favourites are sharpened. Pure maths — no AI.
 */

export type MatchForecast = {
  homeCode: number;
  awayCode: number;
  xHome: number;
  xAway: number;
  pHome: number;
  pDraw: number;
  pAway: number;
  bttsPct: number;
  homeCsPct: number; // home keeps a clean sheet
  awayCsPct: number;
  topScores: Array<{ score: string; pct: number }>;
};

const MAX_GOALS = 8;

function poissonPmf(lambda: number, k: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}
const FACT = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880];
function factorial(n: number): number {
  return FACT[n] ?? n * factorial(n - 1);
}

export function predictMatch(
  homeCode: number,
  awayCode: number,
  r: TeamRatings,
): MatchForecast | null {
  const h = r.teams.get(homeCode);
  const a = r.teams.get(awayCode);
  if (!h || !a) return null;

  // Base expected goals from Dixon-Coles strengths.
  let xHome = r.leagueAvgHomeGoals * h.attackHome * a.defenceAway;
  let xAway = r.leagueAvgAwayGoals * a.attackAway * h.defenceHome;

  // Elo nudge: shift ~±12% of goals across a 200-Elo gap.
  const eloDiff = h.elo + 65 - a.elo; // include home bump
  const nudge = Math.max(-0.25, Math.min(0.25, eloDiff / 200 * 0.12));
  xHome *= 1 + nudge;
  xAway *= 1 - nudge;

  xHome = clamp(xHome, 0.2, 4.5);
  xAway = clamp(xAway, 0.15, 4.0);

  // Scoreline matrix.
  let pHome = 0,
    pDraw = 0,
    pAway = 0,
    btts = 0,
    homeCs = 0,
    awayCs = 0;
  const scores: Array<{ score: string; pct: number }> = [];
  for (let i = 0; i <= MAX_GOALS; i++) {
    const ph = poissonPmf(xHome, i);
    for (let j = 0; j <= MAX_GOALS; j++) {
      const p = ph * poissonPmf(xAway, j);
      if (i > j) pHome += p;
      else if (i === j) pDraw += p;
      else pAway += p;
      if (i > 0 && j > 0) btts += p;
      if (j === 0) homeCs += p;
      if (i === 0) awayCs += p;
      scores.push({ score: `${i}-${j}`, pct: p });
    }
  }

  const total = pHome + pDraw + pAway || 1;
  scores.sort((x, y) => y.pct - x.pct);

  return {
    homeCode,
    awayCode,
    xHome: round2(xHome),
    xAway: round2(xAway),
    pHome: pct(pHome / total),
    pDraw: pct(pDraw / total),
    pAway: pct(pAway / total),
    // Normalise the secondary markets by the same grid mass as 1X2 so every
    // percentage on the card shares one basis (the grid is truncated at
    // MAX_GOALS, so `total` < 1 for high-scoring fixtures near the clamps).
    bttsPct: pct(btts / total),
    homeCsPct: pct(homeCs / total),
    awayCsPct: pct(awayCs / total),
    topScores: scores.slice(0, 5).map((s) => ({ score: s.score, pct: pct(s.pct / total) })),
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function pct(n: number): number {
  return Math.round(n * 1000) / 10;
}
