import { prisma } from "@/lib/prisma";
import type { EngineFixture } from "@/lib/data/types";
import { getRatings, type TeamRatings } from "./ratings";
import { predictMatch } from "./predict";

/**
 * Custom Fixture Difficulty Rating (FDR) derived from our own team ratings,
 * not FPL's static 1-5 numbers. Difficulty is split into an attacking view
 * (how hard it is for this club to score) and a defensive view (how hard it is
 * to keep a clean sheet), each mapped onto a 1-5 scale where 1 is easiest.
 * The Poisson predictor supplies win / clean-sheet odds. Pure maths — no AI,
 * and off-season safe (no scheduled fixtures => empty, never throws).
 */

/** Neutral strength when a team is unknown to the ratings (league-average). */
const NEUTRAL_STRENGTH = 1;
/** Neutral FDR used when a matchup can't be modelled. */
const NEUTRAL_FDR = 3;
const DEFAULT_HORIZON = 5;

/**
 * Map a Dixon-Coles style strength multiplier (≈0.35–2.5, where 1 = league
 * average) onto a 1-5 difficulty band. Higher opponent strength => higher
 * difficulty. Fractional values are intentional so callers can interpolate
 * colours / sort smoothly.
 */
function strengthToFdr(strength: number): number {
  const s = Number.isFinite(strength) && strength > 0 ? strength : NEUTRAL_STRENGTH;
  // 1.0 (average) → 3.0; ~0.55 → 1; ~1.9 → 5. Linear around the mean.
  const fdr = 3 + (s - 1) * (2 / 0.9);
  return clamp(fdr, 1, 5);
}

/**
 * Custom difficulty for a single matchup using our ratings + Poisson predictor.
 *
 * - `attackFdr` reflects how hard the opponent's defence makes scoring.
 * - `fdr` blends the attacking and defensive difficulty into one overall number.
 * - `cleanSheetPct` / `winPct` come from `predictMatch` (probabilities 0-100).
 *
 * Falls back to a neutral, finite result when either club is missing from the
 * ratings or the predictor can't model the fixture (off-season / new teams).
 */
export function fixtureDifficulty(
  forCode: number,
  oppCode: number,
  isHome: boolean,
  ratings: TeamRatings,
): { fdr: number; attackFdr: number; cleanSheetPct: number; winPct: number } {
  const opp = ratings.teams.get(oppCode);

  // Attack difficulty: opponent's defensive solidity in the venue they're in.
  // If `for` is at home, the opponent defends away, and vice-versa.
  const oppDefence = opp ? (isHome ? opp.defenceAway : opp.defenceHome) : NEUTRAL_STRENGTH;
  // Defensive difficulty (for OUR clean sheet): opponent's attacking threat.
  const oppAttack = opp ? (isHome ? opp.attackAway : opp.attackHome) : NEUTRAL_STRENGTH;

  // Lower opponent defence number = leakier defence = EASIER to score, so a low
  // strength must produce a low FDR — `strengthToFdr` already maps that way.
  const attackFdr = strengthToFdr(oppDefence);
  const defenceFdr = strengthToFdr(oppAttack);

  // Overall difficulty blends both, leaning slightly on the attacking view
  // since that drives most FPL returns.
  const fdr = clamp(attackFdr * 0.55 + defenceFdr * 0.45, 1, 5);

  // Win / clean-sheet odds from the Poisson model (already 0-100).
  const forecast = isHome
    ? predictMatch(forCode, oppCode, ratings)
    : predictMatch(oppCode, forCode, ratings);

  let winPct = NEUTRAL_WIN;
  let cleanSheetPct = NEUTRAL_CS;
  if (forecast) {
    winPct = isHome ? forecast.pHome : forecast.pAway;
    cleanSheetPct = isHome ? forecast.homeCsPct : forecast.awayCsPct;
  }

  return {
    fdr: round1(fdr),
    attackFdr: round1(attackFdr),
    cleanSheetPct: round1(cleanSheetPct),
    winPct: round1(winPct),
  };
}

/** League-average fallbacks for odds when the predictor can't run. */
const NEUTRAL_WIN = 40;
const NEUTRAL_CS = 30;

/**
 * Upcoming fixtures for a club (by stable team code) as `EngineFixture[]`.
 *
 * Reads unfinished `Fixture` rows whose home or away team has the given code,
 * orders them chronologically, and decorates each with our custom difficulty
 * via {@link fixtureDifficulty}. Off-season (no unfinished fixtures) yields an
 * empty array. Never throws.
 */
export async function clubFixtures(
  teamCode: number,
  horizon: number = DEFAULT_HORIZON,
): Promise<EngineFixture[]> {
  const take = Math.max(1, Math.floor(horizon));

  // Resolve the DB team id(s) for this stable code (codes are stable across
  // seasons; ids occasionally are not, so match on code).
  const teams = await prisma.team.findMany({ where: { code: teamCode } });
  if (teams.length === 0) return [];
  const teamIds = teams.map((t) => t.id);

  const rows = await prisma.fixture.findMany({
    where: {
      finished: false,
      OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
    },
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ gameweekId: "asc" }, { kickoffTime: "asc" }],
    take,
  });
  if (rows.length === 0) return [];

  const ratings = await getRatings();

  return rows.map((f) => {
    const isHome = teamIds.includes(f.homeTeamId);
    const opp = isHome ? f.awayTeam : f.homeTeam;
    const { fdr, attackFdr, cleanSheetPct, winPct } = fixtureDifficulty(
      teamCode,
      opp.code,
      isHome,
      ratings,
    );
    return {
      event: f.gameweekId ?? 0,
      opponentCode: opp.code,
      opponentShort: opp.shortName,
      isHome,
      fdr,
      attackFdr,
      cleanSheetPct,
      winPct,
    } satisfies EngineFixture;
  });
}

/**
 * Difficulty (1-5) for a hypothetical matchup with no scheduled fixture, from
 * the pure Elo gap plus a home bump. Used by tools that compare a club against
 * an arbitrary opponent (e.g. "what if they faced X"). Returns a neutral 3 when
 * either side is unknown.
 */
export function baselineDifficulty(
  forCode: number,
  oppCode: number,
  isHome: boolean,
  ratings: TeamRatings,
): number {
  const f = ratings.teams.get(forCode);
  const o = ratings.teams.get(oppCode);
  if (!f || !o) return NEUTRAL_FDR;

  // Positive gap = `for` is stronger = easier fixture. Mirror predict.ts's home
  // bump (+65 Elo) so home/away are treated consistently.
  const gap = f.elo + (isHome ? 65 : -65) - o.elo;

  // A ~400-Elo edge moves us a full 2 bands off neutral (3 → 1 or 5).
  const fdr = 3 - (gap / 400) * 2;
  return round1(clamp(fdr, 1, 5));
}

/** Brand colours for the difficulty scale (1 easiest → 5 hardest). */
const GOOD = { r: 0x04, g: 0xf5, b: 0xff }; // teal #04f5ff
const NEUTRAL = { r: 0x8a, g: 0x8f, b: 0x98 }; // muted grey
const BAD = { r: 0xff, g: 0x2d, b: 0x78 }; // magenta #ff2d78

/**
 * Hex colour for an FDR value: teal for easy (1-2), muted grey at neutral (3),
 * magenta for hard (4-5), interpolated for fractional values in between.
 */
export function fdrColor(fdr: number): string {
  const v = clamp(Number.isFinite(fdr) ? fdr : NEUTRAL_FDR, 1, 5);
  if (v <= 3) return toHex(lerp(GOOD, NEUTRAL, (v - 1) / 2));
  return toHex(lerp(NEUTRAL, BAD, (v - 3) / 2));
}

type RGB = { r: number; g: number; b: number };

function lerp(a: RGB, b: RGB, t: number): RGB {
  const k = clamp(t, 0, 1);
  return {
    r: Math.round(a.r + (b.r - a.r) * k),
    g: Math.round(a.g + (b.g - a.g) * k),
    b: Math.round(a.b + (b.b - a.b) * k),
  };
}

function toHex({ r, g, b }: RGB): string {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
