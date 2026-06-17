import type { Position, ProjectionResult, TransferSuggestion } from "./types";

/**
 * Deterministic transfer optimizer and best-XI selector. Pure maths over
 * projections — no DB, no AI. Given a squad of {@link ProjectionResult}s and a
 * pool of candidates, it ranks single-swap transfers by net expected-points
 * gain (accounting for the 4-point hit), and picks the highest-xP legal XI.
 *
 * Off-season safe: empty squad/candidates yield empty/neutral output, never a
 * throw. All ties are broken by stable player id so results are reproducible.
 */

/** A single transfer costs 0 pts if a free transfer is available, else -4. */
const HIT_COST = -4;

/** FPL squad shape: 1 GK, 3-5 DEF, 2-5 MID, 1-3 FWD, 11 starters. */
const FORMATION_RULES: Record<Position, { min: number; max: number }> = {
  GK: { min: 1, max: 1 },
  DEF: { min: 3, max: 5 },
  MID: { min: 2, max: 5 },
  FWD: { min: 1, max: 3 },
};

const STARTERS = 11;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Stable comparator: by descending primary metric, then ascending id so equal
 * scores always order the same way (determinism without Math.random).
 */
function byScoreThenId(
  aScore: number,
  bScore: number,
  aId: number,
  bId: number,
): number {
  if (bScore !== aScore) return bScore - aScore;
  return aId - bId;
}

/**
 * Suggest single-player transfers ranked by net expected-points gain.
 *
 * For each squad player (out) we scan same-position candidates not already in
 * the squad, keep those affordable given `bank` plus the out player's sell
 * value (`out.price`), and — when `squadClubCounts` is supplied — respect the
 * max-3-per-club rule. The best replacement per out player is kept (deduped by
 * `outId`); only net-positive moves are returned, top `maxSuggestions` first.
 *
 * @param args.squad           Current squad projections (the "out" pool).
 * @param args.candidates      Available targets (the "in" pool).
 * @param args.bank            Money in the bank, £m.
 * @param args.freeTransfers   Free transfers available (>=1 ⇒ first swap free).
 * @param args.squadClubCounts Optional teamCode → count for club-cap checks.
 * @param args.maxSuggestions  Cap on returned suggestions (default 5).
 */
export function suggestTransfers(args: {
  squad: ProjectionResult[];
  candidates: ProjectionResult[];
  bank: number;
  freeTransfers: number;
  squadClubCounts?: Record<number, number>;
  maxSuggestions?: number;
}): TransferSuggestion[] {
  const {
    squad,
    candidates,
    bank,
    freeTransfers,
    squadClubCounts,
    maxSuggestions = 5,
  } = args;

  if (squad.length === 0 || candidates.length === 0) return [];

  const squadIds = new Set(squad.map((p) => p.id));
  // First swap is free when at least one free transfer is banked.
  const hit = freeTransfers >= 1 ? 0 : HIT_COST;

  const best: TransferSuggestion[] = [];

  for (const out of squad) {
    const budget = bank + out.price; // sell value frees up funds

    let bestForOut: TransferSuggestion | null = null;

    for (const inc of candidates) {
      if (inc.position !== out.position) continue;
      if (squadIds.has(inc.id)) continue;
      if (inc.price > budget + 1e-9) continue; // affordability

      // Club cap (max 3 per club). The out player vacates a slot in his club,
      // so only enforce when the incoming player is from a *different* club.
      if (squadClubCounts && incomingTeamCode(inc) !== incomingTeamCode(out)) {
        const code = incomingTeamCode(inc);
        if (code !== null) {
          const current = squadClubCounts[code] ?? 0;
          if (current >= 3) continue;
        }
      }

      const xpDelta = inc.xPoints - out.xPoints;
      const netGain = xpDelta - Math.abs(hit);
      if (netGain <= 0) continue;

      const suggestion: TransferSuggestion = {
        outId: out.id,
        outName: out.name,
        inId: inc.id,
        inName: inc.name,
        costDelta: round2(inc.price - out.price),
        xpDelta: round2(xpDelta),
        hit,
        netGain: round2(netGain),
        rationale: buildRationale(out, inc, xpDelta, hit),
      };

      // Keep the single best replacement for this out slot (stable on id).
      if (
        !bestForOut ||
        byScoreThenId(
          suggestion.netGain,
          bestForOut.netGain,
          suggestion.inId,
          bestForOut.inId,
        ) < 0
      ) {
        bestForOut = suggestion;
      }
    }

    if (bestForOut) best.push(bestForOut);
  }

  best.sort((a, b) => byScoreThenId(a.netGain, b.netGain, a.outId, b.outId));
  return best.slice(0, Math.max(0, maxSuggestions));
}

/**
 * ProjectionResult has no teamCode, but club-cap checks need a stable club key.
 * We use teamShort (its only club identifier) hashed to a number so the
 * `squadClubCounts: Record<number, number>` contract still works. Callers that
 * supply club counts are expected to key them by the same hash via
 * {@link clubKey}; when they key by FPL teamCode instead, the cap simply
 * never trips for cross-club swaps — a safe, non-throwing degradation.
 */
function incomingTeamCode(p: ProjectionResult): number | null {
  return clubKey(p.teamShort);
}

/** Deterministic numeric key for a club short-name (djb2-ish, stable). */
export function clubKey(teamShort: string): number {
  let h = 5381;
  for (let i = 0; i < teamShort.length; i++) {
    h = (h * 33 + teamShort.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Short, deterministic, human-readable transfer rationale. */
function buildRationale(
  out: ProjectionResult,
  inc: ProjectionResult,
  xpDelta: number,
  hit: number,
): string {
  const gain = round2(xpDelta);
  const base = `${inc.name} projects +${gain} xP over ${out.name}`;
  const costNote =
    inc.price > out.price
      ? ` (costs £${round2(inc.price - out.price)}m)`
      : inc.price < out.price
        ? ` (frees £${round2(out.price - inc.price)}m)`
        : "";
  const hitNote = hit === 0 ? " — free transfer" : ` — even after the ${Math.abs(hit)}-pt hit`;
  return `${base}${costNote}${hitNote}.`;
}

/**
 * Pick the highest expected-points legal starting XI from a 15-man squad.
 *
 * Tries every legal outfield split (DEF/MID/FWD within FPL bounds summing to
 * 10, plus the single best GK) and keeps the formation with the greatest total
 * xPoints. Within a position, players are taken in descending xPoints (ties
 * broken by id). Bench = the remaining players ordered by xPoints.
 *
 * Off-season / undersized squads degrade gracefully: if no legal XI fits, all
 * players become "starters" (ordered by xP) and the bench is empty, and the
 * formation string reflects whatever outfield split was achievable.
 */
export function pickBestXI(squad: ProjectionResult[]): {
  starters: number[];
  bench: number[];
  formation: string;
} {
  if (squad.length === 0) return { starters: [], bench: [], formation: "0-0-0" };

  const byPos: Record<Position, ProjectionResult[]> = {
    GK: [],
    DEF: [],
    MID: [],
    FWD: [],
  };
  for (const p of squad) byPos[p.position].push(p);
  // Strongest first, stable on id.
  for (const pos of Object.keys(byPos) as Position[]) {
    byPos[pos].sort((a, b) => byScoreThenId(a.xPoints, b.xPoints, a.id, b.id));
  }

  // We need exactly one GK for a legal XI; pick the best available.
  const gk = byPos.GK[0] ?? null;

  let bestPlan: {
    def: number;
    mid: number;
    fwd: number;
    total: number;
    starterIds: number[];
  } | null = null;

  if (gk) {
    for (let def = FORMATION_RULES.DEF.min; def <= FORMATION_RULES.DEF.max; def++) {
      if (def > byPos.DEF.length) break;
      for (let mid = FORMATION_RULES.MID.min; mid <= FORMATION_RULES.MID.max; mid++) {
        if (mid > byPos.MID.length) break;
        const fwd = STARTERS - 1 - def - mid; // minus the GK
        if (fwd < FORMATION_RULES.FWD.min || fwd > FORMATION_RULES.FWD.max) continue;
        if (fwd > byPos.FWD.length) continue;

        const defPick = byPos.DEF.slice(0, def);
        const midPick = byPos.MID.slice(0, mid);
        const fwdPick = byPos.FWD.slice(0, fwd);

        const total =
          gk.xPoints +
          sumXp(defPick) +
          sumXp(midPick) +
          sumXp(fwdPick);

        if (
          !bestPlan ||
          total > bestPlan.total + 1e-9 ||
          // Stable tie-break: prefer the lower combined starter id signature.
          (Math.abs(total - bestPlan.total) <= 1e-9 &&
            formationKey(def, mid, fwd) < formationKey(bestPlan.def, bestPlan.mid, bestPlan.fwd))
        ) {
          bestPlan = {
            def,
            mid,
            fwd,
            total,
            starterIds: [
              gk.id,
              ...defPick.map((p) => p.id),
              ...midPick.map((p) => p.id),
              ...fwdPick.map((p) => p.id),
            ],
          };
        }
      }
    }
  }

  if (!bestPlan) {
    // No legal XI possible (undersized / off-season squad): start everyone we
    // can (capped at 11), ordered by xP, bench the rest. Neutral, no throw.
    const ordered = [...squad].sort((a, b) =>
      byScoreThenId(a.xPoints, b.xPoints, a.id, b.id),
    );
    const starters = ordered.slice(0, STARTERS);
    const bench = ordered.slice(STARTERS);
    const counts = countPos(starters);
    return {
      starters: starters.map((p) => p.id),
      bench: bench.map((p) => p.id),
      formation: `${counts.DEF}-${counts.MID}-${counts.FWD}`,
    };
  }

  const starterSet = new Set(bestPlan.starterIds);
  const bench = [...squad]
    .filter((p) => !starterSet.has(p.id))
    .sort((a, b) => byScoreThenId(a.xPoints, b.xPoints, a.id, b.id));

  return {
    starters: bestPlan.starterIds,
    bench: bench.map((p) => p.id),
    formation: `${bestPlan.def}-${bestPlan.mid}-${bestPlan.fwd}`,
  };
}

function sumXp(players: ProjectionResult[]): number {
  let s = 0;
  for (const p of players) s += p.xPoints;
  return s;
}

function countPos(players: ProjectionResult[]): Record<Position, number> {
  const c: Record<Position, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  for (const p of players) c[p.position] += 1;
  return c;
}

/** Stable lexical key for a formation, for deterministic tie-breaking. */
function formationKey(def: number, mid: number, fwd: number): string {
  return `${def}-${mid}-${fwd}`;
}
