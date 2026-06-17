import { prisma } from "../prisma";
import type { ChipAdvice, ProjectionResult } from "./types";

/**
 * Chip-strategy timing — deterministic heuristics over the fixture calendar and
 * the user's projected squad. No AI: every recommendation is pure maths /
 * lookups, with phrasing seeded only by stable ids (player ids, gameweek
 * numbers) so the output is reproducible.
 *
 * Off-season safe: when no unplayed fixtures exist (the current state of the
 * DB), every chip falls back to generic, low-confidence guidance and a null
 * bestEvent — nothing throws.
 *
 * The four FPL chips we reason about:
 *  - wildcard  ("Wildcard")        — free unlimited transfers; play on a big
 *                                     fixture swing or when the squad is rotten.
 *  - bboost    ("Bench Boost")     — bench scores count; play when the whole
 *                                     squad has favourable / extra fixtures.
 *  - 3xc       ("Triple Captain")  — captain scores ×3; play on the best single
 *                                     fixture for your top captaincy pick.
 *  - freehit   ("Free Hit")        — one-week temporary team; play a blank GW
 *                                     where many of your starters have no game.
 */

/** Stable display labels per chip. */
const CHIP_LABEL: Record<ChipAdvice["chip"], string> = {
  wildcard: "Wildcard",
  bboost: "Bench Boost",
  "3xc": "Triple Captain",
  freehit: "Free Hit",
};

/** Canonical chip order so output is deterministic regardless of usedChips order. */
const CHIP_ORDER: ChipAdvice["chip"][] = [
  "wildcard",
  "bboost",
  "3xc",
  "freehit",
];

/**
 * Alternate names FPL/users give the same chip, normalised so {@link recommendChips}
 * correctly excludes already-played chips no matter the spelling.
 */
const CHIP_ALIASES: Record<string, ChipAdvice["chip"]> = {
  wildcard: "wildcard",
  wc: "wildcard",
  bboost: "bboost",
  benchboost: "bboost",
  bench_boost: "bboost",
  "3xc": "3xc",
  triplecaptain: "3xc",
  triple_captain: "3xc",
  tc: "3xc",
  freehit: "freehit",
  free_hit: "freehit",
  fh: "freehit",
};

/** How many starters in a typical XI — used to judge "many starters miss". */
const STARTER_COUNT = 11;

/**
 * Detect blank and double gameweeks from the fixture calendar.
 *
 * Returns a map of `event → (teamCode → fixtureCount)` covering only *upcoming*
 * (unfinished, gameweek-assigned) fixtures. A team absent from an event's inner
 * map plays zero games (a blank); a count of 2+ is a double gameweek.
 *
 * Off-season (no unfinished fixtures) yields an empty map.
 */
export async function detectBlanksAndDoubles(): Promise<
  Map<number, Map<number, number>>
> {
  const out = new Map<number, Map<number, number>>();

  const fixtures = await prisma.fixture.findMany({
    where: { finished: false, gameweekId: { not: null } },
    include: {
      homeTeam: { select: { code: true } },
      awayTeam: { select: { code: true } },
    },
  });

  for (const f of fixtures) {
    if (f.gameweekId == null) continue;
    const inner = out.get(f.gameweekId) ?? new Map<number, number>();
    bump(inner, f.homeTeam.code);
    bump(inner, f.awayTeam.code);
    out.set(f.gameweekId, inner);
  }

  return out;
}

function bump(m: Map<number, number>, key: number): void {
  m.set(key, (m.get(key) ?? 0) + 1);
}

/**
 * Recommend chip timing for every chip the user has NOT yet played.
 *
 * @param args.usedChips  Chip names already played this season (any spelling).
 * @param args.squad      The user's projected XV (ProjectionResult[]) — optional.
 * @param args.gameweek   The current/next gameweek number — used as the lower
 *                        bound for "upcoming" reasoning; defaults to the DB's
 *                        current GW, then 1.
 * @returns One {@link ChipAdvice} per un-played chip, in canonical chip order.
 */
export async function recommendChips(args: {
  usedChips: string[];
  squad?: ProjectionResult[];
  gameweek?: number;
}): Promise<ChipAdvice[]> {
  const used = new Set(
    args.usedChips
      .map(normaliseChip)
      .filter((c): c is ChipAdvice["chip"] => c !== null),
  );
  const remaining = CHIP_ORDER.filter((c) => !used.has(c));
  if (remaining.length === 0) return [];

  const fromGw = args.gameweek ?? (await resolveCurrentGameweek());
  const calendar = await detectBlanksAndDoubles();

  // Restrict the calendar to events at/after the current GW and sort them.
  const events = [...calendar.keys()]
    .filter((ev) => ev >= fromGw)
    .sort((a, b) => a - b);

  // Resolve the squad's club codes once (squad carries only teamShort).
  const squad = args.squad ?? [];
  const squadCodes =
    squad.length > 0
      ? await resolveSquadCodes(squad)
      : new Map<number, number>();
  // Starters = the 11 highest-xPoints projections (deterministic tiebreak by id).
  const starters = [...squad]
    .sort((a, b) => b.xPoints - a.xPoints || a.id - b.id)
    .slice(0, STARTER_COUNT);
  const starterCodes = starters
    .map((p) => squadCodes.get(p.id))
    .filter((c): c is number => c !== undefined);

  // All distinct club codes across the squad (for whole-squad reasoning).
  const allSquadCodes = dedupe(
    squad
      .map((p) => squadCodes.get(p.id))
      .filter((c): c is number => c !== undefined),
  );

  const ctx: AdviseCtx = {
    events,
    calendar,
    squad,
    squadCodes,
    starters,
    starterCodes,
    allSquadCodes,
  };
  const advice: ChipAdvice[] = [];
  for (const chip of remaining) {
    advice.push(adviseChip(chip, ctx));
  }
  return advice;
}

type AdviseCtx = {
  events: number[];
  calendar: Map<number, Map<number, number>>;
  squad: ProjectionResult[];
  /** player id → club code for the whole squad. */
  squadCodes: Map<number, number>;
  /** Top-11 projections by xPoints. */
  starters: ProjectionResult[];
  /** Resolved club codes for the starters (may contain duplicates). */
  starterCodes: number[];
  /** Distinct club codes across the whole squad. */
  allSquadCodes: number[];
};

/** Dispatch to the per-chip heuristic. */
function adviseChip(chip: ChipAdvice["chip"], ctx: AdviseCtx): ChipAdvice {
  switch (chip) {
    case "bboost":
      return adviseBenchBoost(ctx);
    case "3xc":
      return adviseTripleCaptain(ctx);
    case "freehit":
      return adviseFreeHit(ctx);
    case "wildcard":
    default:
      return adviseWildcard(ctx);
  }
}

/**
 * Bench Boost: best when the whole squad has games — favour the upcoming event
 * where the most of the user's clubs play, rewarding double gameweeks (a club
 * with 2 fixtures counts double).
 */
function adviseBenchBoost(ctx: AdviseCtx): ChipAdvice {
  const base = blank(chip("bboost"));
  if (ctx.events.length === 0) {
    return {
      ...base,
      recommendation:
        "Hold it for a double gameweek when your whole squad plays twice.",
    };
  }
  if (ctx.squad.length === 0) {
    return {
      ...base,
      recommendation:
        "Aim it at a double gameweek — link your squad for a tailored pick.",
    };
  }

  const allCodes = ctx.allSquadCodes;
  let bestEvent: number | null = null;
  let bestGames = -1;
  for (const ev of ctx.events) {
    const counts = ctx.calendar.get(ev) ?? new Map<number, number>();
    const games = allCodes.reduce(
      (sum, code) => sum + (counts.get(code) ?? 0),
      0,
    );
    if (games > bestGames) {
      bestGames = games;
      bestEvent = ev;
    }
  }

  if (bestEvent === null || bestGames <= 0) {
    return {
      ...base,
      recommendation:
        "No favourable Bench Boost window yet — wait for a double gameweek.",
    };
  }

  const playingClubs = countPlayingClubs(ctx.calendar.get(bestEvent), allCodes);
  const doubles = countDoubles(ctx.calendar.get(bestEvent), allCodes);
  const confidence = doubles >= 2 ? "high" : doubles >= 1 ? "medium" : "low";
  const detail =
    doubles >= 1
      ? `${doubles} of your clubs play twice in GW${bestEvent}`
      : `${playingClubs} of your clubs have a fixture in GW${bestEvent}`;
  return {
    ...base,
    recommendation: `Best Bench Boost is GW${bestEvent}: ${detail} — your bench earns too.`,
    bestEvent,
    confidence,
  };
}

/**
 * Triple Captain: aim it at the single best fixture for your top captaincy pick
 * (highest capScore), preferring a gameweek where that player's club plays
 * twice. Phrasing names the player (stable, id-seeded ordering).
 */
function adviseTripleCaptain(ctx: AdviseCtx): ChipAdvice {
  const base = blank(chip("3xc"));
  if (ctx.squad.length === 0) {
    return {
      ...base,
      recommendation:
        "Save it for a premium captain in a double gameweek — link your squad for a name.",
    };
  }

  // Top captaincy pick: highest capScore, deterministic tiebreak by id.
  const top = [...ctx.squad].sort(
    (a, b) => b.capScore - a.capScore || a.id - b.id,
  )[0];

  if (ctx.events.length === 0) {
    return {
      ...base,
      recommendation: `Hold it for ${top.name} in a double gameweek or a soft home fixture.`,
    };
  }

  const topCode = ctx.squadCodes.get(top.id);

  let bestEvent: number | null = null;
  let bestGames = 0;
  if (topCode !== undefined) {
    for (const ev of ctx.events) {
      const games = ctx.calendar.get(ev)?.get(topCode) ?? 0;
      if (games > bestGames) {
        bestGames = games;
        bestEvent = ev;
      }
    }
  }

  if (bestEvent === null) {
    return {
      ...base,
      recommendation: `Time it for ${top.name} once a clear double gameweek appears.`,
    };
  }

  const isDouble = bestGames >= 2;
  const confidence = isDouble ? "high" : "medium";
  const why = isDouble ? "plays twice" : "has a fixture";
  return {
    ...base,
    recommendation: `Triple ${top.name} in GW${bestEvent} — his club ${why} that week.`,
    bestEvent,
    confidence,
  };
}

/**
 * Free Hit: best on a blank gameweek where many of your starters have no game —
 * a one-week patch lets you field a full XI without wrecking your squad.
 */
function adviseFreeHit(ctx: AdviseCtx): ChipAdvice {
  const base = blank(chip("freehit"));
  if (ctx.events.length === 0) {
    return {
      ...base,
      recommendation:
        "Keep it in reserve for a blank gameweek when your starters sit idle.",
    };
  }
  if (ctx.starterCodes.length === 0) {
    return {
      ...base,
      recommendation:
        "Use it on a blank gameweek — link your squad to see exactly which one bites hardest.",
    };
  }

  let bestEvent: number | null = null;
  let mostMissing = 0;
  for (const ev of ctx.events) {
    const counts = ctx.calendar.get(ev);
    if (!counts) continue; // event with no fixture data: skip
    const missing = ctx.starterCodes.filter(
      (code) => (counts.get(code) ?? 0) === 0,
    ).length;
    if (missing > mostMissing) {
      mostMissing = missing;
      bestEvent = ev;
    }
  }

  // Only worth a Free Hit if a meaningful chunk of the XI blanks.
  if (bestEvent === null || mostMissing < 4) {
    return {
      ...base,
      recommendation:
        "No big blank gameweek on the horizon — hold the Free Hit for now.",
    };
  }

  const confidence =
    mostMissing >= 7 ? "high" : mostMissing >= 5 ? "medium" : "low";
  return {
    ...base,
    recommendation: `Free Hit GW${bestEvent}: ${mostMissing} of your starters blank — field a full team for one week.`,
    bestEvent,
    confidence,
  };
}

/**
 * Wildcard: play it when the squad is poor (many low-xPoints starters) or when
 * a fixture swing rewards a rebuild. We pick the event that best combines a
 * dense fixture run for the squad's clubs with squad weakness.
 */
function adviseWildcard(ctx: AdviseCtx): ChipAdvice {
  const base = blank(chip("wildcard"));
  if (ctx.squad.length === 0) {
    return {
      ...base,
      recommendation:
        "Bank it until your fixtures turn or your squad goes stale — link your team for timing.",
    };
  }

  // Squad weakness: share of starters projecting below a soft replacement line.
  const WEAK_XP = 3.5;
  const weakStarters = ctx.starters.filter((p) => p.xPoints < WEAK_XP).length;
  const weakShare =
    ctx.starters.length > 0 ? weakStarters / ctx.starters.length : 0;

  if (ctx.events.length === 0) {
    // Off-season / no calendar: advise purely on squad health.
    if (weakShare >= 0.4) {
      return {
        ...base,
        recommendation: `${weakStarters} of your starters project poorly — a Wildcard rebuild looks overdue.`,
        confidence: "medium",
      };
    }
    return {
      ...base,
      recommendation:
        "Squad looks healthy — save the Wildcard for an injury crisis or fixture swing.",
    };
  }

  // Find the best upcoming fixture-swing window: event where most squad clubs play.
  const allCodes = ctx.allSquadCodes;
  let bestEvent: number | null = null;
  let bestGames = -1;
  for (const ev of ctx.events) {
    const counts = ctx.calendar.get(ev) ?? new Map<number, number>();
    const games = allCodes.reduce(
      (sum, code) => sum + (counts.get(code) ?? 0),
      0,
    );
    if (games > bestGames) {
      bestGames = games;
      bestEvent = ev;
    }
  }

  if (weakShare >= 0.4) {
    const confidence = weakShare >= 0.55 ? "high" : "medium";
    const when =
      bestEvent !== null ? ` — line it up around GW${bestEvent}` : "";
    return {
      ...base,
      recommendation: `${weakStarters} of your starters project below par; a Wildcard rebuild is due${when}.`,
      bestEvent,
      confidence,
    };
  }

  return {
    ...base,
    recommendation:
      "Squad is in decent shape — hold the Wildcard for a fixture swing or injury pile-up.",
    bestEvent: null,
    confidence: "low",
  };
}

// ---------- helpers ----------

/** A neutral, low-confidence advice shell for a chip. */
function blank(c: ChipAdvice["chip"]): ChipAdvice {
  return {
    chip: c,
    label: CHIP_LABEL[c],
    recommendation: `Hold your ${CHIP_LABEL[c]} for the right moment.`,
    bestEvent: null,
    confidence: "low",
  };
}

/** Identity helper kept for readability at call sites. */
function chip(c: ChipAdvice["chip"]): ChipAdvice["chip"] {
  return c;
}

/** Normalise a free-form chip string to a canonical chip key, or null. */
function normaliseChip(raw: string): ChipAdvice["chip"] | null {
  const key = raw
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return CHIP_ALIASES[key] ?? CHIP_ALIASES[key.replace(/_/g, "")] ?? null;
}

/** Count clubs in `codes` that have >=1 fixture in the given event counts. */
function countPlayingClubs(
  counts: Map<number, number> | undefined,
  codes: number[],
): number {
  if (!counts) return 0;
  return codes.filter((c) => (counts.get(c) ?? 0) >= 1).length;
}

/** Count clubs in `codes` that have a double (>=2 fixtures) in the given event. */
function countDoubles(
  counts: Map<number, number> | undefined,
  codes: number[],
): number {
  if (!counts) return 0;
  return codes.filter((c) => (counts.get(c) ?? 0) >= 2).length;
}

/** Distinct values, preserving first-seen order (deterministic). */
function dedupe(values: number[]): number[] {
  return [...new Set(values)];
}

/**
 * Map each projection's player id → club code via the Player/Team tables.
 * Returns an empty map off-season-safely if the players can't be found.
 */
async function resolveSquadCodes(
  squad: ProjectionResult[],
): Promise<Map<number, number>> {
  const ids = squad.map((p) => p.id);
  if (ids.length === 0) return new Map();
  const rows = await prisma.player.findMany({
    where: { id: { in: ids } },
    select: { id: true, team: { select: { code: true } } },
  });
  return new Map(rows.map((r) => [r.id, r.team.code]));
}

/** Best-effort current gameweek: DB current → next → 1. */
async function resolveCurrentGameweek(): Promise<number> {
  const gw =
    (await prisma.gameweek.findFirst({
      where: { isCurrent: true },
      select: { id: true },
    })) ??
    (await prisma.gameweek.findFirst({
      where: { isNext: true },
      select: { id: true },
    }));
  return gw?.id ?? 1;
}
