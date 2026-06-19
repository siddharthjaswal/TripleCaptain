import { prisma } from "../prisma";
import { buildRatings, type Match } from "./ratings";
import { predictMatch } from "./predict";

/**
 * Backtest the Poisson match predictor on held-out history — the credibility
 * engine behind the "Proven Accuracy" badge. Pure maths, zero AI.
 *
 * Single-split walk-forward: train on every season strictly before the most
 * recent complete season in the DB, then predict every match of that latest
 * season and score the predictions against what actually happened. We report
 * the model vs two honest reference points:
 *   - accuracy vs the "always back the home team" baseline (the naive pick), and
 *   - log-loss vs a uniform 1/3-each forecast (ln 3 ≈ 1.0986).
 *
 * Off-season / sparse data degrades gracefully: <2 seasons or an empty test set
 * yields null, never a throw.
 */
export type BacktestResult = {
  testSeason: string;
  trainSeasons: string[];
  matches: number;
  accuracy: number; // 0-100, model argmax outcome correct
  logLoss: number; // mean negative log-likelihood of the actual outcome
  baselineAccuracy: number; // 0-100, "always home wins"
  uniformLogLoss: number; // ln(3), the no-information reference
  brier: number; // multiclass Brier score (0 best, 2 worst)
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
};

const UNIFORM_LOG_LOSS = Math.log(3); // ≈ 1.0986
const EPS = 1e-12;

function outcome(homeGoals: number, awayGoals: number): "H" | "D" | "A" {
  if (homeGoals > awayGoals) return "H";
  if (homeGoals < awayGoals) return "A";
  return "D";
}

export async function runBacktest(): Promise<BacktestResult | null> {
  const matches = (await prisma.historicalMatch.findMany()) as Match[];
  return backtestFromMatches(matches);
}

/** Pure core — separated so it can be unit-tested without a DB. */
export function backtestFromMatches(matches: Match[]): BacktestResult | null {
  const seasons = [...new Set(matches.map((m) => m.season))].sort();
  if (seasons.length < 2) return null;

  const testSeason = seasons[seasons.length - 1];
  const trainSeasons = seasons.slice(0, -1);

  const train = matches.filter((m) => m.season !== testSeason);
  const test = matches.filter((m) => m.season === testSeason);
  if (train.length === 0 || test.length === 0) return null;

  const ratings = buildRatings(train);

  let correct = 0;
  let scored = 0;
  let homeWins = 0;
  let logLossSum = 0;
  let brierSum = 0;
  let H = 0;
  let D = 0;
  let A = 0;

  for (const m of test) {
    const f = predictMatch(m.homeCode, m.awayCode, ratings);
    if (!f) continue; // a team unseen in training — skip, don't guess

    const pH = f.pHome / 100;
    const pD = f.pDraw / 100;
    const pA = f.pAway / 100;
    const act = outcome(m.homeGoals, m.awayGoals);

    // Model's pick = most likely outcome.
    const pick = pH >= pD && pH >= pA ? "H" : pA >= pD ? "A" : "D";
    if (pick === act) correct++;
    if (act === "H") {
      homeWins++;
      H++;
    } else if (act === "D") D++;
    else A++;

    const pActual = act === "H" ? pH : act === "D" ? pD : pA;
    logLossSum += -Math.log(Math.max(EPS, pActual));

    // Multiclass Brier: sum over outcomes of (p - 1{actual})^2.
    brierSum +=
      (pH - (act === "H" ? 1 : 0)) ** 2 +
      (pD - (act === "D" ? 1 : 0)) ** 2 +
      (pA - (act === "A" ? 1 : 0)) ** 2;

    scored++;
  }

  if (scored === 0) return null;

  const pct = (n: number) => Math.round((n / scored) * 1000) / 10;
  return {
    testSeason,
    trainSeasons,
    matches: scored,
    accuracy: pct(correct),
    logLoss: Math.round((logLossSum / scored) * 1000) / 1000,
    baselineAccuracy: pct(homeWins),
    uniformLogLoss: Math.round(UNIFORM_LOG_LOSS * 1000) / 1000,
    brier: Math.round((brierSum / scored) * 1000) / 1000,
    homeWinPct: pct(H),
    drawPct: pct(D),
    awayWinPct: pct(A),
  };
}
