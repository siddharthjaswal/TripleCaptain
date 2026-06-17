// NOTE: no "server-only" import — this module is shared by the Next.js server
// AND standalone scripts (e.g. scripts/*.ts via tsx), mirroring lib/fpl/brain.ts.
import { prisma } from "../prisma";
import { getRatings } from "./ratings";
import {
  positionOf,
  type EngineFixture,
  type EnginePlayer,
  type PlayerSeasonHistory,
  type Position,
  type ProjectionResult,
} from "./types";

/**
 * The CUSTOM expected-points (xP) model — our own projection that replaces
 * FPL's ep_next. Pure deterministic maths over the player's minutes, per-90
 * attacking output (regressed toward position priors), availability and an
 * optional fixture. No AI, no randomness: any phrasing variety is seeded by
 * stable player ids, never Math.random.
 *
 * Off-season safe: with no fixture and no history we still return a sane,
 * neutral projection (appearance + regressed priors) and never throw.
 */

// ---------- Constants ----------

/** Most-recent finished season label in the history table. */
const LATEST_SEASON = "2025/26";

/** A full season of regular minutes (≈ 38 starts). */
const FULL_SEASON_MINUTES = 38 * 90;

/** FPL points per goal by position. */
const GOAL_PTS: Record<Position, number> = { GK: 6, DEF: 6, MID: 5, FWD: 4 };

/** FPL clean-sheet points by position (needs ≥60 mins). */
const CS_PTS: Record<Position, number> = { GK: 4, DEF: 4, MID: 1, FWD: 0 };

/** FPL points per assist (all positions). */
const ASSIST_PTS = 3;

/**
 * Per-90 attacking priors (xG90, xA90) the player is regressed toward when the
 * minutes sample is small. Deliberately modest so unproven players don't get
 * inflated. Derived from typical Premier League per-position output.
 */
const POSITION_PRIOR: Record<Position, { xg90: number; xa90: number }> = {
  GK: { xg90: 0.0, xa90: 0.01 },
  DEF: { xg90: 0.05, xa90: 0.06 },
  MID: { xg90: 0.16, xa90: 0.14 },
  FWD: { xg90: 0.4, xa90: 0.12 },
};

/** Minutes that buy full trust in the player's own rates (vs the prior). */
const SHRINKAGE_MINUTES = 1800;

/** Default club clean-sheet rate (%) when no fixture/club signal is available. */
const DEFAULT_CS_PCT = 33;

/** ~90% scaling so per-90 output reads as a single 90-minute appearance. */
const MATCH_MINUTES_SCALE = 0.9;

// ---------- Small pure helpers ----------

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function clamp01(n: number): number {
  return clamp(n, 0, 1);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Safe divide that returns `fallback` instead of NaN/Infinity. */
function safeDiv(a: number, b: number, fallback = 0): number {
  return b > 0 && Number.isFinite(a) ? a / b : fallback;
}

/** Coerce a possibly-null/NaN number to a finite default. */
function num(n: number | null | undefined, fallback = 0): number {
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

// ---------- Projection internals ----------

/** Pick the most relevant history rows: latest finished season + career totals. */
function summariseHistory(history: PlayerSeasonHistory[]): {
  latest: PlayerSeasonHistory | null;
  careerMinutes: number;
  careerXg90: number;
  careerXa90: number;
  sampleMinutes: number;
  startsRatio: number | null;
} {
  if (history.length === 0) {
    return {
      latest: null,
      careerMinutes: 0,
      careerXg90: 0,
      careerXa90: 0,
      sampleMinutes: 0,
      startsRatio: null,
    };
  }

  const latest =
    history.find((h) => h.season === LATEST_SEASON) ??
    [...history].sort((a, b) => a.season.localeCompare(b.season)).at(-1) ??
    null;

  let careerMinutes = 0;
  let careerXg = 0;
  let careerXa = 0;
  for (const h of history) {
    const mins = Math.max(0, num(h.minutes));
    careerMinutes += mins;
    careerXg += Math.max(0, num(h.xG));
    careerXa += Math.max(0, num(h.xA));
  }

  const careerXg90 = safeDiv(careerXg * 90, careerMinutes);
  const careerXa90 = safeDiv(careerXa * 90, careerMinutes);

  // Weight the latest season twice as heavily as the rest of the career for the
  // shrinkage sample (recency matters), but only when it has real minutes.
  const latestMins = latest ? Math.max(0, num(latest.minutes)) : 0;
  const sampleMinutes = latestMins * 2 + (careerMinutes - latestMins);

  // starts / (38) as a rough "how often did he start" signal from latest season.
  const startsRatio =
    latest && latest.starts > 0 ? clamp01(safeDiv(num(latest.starts), 38)) : null;

  return { latest, careerMinutes, careerXg90, careerXa90, sampleMinutes, startsRatio };
}

/**
 * Blend the player's own per-90 rate with a position prior, trusting the player
 * more as the minutes sample grows (Bayesian-style shrinkage).
 */
function regressRate(playerRate: number, prior: number, sampleMinutes: number): number {
  const trust = clamp01(safeDiv(sampleMinutes, SHRINKAGE_MINUTES, 0));
  return playerRate * trust + prior * (1 - trust);
}

/**
 * Map a fixture's attack difficulty (1 easy .. 5 hard) onto an attacking
 * multiplier in ~[1.25 .. 0.75]. 3 (neutral) → 1.0. No fixture → 1.0.
 */
function fixtureAttackMult(fixture: EngineFixture | undefined): number {
  if (!fixture) return 1.0;
  const fdr = clamp(num(fixture.attackFdr, 3), 1, 5);
  return clamp(1.0 + (3 - fdr) * 0.125, 0.75, 1.25);
}

/** Resolve the club clean-sheet probability (0..1) from fixture or opts/default. */
function cleanSheetProb(
  fixture: EngineFixture | undefined,
  clubCleanSheetPct: number | undefined,
): number {
  if (fixture && Number.isFinite(fixture.cleanSheetPct)) {
    return clamp01(fixture.cleanSheetPct / 100);
  }
  return clamp01(num(clubCleanSheetPct, DEFAULT_CS_PCT) / 100);
}

/** Pick an archetype from the projection's shape. Deterministic heuristics. */
function classify(args: {
  position: Position;
  startProb: number;
  xPoints: number;
  ceiling: number;
  floor: number;
  attackPts: number;
}): ProjectionResult["archetype"] {
  const { startProb, xPoints, ceiling, attackPts } = args;
  if (startProb < 0.6) return "rotation-risk";
  // Explosiveness = how much of the ceiling sits above the expectation.
  const spread = safeDiv(ceiling - xPoints, Math.max(xPoints, 1));
  if (startProb >= 0.85 && attackPts >= 1.6 && spread >= 0.6) return "explosive";
  if (startProb >= 0.9 && spread <= 0.35) return "consistent";
  if (startProb >= 0.92 && attackPts < 1.2) return "nailed";
  return "balanced";
}

/** Build 2-4 short, number-citing reasons (ordered, deterministic). */
function buildReasons(args: {
  startProb: number;
  p60: number;
  xPoints: number;
  goalPts: number;
  assistPts: number;
  csEV: number;
  csProb: number;
  fixtureMult: number;
  fixture: EngineFixture | undefined;
  position: Position;
  value: number;
  price: number;
}): string[] {
  const {
    startProb,
    xPoints,
    goalPts,
    assistPts,
    csEV,
    csProb,
    fixtureMult,
    fixture,
    position,
    value,
    price,
  } = args;
  const reasons: string[] = [];

  reasons.push(`projects ${round2(xPoints)} xP`);

  if (startProb < 0.6) reasons.push(`rotation risk — ${Math.round(startProb * 100)}% to start`);
  else if (startProb >= 0.9) reasons.push(`nailed — ${Math.round(startProb * 100)}% to start`);

  const attack = goalPts + assistPts;
  if (attack >= 1.5) reasons.push(`strong returns threat (${round2(attack)} attacking pts)`);

  if (csEV >= 1 && (position === "GK" || position === "DEF")) {
    reasons.push(`${Math.round(csProb * 100)}% clean-sheet shout`);
  }

  if (fixture) {
    if (fixtureMult >= 1.12) reasons.push(`kind fixture vs ${fixture.opponentShort} (FDR ${fixture.attackFdr})`);
    else if (fixtureMult <= 0.88) reasons.push(`tough fixture vs ${fixture.opponentShort} (FDR ${fixture.attackFdr})`);
  }

  if (value >= 0.9 && reasons.length < 4) reasons.push(`great value at £${price.toFixed(1)}m`);

  return reasons.slice(0, 4);
}

// ---------- Public API ----------

/**
 * Project a single player's expected points for one match (or a neutral
 * fixture when none is supplied). Pure: identical inputs → identical output.
 *
 * @param p        the engine player (price, minutes, availability, etc.)
 * @param history  past-season rows for this player (may be empty)
 * @param opts.fixture            the upcoming fixture (omit for off-season neutral)
 * @param opts.clubCleanSheetPct  the club's clean-sheet % (0-100) if known
 */
export function projectPlayer(
  p: EnginePlayer,
  history: PlayerSeasonHistory[],
  opts?: { fixture?: EngineFixture; clubCleanSheetPct?: number },
): ProjectionResult {
  const position = p.position;
  const price = Math.max(num(p.price), 3.8); // FPL floor; guards divide-by-zero
  const fixture = opts?.fixture;

  const hist = summariseHistory(history ?? []);

  // ---- Start probability ----
  // Availability flag (null → fully available), minutes share, latest starts.
  const availability = p.chanceOfPlayingNext === null ? 1 : clamp01(num(p.chanceOfPlayingNext) / 100);
  const minutesShare = clamp01(safeDiv(num(p.minutes), FULL_SEASON_MINUTES));
  const startsSignal = hist.startsRatio ?? minutesShare;
  // Blend minutes share and starts ratio, then gate by availability.
  const baseStart = 0.55 * minutesShare + 0.45 * startsSignal;
  const startProb = clamp01(baseStart * availability);
  // p60 = probability of reaching 60 mins — a slight discount on starting.
  const p60 = clamp01(startProb * 0.92);

  // ---- Attacking per-90 (regressed toward position prior) ----
  const prior = POSITION_PRIOR[position];
  let latestXg90 = 0;
  let latestXa90 = 0;
  if (hist.latest && hist.latest.minutes > 0) {
    latestXg90 = safeDiv(Math.max(0, num(hist.latest.xG)) * 90, num(hist.latest.minutes));
    latestXa90 = safeDiv(Math.max(0, num(hist.latest.xA)) * 90, num(hist.latest.minutes));
  }
  // Prefer the latest season, blended with career to stabilise.
  const ownXg90 = hist.latest ? 0.6 * latestXg90 + 0.4 * hist.careerXg90 : hist.careerXg90;
  const ownXa90 = hist.latest ? 0.6 * latestXa90 + 0.4 * hist.careerXa90 : hist.careerXa90;

  const xg90 = regressRate(ownXg90, prior.xg90, hist.sampleMinutes);
  const xa90 = regressRate(ownXa90, prior.xa90, hist.sampleMinutes);

  // Per-match (~90 min) expected goals/assists, weighted by minutes on pitch.
  const xGoals = xg90 * MATCH_MINUTES_SCALE * p60;
  const xAssists = xa90 * MATCH_MINUTES_SCALE * p60;

  const goalPts = xGoals * GOAL_PTS[position];
  const assistPts = xAssists * ASSIST_PTS;

  // ---- Appearance points ----
  // 2 pts for ≥60 mins (p60), 1 pt for the slice that starts but doesn't reach 60.
  const appearancePts = 2 * p60 + 1 * Math.max(0, startProb - p60);

  // ---- Clean-sheet EV ----
  const csProb = cleanSheetProb(fixture, opts?.clubCleanSheetPct);
  const cleanSheetEV = CS_PTS[position] * csProb * p60;

  // ---- Bonus EV (monotonic in attacking output, capped ~1.2) ----
  const bonusEV = clamp((goalPts + assistPts) * 0.45, 0, 1.2);

  // ---- Fixture multiplier (attacking output only) ----
  const fixtureMult = fixtureAttackMult(fixture);

  // ---- Expected points ----
  const attackTotal = goalPts + assistPts + bonusEV;
  const xPoints = round2(appearancePts + attackTotal * fixtureMult + cleanSheetEV);

  // ---- Ceiling / floor / captain score ----
  // Ceiling: a multi-return upside game (≈2.4× attacking output) + a haul bonus.
  const haulBonus = clamp((goalPts + assistPts) * 0.6, 0, 3);
  const ceiling = round2(
    appearancePts + (goalPts + assistPts) * fixtureMult * 2.4 + haulBonus + cleanSheetEV,
  );
  const floor = round2(appearancePts * 0.8);
  // Captaincy desirability: ceiling-weighted, nudged by fixture kindness.
  const capScore = round2((0.6 * ceiling + 0.4 * xPoints) * (0.85 + 0.15 * fixtureMult));

  // ---- Value & archetype ----
  const value = round2(safeDiv(xPoints, price));
  const archetype = classify({
    position,
    startProb,
    xPoints,
    ceiling,
    floor,
    attackPts: goalPts + assistPts,
  });

  const reasons = buildReasons({
    startProb,
    p60,
    xPoints,
    goalPts,
    assistPts,
    csEV: cleanSheetEV,
    csProb,
    fixtureMult,
    fixture,
    position,
    value,
    price,
  });

  return {
    id: p.id,
    name: p.name,
    position,
    teamShort: p.teamShort,
    price: round2(p.price),
    xPoints,
    ceiling,
    floor,
    capScore,
    startProb: round2(startProb),
    value,
    archetype,
    reasons,
  };
}

// ---------- Batch projection (DB-backed) ----------

type DbPlayerRow = {
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
  team: { code: number; shortName: string };
};

type HistoryRow = {
  playerId: number;
  season: string;
  minutes: number;
  starts: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  xG: number;
  xA: number;
  points: number;
  ppg: number;
};

/** Convert a Prisma Player row into the engine's EnginePlayer shape. */
function toEnginePlayer(row: DbPlayerRow): EnginePlayer {
  return {
    id: row.id,
    code: null,
    name: row.webName,
    position: positionOf(row.elementType),
    teamCode: row.team.code,
    teamShort: row.team.shortName,
    price: row.nowCost / 10,
    form: num(row.form),
    pointsPerGame: num(row.pointsPerGame),
    minutes: row.minutes,
    selectedByPercent: num(row.selectedByPercent),
    chanceOfPlayingNext: row.chanceOfPlayingNext,
    epNextFpl: row.epNext,
  };
}

/** Convert a HistoricalPlayerSeason row into the shared PlayerSeasonHistory. */
function toSeasonHistory(row: HistoryRow): PlayerSeasonHistory {
  return {
    season: row.season,
    minutes: row.minutes,
    starts: row.starts,
    goals: row.goals,
    assists: row.assists,
    cleanSheets: row.cleanSheets,
    xG: row.xG,
    xA: row.xA,
    points: row.points,
    ppg: row.ppg,
  };
}

/**
 * Resolve the event id to project for: current GW, else next GW, else 0.
 * In the off-season neither is_current nor is_next may be set → 0.
 */
async function resolveEvent(): Promise<number> {
  const current = await prisma.gameweek.findFirst({ where: { isCurrent: true } });
  if (current) return current.id;
  const next = await prisma.gameweek.findFirst({ where: { isNext: true } });
  if (next) return next.id;
  return 0;
}

/**
 * Map every team's clean-sheet probability (0-100) for the chosen event from
 * the deterministic match predictor. Returns an empty map off-season (no
 * unfinished fixtures), so projections fall back to the neutral default.
 */
async function buildClubCleanSheetPct(): Promise<Map<number, number>> {
  const out = new Map<number, number>();
  // Off-season safe: lazily import the predictor only when fixtures exist.
  const upcoming = await prisma.fixture.findMany({
    where: { finished: false },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { kickoffTime: "asc" },
  });
  if (upcoming.length === 0) return out;

  const ratings = await getRatings();
  const { predictMatch } = await import("./predict");
  for (const fx of upcoming) {
    const homeCode = fx.homeTeam.code;
    const awayCode = fx.awayTeam.code;
    const forecast = predictMatch(homeCode, awayCode, ratings);
    if (!forecast) continue;
    // Only record the first (soonest) fixture per club.
    if (!out.has(homeCode)) out.set(homeCode, forecast.homeCsPct);
    if (!out.has(awayCode)) out.set(awayCode, forecast.awayCsPct);
  }
  return out;
}

/**
 * Project every player in the DB. Reads Player + HistoricalPlayerSeason and
 * (when fixtures exist) the team ratings for clean-sheet odds. When
 * `opts.persist` is set, upserts a PlayerProjection row per player.
 *
 * Off-season safe: with no fixtures, every player gets a neutral projection
 * (no fixture multiplier, default clean-sheet rate) and nothing throws.
 */
export async function projectAllPlayers(opts?: {
  event?: number;
  persist?: boolean;
}): Promise<ProjectionResult[]> {
  const event = opts?.event ?? (await resolveEvent());

  const [players, histories, clubCsPct] = await Promise.all([
    prisma.player.findMany({
      include: { team: { select: { code: true, shortName: true } } },
    }) as Promise<DbPlayerRow[]>,
    prisma.historicalPlayerSeason.findMany() as Promise<HistoryRow[]>,
    buildClubCleanSheetPct(),
  ]);

  // Group history rows by current-season player id.
  const histByPlayer = new Map<number, PlayerSeasonHistory[]>();
  for (const h of histories) {
    const list = histByPlayer.get(h.playerId);
    const mapped = toSeasonHistory(h);
    if (list) list.push(mapped);
    else histByPlayer.set(h.playerId, [mapped]);
  }

  const results: ProjectionResult[] = players.map((row) => {
    const ep = toEnginePlayer(row);
    const history = histByPlayer.get(row.id) ?? [];
    return projectPlayer(ep, history, {
      clubCleanSheetPct: clubCsPct.get(row.team.code),
    });
  });

  // Deterministic order: highest xP first, ties broken by stable id.
  results.sort((a, b) => b.xPoints - a.xPoints || a.id - b.id);

  if (opts?.persist) {
    for (const r of results) {
      await prisma.playerProjection.upsert({
        where: { playerId_event: { playerId: r.id, event } },
        update: {
          xPoints: r.xPoints,
          capScore: r.capScore,
          ceiling: r.ceiling,
          floor: r.floor,
          archetype: r.archetype,
          reasons: r.reasons,
        },
        create: {
          playerId: r.id,
          event,
          xPoints: r.xPoints,
          capScore: r.capScore,
          ceiling: r.ceiling,
          floor: r.floor,
          archetype: r.archetype,
          reasons: r.reasons,
        },
      });
    }
  }

  return results;
}
