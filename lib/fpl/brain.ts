// NOTE: deliberately no "server-only" import — this module is shared by the
// Next.js server AND standalone scripts (scripts/brain.ts via tsx).
import { prisma } from "../prisma";

/**
 * The Triple Captain "Brain" — a deterministic thinking engine that learns
 * from the world's best FPL managers and scores players WITHOUT needing AI.
 *
 * Two halves:
 *  1. ELITE LEARNINGS — we sample the top managers in the Overall league
 *     (league id 314) once per gameweek, aggregate what they actually do
 *     (ownership, captaincy, formations, bank/value), and persist the
 *     snapshot in Postgres. This is "studying the patterns of top players".
 *  2. SCORING ENGINE — a pure function that combines elite conviction,
 *     form, expected points, fixtures, minutes (nailedness), and value into
 *     a 0-100 verdict per player, with human-readable reasons.
 *
 * AI (Claude) only narrates on top of these pre-digested facts, so the
 * product keeps working — and stays smart — with very little AI.
 */

const API_BASE = "https://fantasy.premierleague.com/api";
const OVERALL_LEAGUE_ID = 314;
const SAMPLE_SIZE = 50;
const FETCH_CONCURRENCY = 5;

// ---------- Types ----------

export type ElitePlayerStat = {
  id: number;
  /** % of elite managers who own the player (any squad slot). */
  elitePct: number;
  /** % of elite managers who started them (multiplier > 0). */
  startPct: number;
  /** % of elite managers who captained them. */
  captainPct: number;
};

export type EliteSnapshotData = {
  gameweek: number;
  sample: number;
  players: ElitePlayerStat[];
  formations: Record<string, number>;
  chipCounts: Record<string, number>;
  avgBank: number; // £m
  avgTeamValue: number; // £m
};

export type PlayerVerdict = {
  id: number;
  name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  team: string;
  price: number;
  score: number; // 0-100
  elitePct: number;
  captainPct: number;
  ownership: number;
  eliteEdge: number; // elitePct - global ownership
  form: number;
  epNext: number;
  reasons: string[];
};

// ---------- Elite sample collection ----------

async function fetchJson(path: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "User-Agent": "triple-captain-brain/1.0", Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`FPL ${path} -> ${res.status}`);
  return res.json();
}

type RawPick = {
  element: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  element_type: number;
};

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R | null>,
): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const item = items[i++];
        try {
          const r = await fn(item);
          if (r !== null) out.push(r);
        } catch {
          /* skip failures — a 49/50 sample is fine */
        }
      }
    }),
  );
  return out;
}

/** Build (and persist) the elite snapshot for a gameweek by sampling top managers. */
export async function buildEliteSnapshot(gameweek: number): Promise<EliteSnapshotData> {
  const standings = (await fetchJson(
    `/leagues-classic/${OVERALL_LEAGUE_ID}/standings/?page_standings=1`,
  )) as { standings: { results: Array<{ entry: number }> } };

  const entryIds = standings.standings.results.slice(0, SAMPLE_SIZE).map((r) => r.entry);

  const squads = await mapWithConcurrency(entryIds, FETCH_CONCURRENCY, async (id) => {
    const picksData = (await fetchJson(`/entry/${id}/event/${gameweek}/picks/`)) as {
      active_chip: string | null;
      entry_history: { bank: number; value: number };
      picks: RawPick[];
    };
    return picksData;
  });

  const sample = squads.length;
  if (sample === 0) throw new Error("No elite squads fetched");

  const owned = new Map<number, { own: number; start: number; cap: number }>();
  const formations: Record<string, number> = {};
  const chipCounts: Record<string, number> = {};
  let bankSum = 0;
  let valueSum = 0;

  for (const squad of squads) {
    bankSum += squad.entry_history.bank;
    valueSum += squad.entry_history.value;
    if (squad.active_chip) {
      chipCounts[squad.active_chip] = (chipCounts[squad.active_chip] ?? 0) + 1;
    }

    let def = 0,
      mid = 0,
      fwd = 0;
    for (const p of squad.picks) {
      const rec = owned.get(p.element) ?? { own: 0, start: 0, cap: 0 };
      rec.own += 1;
      if (p.multiplier > 0) {
        rec.start += 1;
        if (p.element_type === 2) def += 1;
        if (p.element_type === 3) mid += 1;
        if (p.element_type === 4) fwd += 1;
      }
      if (p.is_captain) rec.cap += 1;
      owned.set(p.element, rec);
    }
    const formation = `${def}-${mid}-${fwd}`;
    formations[formation] = (formations[formation] ?? 0) + 1;
  }

  const players: ElitePlayerStat[] = Array.from(owned.entries())
    .map(([id, s]) => ({
      id,
      elitePct: Math.round((s.own / sample) * 100),
      startPct: Math.round((s.start / sample) * 100),
      captainPct: Math.round((s.cap / sample) * 100),
    }))
    .filter((p) => p.elitePct >= 4) // drop one-off punts
    .sort((a, b) => b.elitePct - a.elitePct);

  const data: EliteSnapshotData = {
    gameweek,
    sample,
    players,
    formations,
    chipCounts,
    avgBank: Math.round((bankSum / sample) * 10) / 100,
    avgTeamValue: Math.round((valueSum / sample) * 10) / 100,
  };

  await prisma.eliteSnapshot.upsert({
    where: { gameweek },
    update: { sample, data: data as object },
    create: { gameweek, sample, data: data as object },
  });

  return data;
}

/** Read the snapshot for a gameweek (latest available at or below it). Null if none built yet. */
export async function getEliteSnapshot(gameweek: number): Promise<EliteSnapshotData | null> {
  const row = await prisma.eliteSnapshot.findFirst({
    where: { gameweek: { lte: gameweek } },
    orderBy: { gameweek: "desc" },
  });
  return row ? (row.data as unknown as EliteSnapshotData) : null;
}

// ---------- The deterministic scoring engine ----------

type DbPlayer = {
  id: number;
  webName: string;
  elementType: number;
  nowCost: number;
  form: number | null;
  epNext: number | null;
  pointsPerGame: number | null;
  selectedByPercent: number | null;
  minutes: number;
  chanceOfPlayingNext: number | null;
  team: { name: string; shortName: string };
};

const POSITIONS = ["GK", "DEF", "MID", "FWD"] as const;

function clamp(v: number, lo = 0, hi = 1): number {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Score a player 0-100. Weights (sum 100):
 *  - 30 elite conviction (what the world's best actually own/start)
 *  - 20 form
 *  - 15 expected points next GW
 *  - 15 nailedness (minutes share + availability flag)
 *  - 10 points per game (season-long quality)
 *  - 10 value (points per £)
 * Fixture ease is applied as a +/-5 adjustment when fixture data exists.
 */
export function scorePlayer(
  p: DbPlayer,
  elite: ElitePlayerStat | undefined,
  fixtureEase: number | null, // 0..1 (1 = easiest run), null when no fixtures (off-season)
): { score: number; reasons: string[] } {
  const reasons: string[] = [];

  const elitePct = elite?.elitePct ?? 0;
  const captainPct = elite?.captainPct ?? 0;
  const ownership = p.selectedByPercent ?? 0;

  const eliteScore = clamp(elitePct / 80); // 80%+ elite ownership = max conviction
  const formScore = clamp((p.form ?? 0) / 8);
  const epScore = clamp((p.epNext ?? 0) / 8);
  const nailedScore =
    clamp(p.minutes / 2800) *
    (p.chanceOfPlayingNext === null ? 1 : clamp(p.chanceOfPlayingNext / 100));
  const ppgScore = clamp((p.pointsPerGame ?? 0) / 6.5);
  const price = p.nowCost / 10;
  const valueScore = clamp((p.pointsPerGame ?? 0) / Math.max(price, 3.8) / 0.85);

  let score =
    30 * eliteScore +
    20 * formScore +
    15 * epScore +
    15 * nailedScore +
    10 * ppgScore +
    10 * valueScore;

  if (fixtureEase !== null) {
    score += (fixtureEase - 0.5) * 10; // -5..+5
  }

  // Reasons — human-readable, deterministic.
  if (elitePct >= 60) reasons.push(`${elitePct}% of the world's top 50 own him`);
  else if (elitePct >= 25) reasons.push(`${elitePct}% elite ownership`);
  if (captainPct >= 20) reasons.push(`${captainPct}% of elites captained him`);
  const eliteEdge = elitePct - ownership;
  if (eliteEdge >= 25) reasons.push(`elites back him far more than the crowd (+${Math.round(eliteEdge)}%)`);
  if ((p.form ?? 0) >= 6) reasons.push(`red-hot form (${p.form})`);
  if ((p.epNext ?? 0) >= 5) reasons.push(`projects ${p.epNext} pts next GW`);
  if (p.minutes >= 2800) reasons.push("nailed starter");
  if (p.chanceOfPlayingNext !== null && p.chanceOfPlayingNext < 75)
    reasons.push(`⚠ availability ${p.chanceOfPlayingNext}%`);
  if (valueScore >= 0.85) reasons.push(`great value at £${price.toFixed(1)}m`);

  return { score: Math.round(clamp(score, 0, 100) * 10) / 10, reasons };
}

/**
 * Rank all players with the engine. Pure DB + snapshot — no AI involved.
 */
export async function rankPlayers(options?: {
  position?: (typeof POSITIONS)[number];
  maxOwnership?: number; // for differential hunting
  limit?: number;
  gameweek?: number;
}): Promise<PlayerVerdict[]> {
  const gw =
    options?.gameweek ??
    (await prisma.gameweek.findFirst({ where: { isCurrent: true } }))?.id ??
    38;

  const [snapshot, players] = await Promise.all([
    getEliteSnapshot(gw),
    prisma.player.findMany({
      where: { minutes: { gt: 400 } },
      include: { team: true },
    }) as Promise<DbPlayer[]>,
  ]);

  const eliteById = new Map((snapshot?.players ?? []).map((p) => [p.id, p]));

  const verdicts: PlayerVerdict[] = players
    .filter((p) => {
      if (options?.position && POSITIONS[p.elementType - 1] !== options.position) return false;
      if (
        options?.maxOwnership !== undefined &&
        (p.selectedByPercent ?? 0) > options.maxOwnership
      )
        return false;
      return true;
    })
    .map((p) => {
      const elite = eliteById.get(p.id);
      const { score, reasons } = scorePlayer(p, elite, null);
      return {
        id: p.id,
        name: p.webName,
        position: POSITIONS[p.elementType - 1],
        team: p.team.shortName,
        price: p.nowCost / 10,
        score,
        elitePct: elite?.elitePct ?? 0,
        captainPct: elite?.captainPct ?? 0,
        ownership: p.selectedByPercent ?? 0,
        eliteEdge: (elite?.elitePct ?? 0) - (p.selectedByPercent ?? 0),
        form: p.form ?? 0,
        epNext: p.epNext ?? 0,
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score);

  return verdicts.slice(0, options?.limit ?? 25);
}

/**
 * Compare a user's squad against the elite template — deterministic facts the
 * AI (or the UI directly) can use: template alignment, missing template
 * players, captaincy alignment.
 */
export async function analyzeSquadVsElite(
  playerIds: number[],
  captainId: number | null,
  gameweek: number,
): Promise<{
  snapshot: EliteSnapshotData | null;
  templateAlignmentPct: number;
  ownedTemplate: Array<{ id: number; name: string; elitePct: number }>;
  missingTemplate: Array<{ id: number; name: string; elitePct: number; captainPct: number }>;
  eliteCaptain: { name: string; captainPct: number } | null;
  userCaptainEliteCapPct: number;
}> {
  const snapshot = await getEliteSnapshot(gameweek);
  if (!snapshot) {
    return {
      snapshot: null,
      templateAlignmentPct: 0,
      ownedTemplate: [],
      missingTemplate: [],
      eliteCaptain: null,
      userCaptainEliteCapPct: 0,
    };
  }

  const template = snapshot.players.filter((p) => p.elitePct >= 50);
  const names = new Map(
    (
      await prisma.player.findMany({
        where: { id: { in: snapshot.players.map((p) => p.id) } },
        select: { id: true, webName: true },
      })
    ).map((p) => [p.id, p.webName]),
  );

  const userSet = new Set(playerIds);
  const ownedTemplate = template
    .filter((p) => userSet.has(p.id))
    .map((p) => ({ id: p.id, name: names.get(p.id) ?? `#${p.id}`, elitePct: p.elitePct }));
  const missingTemplate = template
    .filter((p) => !userSet.has(p.id))
    .slice(0, 6)
    .map((p) => ({
      id: p.id,
      name: names.get(p.id) ?? `#${p.id}`,
      elitePct: p.elitePct,
      captainPct: p.captainPct,
    }));

  const topCap = [...snapshot.players].sort((a, b) => b.captainPct - a.captainPct)[0];
  const userCapStat = captainId ? snapshot.players.find((p) => p.id === captainId) : undefined;

  return {
    snapshot,
    templateAlignmentPct: template.length
      ? Math.round((ownedTemplate.length / template.length) * 100)
      : 0,
    ownedTemplate,
    missingTemplate,
    eliteCaptain: topCap
      ? { name: names.get(topCap.id) ?? `#${topCap.id}`, captainPct: topCap.captainPct }
      : null,
    userCaptainEliteCapPct: userCapStat?.captainPct ?? 0,
  };
}
