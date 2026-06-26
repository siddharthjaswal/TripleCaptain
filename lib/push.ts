import webpush from "web-push";

/**
 * Web Push helper — VAPID-gated, like the AI client. Inert until the keys exist,
 * so the app and the alert job run fine without them. No "server-only" import so
 * the headless send script (tsx) can use it too.
 *
 * Env (user-added):
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY  — the keypair (web-push generate-vapid-keys)
 *   VAPID_SUBJECT                        — "mailto:you@example.com" or a https URL
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY         — the public key, exposed to the browser
 */

const PUBLIC = process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:alerts@triplecaptain.in";

// Hosts of the legitimate browser push services. We only ever make outbound
// requests to these — without this allowlist the stored `endpoint` would be an
// SSRF primitive (the send job would fetch any attacker-supplied URL/port).
const ALLOWED_PUSH_HOSTS = [
  "fcm.googleapis.com", // Chrome / Android (FCM)
  ".googleapis.com", // FCM variants
  ".push.services.mozilla.com", // Firefox
  ".notify.windows.com", // Edge / WNS
  ".push.microsoftcloud.com", // newer WNS
  ".push.apple.com", // Safari
];

/** True only for https endpoints hosted by a known Web Push service. */
export function isAllowedPushEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  return ALLOWED_PUSH_HOSTS.some((h) =>
    h.startsWith(".") ? host.endsWith(h) : host === h,
  );
}

let configured = false;
export function isPushConfigured(): boolean {
  if (configured) return true;
  if (!PUBLIC || !PRIVATE) return false;
  webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE);
  configured = true;
  return true;
}

export type PushTarget = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  severity?: "urgent" | "warning" | "info";
};

/**
 * Send one notification. Returns "ok", or "gone" if the subscription is expired
 * (HTTP 404/410 — caller should delete it), or "error". Never throws.
 */
export async function sendPush(
  target: PushTarget,
  payload: PushPayload,
): Promise<"ok" | "gone" | "error"> {
  if (!isPushConfigured()) return "error";
  // Defence-in-depth: never fetch an endpoint outside the allowlist, even if a
  // legacy row predates subscribe-time validation.
  if (!isAllowedPushEndpoint(target.endpoint)) return "error";
  try {
    await webpush.sendNotification(
      { endpoint: target.endpoint, keys: target.keys },
      JSON.stringify(payload),
    );
    return "ok";
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return "gone";
    console.error("sendPush failed:", status ?? err);
    return "error";
  }
}
