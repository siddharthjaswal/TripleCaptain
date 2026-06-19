/**
 * Set-piece & penalty hierarchy — who takes each club's pens, free-kicks and
 * corners, from FPL's published taker order. Zero AI, pure lookup.
 *
 * Penalty takers are a hidden points multiplier (a nailed pen taker is worth
 * extra goals + bonus), so surfacing the first-choice taker per club directly
 * sharpens picks. Order 1 = first choice; higher = next in line.
 *
 * Missing/empty order data → that slot is null, never a throw.
 */

export type SetPieceElement = {
  web_name: string;
  team: number;
  penalties_order?: number | null;
  direct_freekicks_order?: number | null;
  corners_and_indirect_freekicks_order?: number | null;
};

export type SetPieceTaker = { name: string; order: number };

export type TeamSetPieces = {
  teamShort: string;
  teamName: string;
  penalties: SetPieceTaker[]; // up to 3, ordered
  freekicks: SetPieceTaker[];
  corners: SetPieceTaker[];
};

function takersFor(
  els: SetPieceElement[],
  pick: (e: SetPieceElement) => number | null | undefined,
  limit = 3,
): SetPieceTaker[] {
  return els
    .map((e) => ({ name: e.web_name, order: pick(e) }))
    .filter((t): t is SetPieceTaker => typeof t.order === "number" && t.order > 0)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function computeSetPieceTakers(args: {
  elements: SetPieceElement[];
  teamShortById: Map<number, string>;
  teamNameById: Map<number, string>;
}): TeamSetPieces[] {
  const { elements, teamShortById, teamNameById } = args;

  const byTeam = new Map<number, SetPieceElement[]>();
  for (const el of elements) {
    const list = byTeam.get(el.team);
    if (list) list.push(el);
    else byTeam.set(el.team, [el]);
  }

  const out: TeamSetPieces[] = [];
  for (const [teamId, els] of byTeam) {
    const penalties = takersFor(els, (e) => e.penalties_order);
    const freekicks = takersFor(els, (e) => e.direct_freekicks_order);
    const corners = takersFor(els, (e) => e.corners_and_indirect_freekicks_order);
    // Skip clubs with no published taker data at all.
    if (penalties.length === 0 && freekicks.length === 0 && corners.length === 0) continue;
    out.push({
      teamShort: teamShortById.get(teamId) ?? "—",
      teamName: teamNameById.get(teamId) ?? "Unknown",
      penalties,
      freekicks,
      corners,
    });
  }

  return out.sort((a, b) => a.teamName.localeCompare(b.teamName));
}
