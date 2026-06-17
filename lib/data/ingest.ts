import { prisma } from "../prisma";

/**
 * Historical data ingestion from the public vaastav/Fantasy-Premier-League
 * dataset (2016-17 → 2024-25). We pull match results (fixtures.csv) and the
 * per-season team code map (teams.csv), keyed by stable team `code` so data
 * joins across seasons. Idempotent: safe to re-run.
 */

const RAW =
  "https://raw.githubusercontent.com/vaastav/Fantasy-Premier-League/master/data";

export const HISTORY_SEASONS = [
  "2019-20",
  "2020-21",
  "2021-22",
  "2022-23",
  "2023-24",
  "2024-25",
] as const;

async function fetchCsv(url: string): Promise<Record<string, string>[]> {
  const res = await fetch(url, { headers: { "User-Agent": "triple-captain-ingest/1.0" } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const text = await res.text();
  return parseCsv(text);
}

/** Minimal CSV parser that respects quoted fields (vaastav rows embed JSON). */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  const header = rows.shift();
  if (!header) return [];
  return rows
    .filter((r) => r.length === header.length)
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

/** teams.csv → { perSeasonId: code, name, shortName } */
async function loadTeamMap(season: string): Promise<Map<number, { code: number; name: string; short: string }>> {
  const teams = await fetchCsv(`${RAW}/${season}/teams.csv`);
  const map = new Map<number, { code: number; name: string; short: string }>();
  for (const t of teams) {
    map.set(Number(t.id), { code: Number(t.code), name: t.name, short: t.short_name });
  }
  return map;
}

export async function ingestSeasonMatches(season: string): Promise<number> {
  const teamMap = await loadTeamMap(season);
  const fixtures = await fetchCsv(`${RAW}/${season}/fixtures.csv`);

  const records = fixtures
    .filter((f) => f.finished === "True" && f.team_h_score !== "" && f.team_a_score !== "")
    .map((f) => {
      const home = teamMap.get(Number(f.team_h));
      const away = teamMap.get(Number(f.team_a));
      if (!home || !away) return null;
      return {
        season,
        event: Number(f.event) || 0,
        homeCode: home.code,
        awayCode: away.code,
        homeGoals: Number(f.team_h_score),
        awayGoals: Number(f.team_a_score),
        kickoff: f.kickoff_time ? new Date(f.kickoff_time) : null,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  // Replace this season's rows wholesale (idempotent refresh).
  await prisma.historicalMatch.deleteMany({ where: { season } });
  // createMany in chunks
  for (let i = 0; i < records.length; i += 200) {
    await prisma.historicalMatch.createMany({
      data: records.slice(i, i + 200),
      skipDuplicates: true,
    });
  }
  return records.length;
}

/** Pull the current season's finished matches from our own synced Fixture table. */
export async function ingestCurrentSeasonMatches(seasonLabel: string): Promise<number> {
  const fixtures = await prisma.fixture.findMany({
    where: { finished: true, homeScore: { not: null }, awayScore: { not: null } },
    include: { homeTeam: true, awayTeam: true },
  });
  const records = fixtures.map((f) => ({
    season: seasonLabel,
    event: f.gameweekId ?? 0,
    homeCode: f.homeTeam.code,
    awayCode: f.awayTeam.code,
    homeGoals: f.homeScore!,
    awayGoals: f.awayScore!,
    kickoff: f.kickoffTime,
  }));
  await prisma.historicalMatch.deleteMany({ where: { season: seasonLabel } });
  for (let i = 0; i < records.length; i += 200) {
    await prisma.historicalMatch.createMany({ data: records.slice(i, i + 200), skipDuplicates: true });
  }
  return records.length;
}

export async function ingestAllHistory(currentSeasonLabel = "2025-26"): Promise<void> {
  for (const season of HISTORY_SEASONS) {
    const n = await ingestSeasonMatches(season);
    console.log(`  ${season}: ${n} matches`);
  }
  const cur = await ingestCurrentSeasonMatches(currentSeasonLabel);
  console.log(`  ${currentSeasonLabel} (current, from DB): ${cur} matches`);
}
