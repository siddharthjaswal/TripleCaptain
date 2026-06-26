/**
 * Rivals Watch — mini-league intelligence, deterministic and zero AI. Turns your
 * league's squads into the things that actually decide who wins: what the field
 * is captaining, your differentials (players you own that rivals don't — your
 * edge), the template you're missing (players most rivals own — your risk), and
 * a head-to-head overlap with each rival.
 *
 * Pure: ids in, structured analysis out. Names/teams are resolved by the caller.
 */

export type RivalSquad = {
  entryId: number;
  name: string; // team name
  manager: string;
  rank: number | null;
  squad: number[]; // the 15 owned element ids
  captain: number | null;
};

export type CaptaincyTally = { element: number; count: number; pct: number; isMine: boolean };
export type OwnershipDiff = { element: number; rivalCount: number; rivalPct: number };
export type RivalH2H = {
  entryId: number;
  name: string;
  manager: string;
  rank: number | null;
  overlap: number; // shared owned players (of 15)
  captain: number | null;
  differsCaptain: boolean;
};

export type RivalsAnalysis = {
  fieldSize: number; // number of rivals (excludes you)
  myCaptain: number | null;
  captaincy: CaptaincyTally[]; // most-captained first
  differentials: OwnershipDiff[]; // yours, lowest rival ownership first
  templateGaps: OwnershipDiff[]; // not yours, highest rival ownership first
  rivals: RivalH2H[]; // by rank
};

const DIFFERENTIAL_MAX_PCT = 40; // you own it, ≤40% of rivals do → a differential
const TEMPLATE_MIN_PCT = 50; // ≥50% of rivals own it (and you don't) → a gap

export function computeRivalsAnalysis(args: {
  me: RivalSquad;
  rivals: RivalSquad[];
}): RivalsAnalysis {
  const { me, rivals } = args;
  const fieldSize = rivals.length;
  const mySquad = new Set(me.squad);

  // How many rivals own each element.
  const rivalOwn = new Map<number, number>();
  for (const r of rivals) {
    for (const id of new Set(r.squad)) rivalOwn.set(id, (rivalOwn.get(id) ?? 0) + 1);
  }
  const pct = (n: number) => (fieldSize > 0 ? Math.round((n / fieldSize) * 1000) / 10 : 0);

  // --- Captaincy across the field (you + rivals) ---
  const capCount = new Map<number, number>();
  const allCaps = [me.captain, ...rivals.map((r) => r.captain)].filter(
    (c): c is number => c != null,
  );
  for (const c of allCaps) capCount.set(c, (capCount.get(c) ?? 0) + 1);
  const captaincy: CaptaincyTally[] = [...capCount.entries()]
    .map(([element, count]) => ({
      element,
      count,
      pct: Math.round((count / (fieldSize + 1)) * 1000) / 10,
      isMine: element === me.captain,
    }))
    .sort((a, b) => b.count - a.count || a.element - b.element);

  // --- Your differentials: you own, few rivals do ---
  const differentials: OwnershipDiff[] = [...mySquad]
    .map((element) => ({ element, rivalCount: rivalOwn.get(element) ?? 0, rivalPct: pct(rivalOwn.get(element) ?? 0) }))
    .filter((d) => d.rivalPct <= DIFFERENTIAL_MAX_PCT)
    .sort((a, b) => a.rivalCount - b.rivalCount || a.element - b.element);

  // --- Template gaps: most rivals own, you don't ---
  const templateGaps: OwnershipDiff[] = [...rivalOwn.entries()]
    .filter(([element, count]) => !mySquad.has(element) && pct(count) >= TEMPLATE_MIN_PCT)
    .map(([element, count]) => ({ element, rivalCount: count, rivalPct: pct(count) }))
    .sort((a, b) => b.rivalCount - a.rivalCount || a.element - b.element);

  // --- Per-rival head-to-head ---
  const rivalsH2H: RivalH2H[] = rivals
    .map((r) => ({
      entryId: r.entryId,
      name: r.name,
      manager: r.manager,
      rank: r.rank,
      overlap: r.squad.filter((id) => mySquad.has(id)).length,
      captain: r.captain,
      differsCaptain: r.captain != null && r.captain !== me.captain,
    }))
    .sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9));

  return {
    fieldSize,
    myCaptain: me.captain,
    captaincy,
    differentials,
    templateGaps,
    rivals: rivalsH2H,
  };
}
