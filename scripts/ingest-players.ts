import "dotenv/config";
import { prisma } from "../lib/prisma";
import { ingestPlayerHistory } from "../lib/data/ingest-players";

async function main() {
  console.log("Ingesting per-player career history (FPL element-summary)...");
  const n = await ingestPlayerHistory((done, total) => console.log(`  ${done}/${total} players`));
  const seasons = await prisma.historicalPlayerSeason.groupBy({ by: ["season"], _count: true });
  console.log(`✓ ${n} player-season rows across ${seasons.length} seasons`);
  for (const s of seasons.sort((a, b) => a.season.localeCompare(b.season))) {
    console.log(`   ${s.season}: ${s._count} players`);
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
