/**
 * Live Gameweek engine — deterministic, zero AI. Turns the official live element
 * feed + fixtures into what a manager wants on matchday: a live score that
 * includes provisional bonus (projected from BPS before it's finalised), an
 * auto-sub preview, captain status, and progress vs the gameweek average.
 *
 * All pure functions so they're unit-testable without the network. Empty/own
 * off-season inputs yield a quiet, non-live summary.
 */

export type Position = 1 | 2 | 3 | 4; // GK, DEF, MID, FWD (FPL element_type)

export type LivePick = {
  element: number;
  position: number; // 1-11 starters, 12-15 bench (bench order)
  multiplier: number; // 0 bench, 1 normal, 2 captain, 3 triple captain
  isCaptain: boolean;
  isViceCaptain: boolean;
  elementType: number; // 1 GK .. 4 FWD
  team: number;
};

export type LiveStat = {
  totalPoints: number; // live points (incl. finalised bonus only)
  minutes: number;
  bps: number;
};

export type TeamMatchState = { started: boolean; finished: boolean };

export type LiveFixture = {
  teamH: number;
  teamA: number;
  started: boolean;
  finished: boolean;
};

export type LiveSummary = {
  isLive: boolean; // at least one squad fixture in play
  livePoints: number; // effective XI incl. captain multiplier + provisional bonus
  provisionalBonus: number; // provisional bonus contributed by the effective XI
  benchPoints: number; // raw bench points (for info)
  counted: number; // players whose points count (11, or 15 under Bench Boost)
  startersPlayed: number; // their match has finished
  startersInPlay: number; // their match started, not finished
  startersToPlay: number; // their match hasn't kicked off
  captain: {
    element: number | null;
    points: number; // base + provisional bonus, BEFORE multiplier
    multiplier: number;
    played: boolean; // any minutes
    finished: boolean; // their match is over
    usedVice: boolean; // captain blanked (0 mins, match over) → vice took over
  };
  autoSubs: Array<{ outElement: number; inElement: number }>;
  effectiveXi: number[]; // element ids actually counting (after auto-subs)
  vsAverage: number | null;
};

const FORMATION_MIN: Record<Position, number> = { 1: 1, 2: 3, 3: 2, 4: 1 };

/**
 * Provisional bonus for one fixture's players from BPS, with FPL tie rules:
 * group by equal BPS; a group starting at rank r scores max(0, 4-r) each
 * (rank 1 → 3, 2 → 2, 3 → 1). Ties shift subsequent ranks (e.g. two on top → 3,3,1).
 */
export function projectFixtureBonus(
  players: Array<{ id: number; bps: number }>,
): Map<number, number> {
  const out = new Map<number, number>();
  const eligible = players.filter((p) => p.bps > 0);
  if (eligible.length === 0) return out;

  const sorted = [...eligible].sort((a, b) => b.bps - a.bps || a.id - b.id);
  let rank = 1;
  let i = 0;
  while (i < sorted.length && rank <= 3) {
    const bps = sorted[i].bps;
    const group = [];
    while (i < sorted.length && sorted[i].bps === bps) {
      group.push(sorted[i]);
      i++;
    }
    const bonus = Math.max(0, 4 - rank);
    if (bonus === 0) break;
    for (const p of group) out.set(p.id, bonus);
    rank += group.length;
  }
  return out;
}

export function computeLiveSummary(args: {
  picks: LivePick[];
  liveById: Map<number, LiveStat>;
  fixtures: LiveFixture[];
  allPlayersTeam: Map<number, number>; // every element id → team (for bonus ranking)
  averageScore: number | null;
  activeChip?: string | null; // e.g. "bboost", "3xc"
}): LiveSummary {
  const { picks, liveById, fixtures, allPlayersTeam, averageScore, activeChip } = args;

  const stat = (id: number): LiveStat =>
    liveById.get(id) ?? { totalPoints: 0, minutes: 0, bps: 0 };

  // Per-team match state derived from fixtures (DGW-safe: started if any of the
  // team's fixtures started, finished only when all started ones are finished).
  const teamState = new Map<number, TeamMatchState>();
  for (const f of fixtures) {
    for (const team of [f.teamH, f.teamA]) {
      const cur = teamState.get(team) ?? { started: false, finished: true };
      teamState.set(team, {
        started: cur.started || f.started,
        finished: cur.finished && (f.finished || !f.started),
      });
    }
  }
  const tState = (team: number): TeamMatchState =>
    teamState.get(team) ?? { started: false, finished: false };

  // --- Provisional bonus, ranked per fixture (both teams' players together) ---
  const provBonus = new Map<number, number>();
  // Index players by team once.
  const playersByTeam = new Map<number, Array<{ id: number; bps: number }>>();
  for (const [id, team] of allPlayersTeam) {
    const list = playersByTeam.get(team);
    const entry = { id, bps: stat(id).bps };
    if (list) list.push(entry);
    else playersByTeam.set(team, [entry]);
  }
  for (const f of fixtures) {
    if (!f.started || f.finished) continue; // provisional only while in play
    const pool = [
      ...(playersByTeam.get(f.teamH) ?? []),
      ...(playersByTeam.get(f.teamA) ?? []),
    ];
    const ranked = projectFixtureBonus(pool);
    for (const [id, b] of ranked) provBonus.set(id, b);
  }
  const anyInPlay = fixtures.some((f) => f.started && !f.finished);

  const livePointsFor = (id: number): { base: number; bonus: number } => {
    const s = stat(id);
    const team = allPlayersTeam.get(id);
    const ts = team != null ? tState(team) : { started: false, finished: false };
    // Provisional bonus only while the match is in play (finished → already in points).
    const bonus = ts.started && !ts.finished ? provBonus.get(id) ?? 0 : 0;
    return { base: s.totalPoints, bonus };
  };

  const playedMin = (id: number) => stat(id).minutes > 0;
  const didNotPlay = (p: LivePick) => tState(p.team).finished && !playedMin(p.element);

  const benchBoost = activeChip === "bboost";
  const starters = picks.filter((p) => p.position <= 11);
  const bench = picks.filter((p) => p.position >= 12).sort((a, b) => a.position - b.position);

  // FPL's pick multipliers are the source of truth: they already encode chips
  // (bench boost → bench = 1, triple captain → captain = 3) and, on finished
  // gameweeks, a resolved vice takeover. We start from them and only layer on
  // projections FPL hasn't applied yet (live vice + live auto-subs).
  const mult = new Map<number, number>(picks.map((p) => [p.element, p.multiplier]));

  // --- Live vice projection: if the captain's match is over and they blanked
  // but FPL hasn't moved the armband yet (mid-GW), project it onto the vice. ---
  const capPick = picks.find((p) => p.isCaptain) ?? null;
  const vicePick = picks.find((p) => p.isViceCaptain) ?? null;
  if (
    capPick &&
    (mult.get(capPick.element) ?? 0) > 1 &&
    didNotPlay(capPick) &&
    vicePick &&
    playedMin(vicePick.element)
  ) {
    mult.set(vicePick.element, mult.get(capPick.element)!);
    mult.set(capPick.element, 1);
  }

  // --- Auto-subs: replace starters who blanked (0 mins, match over). Bench Boost
  // counts the whole bench already, so no subs apply. ---
  const autoSubs: Array<{ outElement: number; inElement: number }> = [];
  const onPitch = new Set(starters.map((p) => p.element)); // for formation legality
  const benchUsed = new Set<number>();
  const counts = (): Record<Position, number> => {
    const c: Record<Position, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const p of picks) if (onPitch.has(p.element)) c[p.elementType as Position]++;
    return c;
  };
  if (!benchBoost) {
    for (const out of starters) {
      if (!didNotPlay(out)) continue;
      const replace = (cand: LivePick) => {
        onPitch.delete(out.element);
        onPitch.add(cand.element);
        benchUsed.add(cand.element);
        mult.set(cand.element, 1);
        // The blanker keeps its own (~0) points but no longer occupies the XI.
        mult.set(out.element, 0);
        autoSubs.push({ outElement: out.element, inElement: cand.element });
      };
      if (out.elementType === 1) {
        const gk = bench.find(
          (b) => b.elementType === 1 && !benchUsed.has(b.element) && playedMin(b.element),
        );
        if (gk) replace(gk);
        continue;
      }
      for (const cand of bench) {
        if (cand.elementType === 1 || benchUsed.has(cand.element) || !playedMin(cand.element)) continue;
        const c = counts();
        c[out.elementType as Position]--;
        c[cand.elementType as Position]++;
        if (c[2] >= FORMATION_MIN[2] && c[3] >= FORMATION_MIN[3] && c[4] >= FORMATION_MIN[4]) {
          replace(cand);
          break;
        }
      }
    }
  }

  // --- Totals from effective multipliers ---
  let livePoints = 0;
  let provisionalBonus = 0;
  let benchPoints = 0;
  for (const p of picks) {
    const { base, bonus } = livePointsFor(p.element);
    const m = mult.get(p.element) ?? 0;
    if (m > 0) {
      livePoints += (base + bonus) * m;
      provisionalBonus += bonus * m;
    } else {
      benchPoints += base + bonus;
    }
  }

  // --- Effective captain (the player carrying the doubled/tripled armband) ---
  let captainElement: number | null = null;
  let captainMult = 1;
  for (const p of picks) {
    const m = mult.get(p.element) ?? 0;
    if (m > captainMult) {
      captainMult = m;
      captainElement = p.element;
    }
  }
  const usedVice = captainElement != null && captainElement === vicePick?.element;

  // --- Progress over the players who count (11 normally, 15 with Bench Boost) ---
  const counting = picks.filter((p) => (mult.get(p.element) ?? 0) > 0);
  let played = 0,
    inPlay = 0,
    toPlay = 0;
  for (const p of counting) {
    const ts = tState(p.team);
    if (ts.finished) played++;
    else if (ts.started) inPlay++;
    else toPlay++;
  }

  const capStat = captainElement != null ? livePointsFor(captainElement) : { base: 0, bonus: 0 };
  const capTeam = captainElement != null ? allPlayersTeam.get(captainElement) : undefined;
  const capTs = capTeam != null ? tState(capTeam) : { started: false, finished: false };

  return {
    isLive: anyInPlay,
    livePoints,
    provisionalBonus,
    benchPoints,
    counted: counting.length,
    startersPlayed: played,
    startersInPlay: inPlay,
    startersToPlay: toPlay,
    captain: {
      element: captainElement,
      points: capStat.base + capStat.bonus,
      multiplier: captainMult,
      played: captainElement != null ? playedMin(captainElement) : false,
      finished: capTs.finished,
      usedVice,
    },
    autoSubs,
    effectiveXi: counting.map((p) => p.element),
    vsAverage: averageScore == null ? null : Math.round((livePoints - averageScore) * 10) / 10,
  };
}
