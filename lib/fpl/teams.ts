/**
 * Per-club visual identity keyed by the FPL team `code` (stable across seasons,
 * unlike the per-season `id`). Used for the player-card stage: the team accent
 * colour, the striped gradient, and the faint short-name watermark.
 */

export type TeamVisual = {
  abbr: string;
  /** Primary club colour (hex) used for the accent line + stage tint. */
  color: string;
};

const TEAMS: Record<number, TeamVisual> = {
  1: { abbr: "MUN", color: "#DA291C" },
  2: { abbr: "LEE", color: "#1D428A" },
  3: { abbr: "ARS", color: "#EF0107" },
  4: { abbr: "NEW", color: "#41535b" },
  6: { abbr: "TOT", color: "#132257" },
  7: { abbr: "AVL", color: "#7A003C" },
  8: { abbr: "CHE", color: "#034694" },
  11: { abbr: "EVE", color: "#003399" },
  13: { abbr: "LEI", color: "#003090" },
  14: { abbr: "LIV", color: "#C8102E" },
  17: { abbr: "NFO", color: "#DD0000" },
  20: { abbr: "SOU", color: "#D71920" },
  21: { abbr: "WHU", color: "#7A263A" },
  31: { abbr: "CRY", color: "#1B458F" },
  36: { abbr: "BHA", color: "#0057B8" },
  39: { abbr: "WOL", color: "#FDB913" },
  40: { abbr: "IPS", color: "#3A64A3" },
  43: { abbr: "MCI", color: "#6CABDD" },
  49: { abbr: "SHU", color: "#EE2737" },
  54: { abbr: "FUL", color: "#3a3a3a" },
  56: { abbr: "SUN", color: "#E2231A" },
  88: { abbr: "WOL", color: "#FDB913" },
  90: { abbr: "BUR", color: "#6C1D45" },
  91: { abbr: "BOU", color: "#DA291C" },
  94: { abbr: "BRE", color: "#E30613" },
  102: { abbr: "LUT", color: "#F78F1E" },
};

const FALLBACK: TeamVisual = { abbr: "", color: "var(--accent)" };

export function getTeamVisual(code: number | null | undefined): TeamVisual {
  if (code == null) return FALLBACK;
  return TEAMS[code] ?? FALLBACK;
}
