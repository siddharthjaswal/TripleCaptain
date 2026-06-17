import { prisma } from "../prisma";

/**
 * Deterministic team strength ratings from historical match results.
 * Produces, per team (stable code):
 *  - Elo (chronological, home-adjusted, goal-diff weighted)
 *  - home/away attack & defence strengths (Dixon-Coles style, recency-decayed)
 * plus league baseline goal rates the Poisson predictor needs.
 * No AI — pure maths over HistoricalMatch.
 */

export type TeamRatings = {
  leagueAvgHomeGoals: number;
  leagueAvgAwayGoals: number;
  teams: Map<
    number,
    {
      code: number;
      elo: number;
      attackHome: number;
      attackAway: number;
      defenceHome: number; // goals conceded at home, normalised
      defenceAway: number;
      games: number;
    }
  >;
};

const HALF_LIFE_YEARS = 1.6;
const NOW = Date.now();

function recencyWeight(kickoff: Date | null): number {
  if (!kickoff) return 0.4;
  const ageYears = (NOW - kickoff.getTime()) / (365.25 * 24 * 3600 * 1000);
  return Math.pow(0.5, Math.max(0, ageYears) / HALF_LIFE_YEARS);
}

export type Match = {
  season: string;
  event: number;
  homeCode: number;
  awayCode: number;
  homeGoals: number;
  awayGoals: number;
  kickoff: Date | null;
};

/** Chronological order: by kickoff when present, else season+event. */
function chronoSort(a: Match, b: Match): number {
  if (a.kickoff && b.kickoff) return a.kickoff.getTime() - b.kickoff.getTime();
  if (a.season !== b.season) return a.season.localeCompare(b.season);
  return a.event - b.event;
}

export async function computeTeamRatings(persist = true): Promise<TeamRatings> {
  const matches = (await prisma.historicalMatch.findMany()) as Match[];
  const ratings = buildRatings(matches);
  if (persist && ratings.teams.size > 0) await persistRatings(ratings.teams);
  return ratings;
}

// Request-time memo (ratings rarely change; full recompute is cheap but we
// avoid re-reading every request). 1h TTL.
let _memo: { at: number; ratings: TeamRatings } | null = null;
export async function getRatings(): Promise<TeamRatings> {
  if (_memo && Date.now() - _memo.at < 3600_000) return _memo.ratings;
  const matches = (await prisma.historicalMatch.findMany()) as Match[];
  const ratings = buildRatings(matches);
  _memo = { at: Date.now(), ratings };
  return ratings;
}

/** Pure: build ratings from an explicit match list (used for train/test validation). */
export function buildRatings(matches: Match[]): TeamRatings {
  if (matches.length === 0) {
    return { leagueAvgHomeGoals: 1.5, leagueAvgAwayGoals: 1.15, teams: new Map() };
  }

  // ---- League baselines (recency-weighted) ----
  let whg = 0,
    wag = 0,
    wsum = 0;
  for (const m of matches) {
    const w = recencyWeight(m.kickoff);
    whg += m.homeGoals * w;
    wag += m.awayGoals * w;
    wsum += w;
  }
  const leagueAvgHomeGoals = whg / wsum;
  const leagueAvgAwayGoals = wag / wsum;

  // ---- Per-team weighted goal rates ----
  type Acc = {
    hsFor: number; hsAg: number; hW: number;
    asFor: number; asAg: number; aW: number;
  };
  const acc = new Map<number, Acc>();
  const ensure = (c: number) =>
    acc.get(c) ?? acc.set(c, { hsFor: 0, hsAg: 0, hW: 0, asFor: 0, asAg: 0, aW: 0 }).get(c)!;

  for (const m of matches) {
    const w = recencyWeight(m.kickoff);
    const h = ensure(m.homeCode);
    const a = ensure(m.awayCode);
    h.hsFor += m.homeGoals * w; h.hsAg += m.awayGoals * w; h.hW += w;
    a.asFor += m.awayGoals * w; a.asAg += m.homeGoals * w; a.aW += w;
  }

  // ---- Elo (chronological) ----
  const elo = new Map<number, number>();
  const getElo = (c: number) => elo.get(c) ?? 1500;
  const K = 20;
  const HOME_ELO = 65;
  for (const m of [...matches].sort(chronoSort)) {
    const rh = getElo(m.homeCode) + HOME_ELO;
    const ra = getElo(m.awayCode);
    const expH = 1 / (1 + Math.pow(10, (ra - rh) / 400));
    const resH = m.homeGoals > m.awayGoals ? 1 : m.homeGoals === m.awayGoals ? 0.5 : 0;
    const gd = Math.abs(m.homeGoals - m.awayGoals);
    const mult = Math.log(gd + 1) * (2.2 / (Math.abs(rh - ra) * 0.001 + 2.2));
    const delta = K * Math.max(1, mult) * (resH - expH);
    elo.set(m.homeCode, getElo(m.homeCode) + delta);
    elo.set(m.awayCode, getElo(m.awayCode) - delta);
  }

  const teams: TeamRatings["teams"] = new Map();
  for (const [code, x] of acc) {
    const attackHome = x.hW > 0 ? x.hsFor / x.hW / leagueAvgHomeGoals : 1;
    const defenceHome = x.hW > 0 ? x.hsAg / x.hW / leagueAvgAwayGoals : 1;
    const attackAway = x.aW > 0 ? x.asFor / x.aW / leagueAvgAwayGoals : 1;
    const defenceAway = x.aW > 0 ? x.asAg / x.aW / leagueAvgHomeGoals : 1;
    teams.set(code, {
      code,
      elo: getElo(code),
      attackHome: clampStrength(attackHome),
      attackAway: clampStrength(attackAway),
      defenceHome: clampStrength(defenceHome),
      defenceAway: clampStrength(defenceAway),
      games: Math.round(x.hW + x.aW),
    });
  }

  return { leagueAvgHomeGoals, leagueAvgAwayGoals, teams };
}

function clampStrength(s: number): number {
  if (!Number.isFinite(s) || s <= 0) return 1;
  return Math.min(2.5, Math.max(0.35, s));
}

async function persistRatings(teams: TeamRatings["teams"]): Promise<void> {
  // Map code -> current name/short from synced Team table (fallback to code).
  const dbTeams = await prisma.team.findMany();
  const nameByCode = new Map(dbTeams.map((t) => [t.code, { name: t.name, short: t.shortName }]));
  for (const t of teams.values()) {
    const meta = nameByCode.get(t.code) ?? { name: `Team ${t.code}`, short: String(t.code) };
    await prisma.teamRating.upsert({
      where: { teamCode: t.code },
      update: {
        name: meta.name,
        shortName: meta.short,
        elo: Math.round(t.elo),
        attackStrength: round2((t.attackHome + t.attackAway) / 2),
        defenceStrength: round2((t.defenceHome + t.defenceAway) / 2),
        matchesRated: t.games,
      },
      create: {
        teamCode: t.code,
        name: meta.name,
        shortName: meta.short,
        elo: Math.round(t.elo),
        attackStrength: round2((t.attackHome + t.attackAway) / 2),
        defenceStrength: round2((t.defenceHome + t.defenceAway) / 2),
        matchesRated: t.games,
      },
    });
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
