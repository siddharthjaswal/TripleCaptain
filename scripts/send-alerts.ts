import "dotenv/config";
import { prisma } from "../lib/prisma";
import { buildEntryAlerts, type AlertElement } from "../lib/data/alerts";
import { isPushConfigured, sendPush } from "../lib/push";

/**
 * Headless alert sender — for each Web Push subscription, compute that FPL
 * entry's alerts and push the urgent/notable ones. Deterministic, zero AI.
 * Runs from a scheduled GitHub Action (push.yml). Inert without VAPID keys.
 *
 * Uses the public FPL API directly + the pure alerts core (no "server-only"
 * imports), so it runs fine under tsx outside Next.
 */

const FPL = "https://fantasy.premierleague.com/api";

type Bootstrap = {
  total_players: number;
  events: Array<{ id: number; finished: boolean; deadline_time: string }>;
  teams: Array<{ id: number; short_name: string }>;
  elements: AlertElement[];
};

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

async function main() {
  if (!isPushConfigured()) {
    console.log("Push not configured (no VAPID keys) — nothing to send.");
    return;
  }

  const subs = await prisma.pushSubscription.findMany();
  if (subs.length === 0) {
    console.log("No subscriptions.");
    return;
  }

  const bootstrap = await getJson<Bootstrap>(`${FPL}/bootstrap-static/`);
  if (!bootstrap) {
    console.error("Could not load bootstrap — aborting.");
    return;
  }

  const teamShortById = new Map(bootstrap.teams.map((t) => [t.id, t.short_name]));
  const elementsById = new Map(bootstrap.elements.map((e) => [e.id, e]));
  const nextUnfinished = bootstrap.events.find((e) => !e.finished) ?? null;
  const nextDeadline = nextUnfinished
    ? { event: nextUnfinished.id, deadline: nextUnfinished.deadline_time }
    : null;
  const currentEvent =
    bootstrap.events.filter((e) => e.finished).pop()?.id ??
    bootstrap.events[bootstrap.events.length - 1]?.id ??
    1;

  // Cache picks per entryId (multiple devices share an entry).
  const squadCache = new Map<number, Array<{ elementId: number; isCaptain: boolean; isStarter: boolean }>>();
  async function squadFor(entryId: number) {
    if (squadCache.has(entryId)) return squadCache.get(entryId)!;
    let picks = await getJson<{ picks: Array<{ element: number; position: number; is_captain: boolean }> }>(
      `${FPL}/entry/${entryId}/event/${currentEvent}/picks/`,
    );
    if (!picks && currentEvent > 1) {
      picks = await getJson(`${FPL}/entry/${entryId}/event/${currentEvent - 1}/picks/`);
    }
    const squad = (picks?.picks ?? []).map((p) => ({
      elementId: p.element,
      isCaptain: p.is_captain,
      isStarter: p.position <= 11,
    }));
    squadCache.set(entryId, squad);
    return squad;
  }

  const now = Date.now();
  let sent = 0;
  let removed = 0;

  for (const sub of subs) {
    const squad = await squadFor(sub.entryId);
    const alerts = buildEntryAlerts({
      squad,
      elementsById,
      teamShortById,
      nextDeadline,
      totalPlayers: bootstrap.total_players,
      now,
    });
    if (alerts.length === 0) continue;

    // Dedupe: skip if we already pushed this exact alert set to this device.
    const hash = alerts.map((a) => a.id).join("|");
    if (sub.lastAlertHash === hash) continue;

    const top = alerts[0];
    const more = alerts.length - 1;
    const result = await sendPush(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      {
        title: top.title,
        body: more > 0 ? `${top.detail} (+${more} more — tap to view)` : top.detail,
        url: `/${sub.entryId}/alerts`,
        tag: "tc-alerts",
        severity: top.severity,
      },
    );

    if (result === "gone") {
      await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {});
      removed++;
    } else if (result === "ok") {
      await prisma.pushSubscription.update({
        where: { endpoint: sub.endpoint },
        data: { lastNotifiedAt: new Date(now), lastAlertHash: hash },
      }).catch(() => {});
      sent++;
    }
  }

  console.log(`Alerts: ${sent} sent, ${removed} stale subscriptions removed, ${subs.length} total.`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
