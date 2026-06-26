import { computeNailedness } from "./nailedness";

/**
 * Predicted starting XI per club — the highest-nailedness legal lineup from
 * deterministic start probabilities. Zero AI. Pure: takes a club's players and
 * returns the projected XI by line plus the next men off the bench.
 */

export type LineupPlayer = {
  name: string;
  elementType: number; // 1 GK .. 4 FWD
  status?: string;
  chanceNext?: number | null;
  minutes?: number;
  starts?: number;
};

export type ClubXI = {
  teamShort: string;
  teamName: string;
  formation: string; // e.g. "4-3-3"
  lines: { GK: string[]; DEF: string[]; MID: string[]; FWD: string[] };
  bench: string[];
};

type Pos = "GK" | "DEF" | "MID" | "FWD";
const POS_BY_TYPE: Record<number, Pos> = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" };
const BOUNDS: Record<Exclude<Pos, "GK">, { min: number; max: number }> = {
  DEF: { min: 3, max: 5 },
  MID: { min: 2, max: 5 },
  FWD: { min: 1, max: 3 },
};

export function predictClubXI(args: {
  players: LineupPlayer[];
  teamShort: string;
  teamName: string;
  gamesPlayed: number;
}): ClubXI {
  const { players, teamShort, teamName, gamesPlayed } = args;

  // Score every available player and bucket by position, best-first.
  const scored = players
    .map((p) => ({
      name: p.name,
      pos: POS_BY_TYPE[p.elementType],
      prob: computeNailedness({
        status: p.status,
        chanceNext: p.chanceNext ?? null,
        minutes: p.minutes ?? 0,
        starts: p.starts ?? 0,
        gamesPlayed,
      }).startProb,
    }))
    .filter((p) => p.pos && p.prob > 0);

  const by: Record<Pos, typeof scored> = { GK: [], DEF: [], MID: [], FWD: [] };
  for (const p of scored) by[p.pos].push(p);
  for (const pos of Object.keys(by) as Pos[]) {
    by[pos].sort((a, b) => b.prob - a.prob || a.name.localeCompare(b.name));
  }

  const gk = by.GK[0];

  // Search every legal outfield split summing to 10; maximise total start prob.
  let best: { def: number; mid: number; fwd: number; total: number } | null = null;
  for (let def = BOUNDS.DEF.min; def <= Math.min(BOUNDS.DEF.max, by.DEF.length); def++) {
    for (let mid = BOUNDS.MID.min; mid <= Math.min(BOUNDS.MID.max, by.MID.length); mid++) {
      const fwd = 10 - def - mid;
      if (fwd < BOUNDS.FWD.min || fwd > BOUNDS.FWD.max || fwd > by.FWD.length) continue;
      const total =
        sum(by.DEF.slice(0, def)) + sum(by.MID.slice(0, mid)) + sum(by.FWD.slice(0, fwd));
      if (!best || total > best.total) best = { def, mid, fwd, total };
    }
  }

  if (!gk || !best) {
    // Not enough data for a legal XI — degrade to whatever we have.
    return {
      teamShort,
      teamName,
      formation: "—",
      lines: {
        GK: gk ? [gk.name] : [],
        DEF: by.DEF.slice(0, 4).map((p) => p.name),
        MID: by.MID.slice(0, 4).map((p) => p.name),
        FWD: by.FWD.slice(0, 2).map((p) => p.name),
      },
      bench: [],
    };
  }

  const lines = {
    GK: [gk.name],
    DEF: by.DEF.slice(0, best.def).map((p) => p.name),
    MID: by.MID.slice(0, best.mid).map((p) => p.name),
    FWD: by.FWD.slice(0, best.fwd).map((p) => p.name),
  };
  const chosen = new Set([...lines.GK, ...lines.DEF, ...lines.MID, ...lines.FWD]);
  const bench = scored
    .filter((p) => !chosen.has(p.name))
    .sort((a, b) => b.prob - a.prob)
    .slice(0, 4)
    .map((p) => p.name);

  return {
    teamShort,
    teamName,
    formation: `${best.def}-${best.mid}-${best.fwd}`,
    lines,
    bench,
  };
}

function sum(arr: Array<{ prob: number }>): number {
  return arr.reduce((s, x) => s + x.prob, 0);
}
