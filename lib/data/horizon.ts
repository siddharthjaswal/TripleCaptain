/**
 * Multi-gameweek outlook — projects each squad player's expected points across
 * the next N gameweeks over their actual fixtures. Zero AI.
 *
 * Base = the fixture-neutral xP from our projection engine; per gameweek we scale
 * it by a fixture-difficulty multiplier (FDR 1 = easy → up to ×1.26, FDR 5 = hard
 * → ×0.74). Blank gameweeks score 0; doubles sum both fixtures. This is the
 * "fixture swing" that drives transfer and chip planning.
 */

export type HorizonPlayer = {
  element: number;
  name: string;
  position: string; // GK/DEF/MID/FWD
  teamId: number;
  teamShort: string;
  price: number;
  baseXp: number; // fixture-neutral expected points
};

export type HorizonFixtureMeta = {
  event: number;
  teamH: number;
  teamA: number;
  fdrH: number; // home team's difficulty (1-5)
  fdrA: number; // away team's difficulty (1-5)
};

export type HorizonOpponent = { short: string; home: boolean; fdr: number };
export type HorizonCell = {
  gw: number;
  opponents: HorizonOpponent[]; // empty = blank, 2 = double
  xp: number;
  avgFdr: number | null; // for colouring; null on a blank
};
export type HorizonRow = {
  element: number;
  name: string;
  position: string;
  teamShort: string;
  price: number;
  baseXp: number;
  cells: HorizonCell[];
  total: number; // sum of xp across the horizon
};

/** FDR (1 easy .. 5 hard) → attacking multiplier, centred on FDR 3 = 1.0. */
export function fdrMultiplier(fdr: number): number {
  const m = 1 + (3 - fdr) * 0.13;
  return Math.min(1.26, Math.max(0.74, m));
}

export function buildSquadHorizon(args: {
  squad: HorizonPlayer[];
  fixtures: HorizonFixtureMeta[];
  teamShortById: Map<number, string>;
  fromGw: number;
  horizon: number;
}): { gws: number[]; rows: HorizonRow[] } {
  const { squad, fixtures, teamShortById, fromGw, horizon } = args;
  const gws = Array.from({ length: horizon }, (_, i) => fromGw + i);

  // Index fixtures by gameweek for quick lookup.
  const byGw = new Map<number, HorizonFixtureMeta[]>();
  for (const f of fixtures) {
    if (f.event < fromGw || f.event > fromGw + horizon - 1) continue;
    const list = byGw.get(f.event);
    if (list) list.push(f);
    else byGw.set(f.event, [f]);
  }

  const rows: HorizonRow[] = squad.map((p) => {
    const cells: HorizonCell[] = gws.map((gw) => {
      const fs = (byGw.get(gw) ?? []).filter((f) => f.teamH === p.teamId || f.teamA === p.teamId);
      if (fs.length === 0) return { gw, opponents: [], xp: 0, avgFdr: null };
      let xp = 0;
      let fdrSum = 0;
      const opponents: HorizonOpponent[] = fs.map((f) => {
        const home = f.teamH === p.teamId;
        const fdr = home ? f.fdrH : f.fdrA;
        const oppId = home ? f.teamA : f.teamH;
        xp += p.baseXp * fdrMultiplier(fdr);
        fdrSum += fdr;
        return { short: teamShortById.get(oppId) ?? "?", home, fdr };
      });
      return {
        gw,
        opponents,
        xp: Math.round(xp * 10) / 10,
        avgFdr: Math.round((fdrSum / fs.length) * 10) / 10,
      };
    });
    const total = Math.round(cells.reduce((s, c) => s + c.xp, 0) * 10) / 10;
    return {
      element: p.element,
      name: p.name,
      position: p.position,
      teamShort: p.teamShort,
      price: p.price,
      baseXp: p.baseXp,
      cells,
      total,
    };
  });

  return { gws, rows };
}
