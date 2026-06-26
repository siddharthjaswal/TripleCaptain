/**
 * Nailedness — a deterministic "will he start?" score per player, from public
 * availability + minutes data. Zero AI. Kills the most painful FPL mistake:
 * captaining or owning a player who's benched or injured.
 *
 * Signals: FPL `status` (available/doubt/injured/suspended/unavailable),
 * `chance_of_playing_next_round`, and minutes reliability (starts vs games
 * played, minutes per start). Computable straight from bootstrap at request
 * time, so it's always fresh when team news breaks.
 */

export type NailedTier = "nailed" | "likely" | "rotation" | "doubt" | "unavailable" | "fringe";

export type NailedReport = {
  startProb: number; // 0-100, projected chance of starting the next match
  tier: NailedTier;
  label: string;
  reason: string;
  available: boolean; // not injured/suspended/unavailable
};

export type NailednessInput = {
  status?: string; // a, d, i, s, u, n
  chanceNext?: number | null; // chance_of_playing_next_round (0-100)
  minutes?: number; // season minutes
  starts?: number; // season starts
  gamesPlayed: number; // team's completed fixtures this season (>=1)
};

const STATUS_OUT: Record<string, string> = {
  i: "Injured",
  s: "Suspended",
  u: "Unavailable",
  n: "Not in squad",
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

const TIERS: Array<{ min: number; tier: NailedTier; label: string }> = [
  { min: 80, tier: "nailed", label: "Nailed" },
  { min: 60, tier: "likely", label: "Likely starter" },
  { min: 35, tier: "rotation", label: "Rotation risk" },
  { min: 0, tier: "fringe", label: "Fringe / bench" },
];

export function computeNailedness(input: NailednessInput): NailedReport {
  const { status = "a", chanceNext, minutes = 0, starts = 0 } = input;
  const games = Math.max(1, input.gamesPlayed);

  // Hard unavailability dominates everything.
  if (STATUS_OUT[status]) {
    return {
      startProb: 0,
      tier: "unavailable",
      label: STATUS_OUT[status],
      reason: `${STATUS_OUT[status]} — won't feature.`,
      available: false,
    };
  }

  // Explicit doubt (status 'd') with a chance percentage.
  if (status === "d") {
    const pct = clamp(chanceNext ?? 50, 0, 100);
    return {
      startProb: Math.round(pct),
      tier: "doubt",
      label: `Doubt (${pct}%)`,
      reason:
        pct >= 75
          ? "Carrying a knock but expected to be available."
          : pct >= 50
            ? "A genuine doubt — check team news before the deadline."
            : "Unlikely to feature — have a plan B.",
      available: pct >= 50,
    };
  }

  // Available: score minutes reliability.
  const startRatio = clamp(starts / games, 0, 1); // how often he's named in the XI
  const minPerStart = starts > 0 ? clamp(minutes / starts / 90, 0, 1) : 0; // full 90s when he starts
  const volume = clamp(minutes / (games * 90), 0, 1); // overall minutes share
  // Weighted: starting frequency matters most, then how complete those starts are.
  let prob = 100 * (0.6 * startRatio + 0.25 * minPerStart + 0.15 * volume);

  // A late fitness flag still applies even when status is nominally available.
  if (typeof chanceNext === "number" && chanceNext < 100) prob *= chanceNext / 100;

  // Almost no minutes all season → genuine bench player, not just low score.
  if (minutes < 90 && games >= 4) prob = Math.min(prob, 15);

  const startProb = Math.round(clamp(prob, 0, 99));
  const t = TIERS.find((x) => startProb >= x.min)!;

  const reason =
    t.tier === "nailed"
      ? `Started ${starts} of ${games} — first on the team sheet.`
      : t.tier === "likely"
        ? `Regular starter (${starts}/${games}), low rotation risk.`
        : t.tier === "rotation"
          ? `Started ${starts} of ${games} — rotation risk, not guaranteed.`
          : `Only ${Math.round(minutes / 90)} full games of minutes — a bench option.`;

  return { startProb, tier: t.tier, label: t.label, reason, available: true };
}
