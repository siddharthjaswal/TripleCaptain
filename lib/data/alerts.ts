/**
 * Per-entry alert engine — deterministic, zero AI. Turns a manager's squad +
 * live bootstrap data into the signals worth a push notification: looming
 * deadline, injuries/doubts on owned players, captain risk, and price moves on
 * players they hold. Pure core so it's unit-testable and reusable by both the
 * Alerts Center page and the push-sending job.
 *
 * Empty squad / missing data degrade to an empty (or deadline-only) list.
 */

export type AlertCategory = "deadline" | "injury" | "suspension" | "captain" | "price";
export type AlertSeverity = "urgent" | "warning" | "info";

export type Alert = {
  id: string; // stable, dedupe-friendly (category + subject)
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  detail: string;
  player?: { name: string; teamShort: string };
};

export type AlertElement = {
  id: number;
  web_name: string;
  team: number;
  status?: string; // a=available i=injured d=doubt s=suspended u=unavailable n=not eligible
  chance_of_playing_next_round?: number | null;
  transfers_in_event?: number;
  transfers_out_event?: number;
  cost_change_event?: number;
  now_cost?: number;
};

export type AlertSquadPick = {
  elementId: number;
  isCaptain: boolean;
  isStarter: boolean; // positions 1-11
};

const STATUS_LABEL: Record<string, string> = {
  i: "Injured",
  s: "Suspended",
  u: "Unavailable",
  n: "Not eligible",
  d: "A doubt",
};
const HARD_OUT = new Set(["i", "s", "u", "n"]);

// Net-transfer flow (% of all managers) at which a price move is worth flagging
// for a player you own. Higher than the global Price Watch floor — we only want
// strong signals here.
const PRICE_FLOW_FLAG = 1.8;

export function buildEntryAlerts(args: {
  squad: AlertSquadPick[];
  elementsById: Map<number, AlertElement>;
  teamShortById: Map<number, string>;
  nextDeadline: { event: number; deadline: string | null } | null;
  totalPlayers: number;
  now: number;
}): Alert[] {
  const { squad, elementsById, teamShortById, nextDeadline, totalPlayers, now } = args;
  const alerts: Alert[] = [];

  // ---- Deadline ----
  if (nextDeadline?.deadline) {
    const ms = new Date(nextDeadline.deadline).getTime() - now;
    if (Number.isFinite(ms) && ms > 0) {
      const hours = ms / 3_600_000;
      if (hours <= 48) {
        alerts.push({
          id: `deadline-gw${nextDeadline.event}`,
          category: "deadline",
          severity: hours <= 6 ? "urgent" : "warning",
          title: `GW${nextDeadline.event} deadline ${formatCountdown(ms)}`,
          detail: "Lock in your transfers, captain and bench order before it closes.",
        });
      }
    }
  }

  // ---- Per-player squad signals ----
  for (const pick of squad) {
    const el = elementsById.get(pick.elementId);
    if (!el) continue;
    const name = el.web_name;
    const teamShort = teamShortById.get(el.team) ?? "—";
    const status = el.status ?? "a";

    // Injury / suspension / unavailable / doubt.
    if (status !== "a" && STATUS_LABEL[status]) {
      const isHardOut = HARD_OUT.has(status);
      const chance = el.chance_of_playing_next_round;
      const chanceTxt =
        status === "d" && typeof chance === "number" ? ` (${chance}% to play)` : "";
      // Captain in trouble is the most urgent thing in FPL.
      const severity: AlertSeverity = pick.isCaptain
        ? "urgent"
        : isHardOut && pick.isStarter
          ? "urgent"
          : "warning";
      alerts.push({
        id: `${status === "s" ? "suspension" : "injury"}-${el.id}`,
        category: status === "s" ? "suspension" : "injury",
        severity,
        title: `${name} — ${STATUS_LABEL[status]}${chanceTxt}`,
        detail: pick.isCaptain
          ? "Your captain is at risk — line up a replacement now."
          : pick.isStarter
            ? "A starter is flagged — check before the deadline."
            : "On your bench — keep an eye on it.",
        player: { name, teamShort },
      });
    }

    // Captain-specific doubt note even if only a soft 'd' that didn't hard-out above
    // is already covered; nothing extra needed here.

    // Price movement on an owned player.
    if (totalPlayers > 0) {
      const net = (el.transfers_in_event ?? 0) - (el.transfers_out_event ?? 0);
      const flowPct = (net / totalPlayers) * 100;
      if (Math.abs(flowPct) >= PRICE_FLOW_FLAG) {
        const rising = flowPct > 0;
        alerts.push({
          id: `price-${el.id}`,
          category: "price",
          severity: "info",
          title: `${name} is ${rising ? "rising" : "falling"} in price`,
          detail: rising
            ? "Strong net transfers in — your asset may rise tonight."
            : "Heavy sell-off — it may drop tonight; act if you were moving it on.",
          player: { name, teamShort },
        });
      }
    }
  }

  // Most urgent first, then a stable order by id.
  const rank: Record<AlertSeverity, number> = { urgent: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => rank[a.severity] - rank[b.severity] || a.id.localeCompare(b.id));
}

function formatCountdown(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `in ${d}d ${h}h`;
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${m}m`;
}
