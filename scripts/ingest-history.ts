import "dotenv/config";
import { prisma } from "../lib/prisma";
import { ingestAllHistory } from "../lib/data/ingest";
import { computeTeamRatings, buildRatings, type Match } from "../lib/data/ratings";
import { predictMatch } from "../lib/data/predict";

/**
 * Ingest historical matches, compute team ratings, validate the predictor on a
 * held-out season, and print a leaderboard. Usage: pnpm data:ingest
 */
async function main() {
  console.log("1) Ingesting historical matches (vaastav 2019-25 + current from DB)...");
  await ingestAllHistory();

  const total = await prisma.historicalMatch.count();
  console.log(`   → ${total} matches stored\n`);

  console.log("2) Computing team ratings (Elo + attack/defence)...");
  const ratings = await computeTeamRatings(true);
  console.log(`   → rated ${ratings.teams.size} teams\n`);

  // ---- Validation: train on <=2023-24, test on 2024-25 ----
  console.log("3) Validating predictor (train ≤2023-24 → test 2024-25)...");
  const all = (await prisma.historicalMatch.findMany()) as Match[];
  const train = all.filter((m) => m.season < "2024-25");
  const test = all.filter((m) => m.season === "2024-25");
  const trained = buildRatings(train);

  let correct = 0,
    logloss = 0,
    n = 0,
    baseCorrect = 0;
  for (const m of test) {
    const f = predictMatch(m.homeCode, m.awayCode, trained);
    if (!f) continue;
    n++;
    const actual = m.homeGoals > m.awayGoals ? "H" : m.homeGoals === m.awayGoals ? "D" : "A";
    const probs = { H: f.pHome / 100, D: f.pDraw / 100, A: f.pAway / 100 };
    const pick = (["H", "D", "A"] as const).reduce((a, b) => (probs[b] > probs[a] ? b : a), "H");
    if (pick === actual) correct++;
    if (actual === "H") baseCorrect++; // naive "home always" baseline
    logloss += -Math.log(Math.max(0.001, probs[actual]));
  }
  console.log(`   → tested ${n} matches`);
  console.log(`   → outcome accuracy: ${((correct / n) * 100).toFixed(1)}%  (home-always baseline: ${((baseCorrect / n) * 100).toFixed(1)}%)`);
  console.log(`   → mean log-loss:    ${(logloss / n).toFixed(3)}  (uniform 1/3 = 1.099; lower is better)\n`);

  // ---- Leaderboard ----
  console.log("4) Current power rankings (top 10 by Elo):");
  const top = await prisma.teamRating.findMany({ orderBy: { elo: "desc" }, take: 10 });
  for (const t of top) {
    console.log(
      `   ${String(Math.round(t.elo)).padStart(4)}  ${t.shortName.padEnd(4)} ${t.name.padEnd(20)} ` +
      `atk ${t.attackStrength.toFixed(2)}  def ${t.defenceStrength.toFixed(2)}`,
    );
  }

  // ---- Sample prediction ----
  console.log("\n5) Sample forecast (top Elo team at home vs 2nd):");
  if (top.length >= 2) {
    const f = predictMatch(top[0].teamCode, top[1].teamCode, ratings);
    if (f) {
      console.log(
        `   ${top[0].shortName} vs ${top[1].shortName}: ` +
        `${f.pHome}% / ${f.pDraw}% / ${f.pAway}%  ` +
        `xG ${f.xHome}-${f.xAway}  | likely ${f.topScores[0].score} (${f.topScores[0].pct}%)  ` +
        `BTTS ${f.bttsPct}%`,
      );
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
