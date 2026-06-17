/**
 * Shared types for the offline data engine. Every engine module (xp, fdr,
 * optimizer, chips) speaks this contract so they compose without coupling to
 * Prisma row shapes directly.
 */

export type Position = "GK" | "DEF" | "MID" | "FWD";

export const POSITIONS: Position[] = ["GK", "DEF", "MID", "FWD"];

/** element_type (1-4) → Position */
export function positionOf(elementType: number): Position {
  return POSITIONS[elementType - 1] ?? "MID";
}

/** A player as the engine consumes it (subset of the Prisma Player row + code). */
export type EnginePlayer = {
  id: number;
  code: number | null;
  name: string;
  position: Position;
  teamCode: number; // stable club code (for fixtures / ratings)
  teamShort: string;
  price: number; // £m
  form: number;
  pointsPerGame: number;
  minutes: number;
  selectedByPercent: number;
  chanceOfPlayingNext: number | null;
  epNextFpl: number | null; // FPL's own ep_next (for comparison only)
};

/** One past season for a player (from FPL element-summary history_past). */
export type PlayerSeasonHistory = {
  season: string;
  minutes: number;
  starts: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  xG: number;
  xA: number;
  points: number;
  ppg: number;
};

/** A single upcoming fixture for a club, with our own difficulty + win odds. */
export type EngineFixture = {
  event: number;
  opponentCode: number;
  opponentShort: string;
  isHome: boolean;
  fdr: number; // our custom 1-5 (1 = easiest)
  attackFdr: number; // ease of scoring (1 = easiest) — for attackers
  cleanSheetPct: number; // this club keeping a clean sheet
  winPct: number;
};

/** Output of the custom xP model for one player (one GW or aggregate). */
export type ProjectionResult = {
  id: number;
  name: string;
  position: Position;
  teamShort: string;
  price: number;
  xPoints: number; // our expected points
  ceiling: number; // ~90th percentile outcome
  floor: number; // ~10th percentile outcome
  capScore: number; // captaincy desirability (ceiling-weighted)
  startProb: number; // 0-1 likelihood of starting
  value: number; // xPoints per £m
  archetype: "explosive" | "consistent" | "rotation-risk" | "nailed" | "balanced";
  reasons: string[];
};

/** A recommended transfer. */
export type TransferSuggestion = {
  outId: number;
  outName: string;
  inId: number;
  inName: string;
  costDelta: number; // £m (positive = costs money)
  xpDelta: number; // projected-points gain over horizon
  hit: number; // points hit (-4 each beyond free transfers), 0 if free
  netGain: number; // xpDelta - |hit|
  rationale: string;
};

/** Chip timing advice. */
export type ChipAdvice = {
  chip: "wildcard" | "bboost" | "3xc" | "freehit";
  label: string;
  recommendation: string;
  bestEvent: number | null;
  confidence: "low" | "medium" | "high";
};

/** Structured facts the narrator turns into Gaffer-voice prose (zero AI). */
export type AuditFacts = {
  teamName?: string;
  avgScore: number; // mean engine score of the XI
  healthScore: number;
  strongest: Array<{ name: string; score: number }>;
  weakest: Array<{ name: string; score: number }>;
  templateAlignmentPct: number;
  missingTemplate: Array<{ name: string; elitePct: number; captainPct: number }>;
  eliteCaptain: { name: string; captainPct: number } | null;
  userCaptainEliteCapPct: number;
};
