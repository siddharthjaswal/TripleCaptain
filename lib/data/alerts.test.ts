import { describe, expect, it } from "vitest";
import { buildEntryAlerts, type AlertElement, type AlertSquadPick } from "./alerts";

const teamShortById = new Map([
  [1, "ARS"],
  [2, "AVL"],
]);
const NOW = Date.UTC(2026, 7, 15, 12, 0, 0);

function el(id: number, p: Partial<AlertElement>): AlertElement {
  return { id, web_name: `P${id}`, team: 1, status: "a", ...p };
}
function pick(elementId: number, p: Partial<AlertSquadPick> = {}): AlertSquadPick {
  return { elementId, isCaptain: false, isStarter: true, ...p };
}

describe("buildEntryAlerts", () => {
  it("flags an imminent deadline as urgent", () => {
    const deadline = new Date(NOW + 3 * 3_600_000).toISOString(); // 3h away
    const alerts = buildEntryAlerts({
      squad: [],
      elementsById: new Map(),
      teamShortById,
      nextDeadline: { event: 5, deadline },
      totalPlayers: 1_000_000,
      now: NOW,
    });
    const d = alerts.find((a) => a.category === "deadline");
    expect(d?.severity).toBe("urgent");
    expect(d?.title).toMatch(/GW5 deadline/);
  });

  it("does not flag a deadline that is more than 48h away", () => {
    const deadline = new Date(NOW + 72 * 3_600_000).toISOString();
    const alerts = buildEntryAlerts({
      squad: [],
      elementsById: new Map(),
      teamShortById,
      nextDeadline: { event: 5, deadline },
      totalPlayers: 1_000_000,
      now: NOW,
    });
    expect(alerts).toHaveLength(0);
  });

  it("escalates an injured captain to urgent and labels status", () => {
    const elementsById = new Map([[10, el(10, { status: "i" })]]);
    const alerts = buildEntryAlerts({
      squad: [pick(10, { isCaptain: true })],
      elementsById,
      teamShortById,
      nextDeadline: null,
      totalPlayers: 1_000_000,
      now: NOW,
    });
    const inj = alerts.find((a) => a.category === "injury");
    expect(inj?.severity).toBe("urgent");
    expect(inj?.title).toMatch(/Injured/);
    expect(inj?.player?.teamShort).toBe("ARS");
  });

  it("flags a doubtful starter with chance, but as a warning not urgent", () => {
    const elementsById = new Map([
      [11, el(11, { status: "d", chance_of_playing_next_round: 50 })],
    ]);
    const alerts = buildEntryAlerts({
      squad: [pick(11)],
      elementsById,
      teamShortById,
      nextDeadline: null,
      totalPlayers: 1_000_000,
      now: NOW,
    });
    const inj = alerts.find((a) => a.category === "injury");
    expect(inj?.severity).toBe("warning");
    expect(inj?.title).toMatch(/50% to play/);
  });

  it("flags a strong price move on an owned player and ignores small flow", () => {
    const elementsById = new Map([
      [20, el(20, { transfers_in_event: 40_000, transfers_out_event: 1_000 })], // +3.9%
      [21, el(21, { transfers_in_event: 1_000, transfers_out_event: 1_200 })], // tiny → ignore
    ]);
    const alerts = buildEntryAlerts({
      squad: [pick(20), pick(21)],
      elementsById,
      teamShortById,
      nextDeadline: null,
      totalPlayers: 1_000_000,
      now: NOW,
    });
    const price = alerts.filter((a) => a.category === "price");
    expect(price).toHaveLength(1);
    expect(price[0].title).toMatch(/rising/);
  });

  it("sorts urgent before warning before info", () => {
    const elementsById = new Map([
      [10, el(10, { status: "i" })], // urgent (captain)
      [20, el(20, { transfers_in_event: 40_000, transfers_out_event: 0 })], // info price
    ]);
    const alerts = buildEntryAlerts({
      squad: [pick(10, { isCaptain: true }), pick(20)],
      elementsById,
      teamShortById,
      nextDeadline: { event: 5, deadline: new Date(NOW + 3 * 3_600_000).toISOString() },
      totalPlayers: 1_000_000,
      now: NOW,
    });
    const severities = alerts.map((a) => a.severity);
    // urgent(s) first, info last
    expect(severities[0]).toBe("urgent");
    expect(severities[severities.length - 1]).toBe("info");
  });
});
