import "dotenv/config";
import { prisma } from "../lib/prisma";
import { computeTeamRatings, getRatings } from "../lib/data/ratings";
import { predictMatch } from "../lib/data/predict";
import { projectAllPlayers } from "../lib/data/xp";
import { runBacktest } from "../lib/data/backtest";

/**
 * Nightly zero-token precompute: refresh team ratings, player projections, and
 * match predictions for upcoming fixtures. Pages then read precomputed rows —
 * no AI, no heavy math at request time. Usage: pnpm precompute
 */
async function main() {
  console.log("1) Team ratings…");
  const ratings = await computeTeamRatings(true);
  console.log(`   rated ${ratings.teams.size} teams`);

  console.log("2) Player projections (custom xP)…");
  const proj = await projectAllPlayers({ persist: true });
  console.log(`   projected ${proj.length} players (top: ${proj[0]?.name} ${proj[0]?.xPoints}xP)`);

  console.log("3) Match predictions for upcoming fixtures…");
  const fixtures = await prisma.fixture.findMany({
    where: { finished: false },
    include: { homeTeam: true, awayTeam: true, gameweek: true },
  });
  const r = await getRatings();
  let n = 0;
  for (const f of fixtures) {
    const hc = f.homeTeam.code;
    const ac = f.awayTeam.code;
    const fc = predictMatch(hc, ac, r);
    if (!fc) continue;
    await prisma.matchPrediction.upsert({
      where: { season_homeCode_awayCode: { season: "2025-26", homeCode: hc, awayCode: ac } },
      update: {
        event: f.gameweekId ?? 0, pHome: fc.pHome, pDraw: fc.pDraw, pAway: fc.pAway,
        xHome: fc.xHome, xAway: fc.xAway, bttsPct: fc.bttsPct, homeCsPct: fc.homeCsPct,
        awayCsPct: fc.awayCsPct, topScores: fc.topScores,
      },
      create: {
        season: "2025-26", event: f.gameweekId ?? 0, homeCode: hc, awayCode: ac,
        pHome: fc.pHome, pDraw: fc.pDraw, pAway: fc.pAway, xHome: fc.xHome, xAway: fc.xAway,
        bttsPct: fc.bttsPct, homeCsPct: fc.homeCsPct, awayCsPct: fc.awayCsPct, topScores: fc.topScores,
      },
    });
    n++;
  }
  console.log(`   ${n} match predictions stored (off-season → 0 is expected)`);

  console.log("4) Backtest accuracy (Proven Accuracy badge)…");
  const bt = await runBacktest();
  if (bt) {
    // trainSeasons is informational only — not a persisted column.
    const { trainSeasons: _train, ...row } = bt;
    void _train;
    await prisma.modelAccuracy.upsert({
      where: { model: "match-predictor" },
      update: row,
      create: { model: "match-predictor", ...row },
    });
    console.log(
      `   ${bt.testSeason}: ${bt.accuracy}% acc vs ${bt.baselineAccuracy}% baseline, logLoss ${bt.logLoss} (${bt.matches} matches)`,
    );
  } else {
    console.log("   not enough seasons to backtest yet — skipped");
  }
  console.log("✓ precompute complete");
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
