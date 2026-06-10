import "dotenv/config";
import { prisma } from "../lib/prisma";
import { buildEliteSnapshot, rankPlayers } from "../lib/fpl/brain";

/**
 * Build (or refresh) the elite-manager snapshot for the latest finished GW,
 * then print the engine's current top picks as a sanity check.
 * Usage: pnpm db:brain
 */
async function main() {
    const gw =
        (await prisma.gameweek.findFirst({ where: { isCurrent: true } }))?.id ??
        (await prisma.gameweek.findFirst({ where: { finished: true }, orderBy: { id: "desc" } }))?.id;
    if (!gw) throw new Error("No gameweek found — run db:sync first");

    console.log(`Building elite snapshot for GW${gw} (top 50 overall managers)...`);
    const snap = await buildEliteSnapshot(gw);
    console.log(
        `✓ Sampled ${snap.sample} elite squads — ${snap.players.length} tracked players, ` +
        `formations ${JSON.stringify(snap.formations)}, avg value £${snap.avgTeamValue}m`,
    );

    console.log("\nEngine top 10 overall:");
    for (const v of await rankPlayers({ limit: 10, gameweek: gw })) {
        console.log(
            `  ${v.score.toFixed(1).padStart(5)}  ${v.name.padEnd(16)} ${v.position} ${v.team}` +
            `  elite ${String(v.elitePct).padStart(3)}%  own ${v.ownership}%  [${v.reasons[0] ?? ""}]`,
        );
    }

    console.log("\nEngine top 5 differentials (<12% owned):");
    for (const v of await rankPlayers({ maxOwnership: 12, limit: 5, gameweek: gw })) {
        console.log(`  ${v.score.toFixed(1).padStart(5)}  ${v.name.padEnd(16)} elite ${v.elitePct}% vs own ${v.ownership}%`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
