import { positionOf, type Position } from "./types";

/**
 * Price-change watch — a deterministic approximation of FPL's overnight price
 * algorithm from public transfer momentum. Zero AI.
 *
 * FPL's exact thresholds are secret, but rises/falls track *net transfers this
 * gameweek as a share of the total manager base*. We rank that momentum and
 * flag the strongest movers in each direction, with a confidence tier. We never
 * claim certainty — it's a "market is buying/selling" signal, surfaced honestly.
 *
 * Off-season / no transfer activity → empty lists, never a throw.
 */

export type PriceElement = {
  id: number;
  web_name: string;
  element_type: number;
  team: number;
  now_cost?: number;
  transfers_in_event?: number;
  transfers_out_event?: number;
  cost_change_event?: number;
  selected_by_percent?: string | null;
  status?: string;
};

export type PriceCandidate = {
  id: number;
  name: string;
  position: Position;
  teamShort: string;
  price: number; // £m
  netTransfers: number; // in − out this event
  flowPct: number; // net as % of total managers (signed)
  ownership: number; // %
  alreadyMoved: number; // cost_change_event in 0.1m (e.g. +1 already rose today)
  direction: "rise" | "fall";
  confidence: "low" | "medium" | "high";
};

export type PriceWatch = {
  risers: PriceCandidate[];
  fallers: PriceCandidate[];
};

// Net-flow thresholds (as % of all managers) for confidence tiers. These are
// heuristic — FPL's real cutoffs drift — but they separate noise from signal.
const MIN_FLOW = 0.4;
const MED_FLOW = 1.2;
const HIGH_FLOW = 2.5;

function confidenceFor(absFlow: number): PriceCandidate["confidence"] {
  if (absFlow >= HIGH_FLOW) return "high";
  if (absFlow >= MED_FLOW) return "medium";
  return "low";
}

export function computePriceWatch(args: {
  elements: PriceElement[];
  totalPlayers: number;
  teamShortById: Map<number, string>;
  limit?: number;
}): PriceWatch {
  const { elements, totalPlayers, teamShortById, limit = 8 } = args;
  if (totalPlayers <= 0) return { risers: [], fallers: [] };

  const candidates: PriceCandidate[] = [];
  for (const el of elements) {
    const tin = el.transfers_in_event ?? 0;
    const tout = el.transfers_out_event ?? 0;
    const net = tin - tout;
    const flowPct = (net / totalPlayers) * 100;
    if (Math.abs(flowPct) < MIN_FLOW) continue; // ignore noise

    candidates.push({
      id: el.id,
      name: el.web_name,
      position: positionOf(el.element_type),
      teamShort: teamShortById.get(el.team) ?? "—",
      price: (el.now_cost ?? 0) / 10,
      netTransfers: net,
      flowPct: Math.round(flowPct * 100) / 100,
      ownership: Number.parseFloat(el.selected_by_percent ?? "0") || 0,
      alreadyMoved: el.cost_change_event ?? 0,
      direction: net >= 0 ? "rise" : "fall",
      confidence: confidenceFor(Math.abs(flowPct)),
    });
  }

  const risers = candidates
    .filter((c) => c.direction === "rise")
    .sort((a, b) => b.flowPct - a.flowPct || a.id - b.id)
    .slice(0, limit);
  const fallers = candidates
    .filter((c) => c.direction === "fall")
    .sort((a, b) => a.flowPct - b.flowPct || a.id - b.id)
    .slice(0, limit);

  return { risers, fallers };
}
