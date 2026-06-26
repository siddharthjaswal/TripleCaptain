"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

type State = "checking" | "unsupported" | "unconfigured" | "off" | "on" | "denied" | "busy";

function urlBase64ToUint8Array(base64: string): BufferSource {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const buffer = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Opt-in control for Web Push alerts on this device. Renders nothing until the
 * VAPID public key is configured (so the feature stays invisible until the keys
 * exist). Handles permission, subscription, and unsubscribe.
 */
export function EnableNotifications({ entryId }: { entryId: number }) {
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    // Determine the synchronously-knowable state from browser capabilities once
    // on mount (these APIs aren't available during SSR, so this must be an effect).
    const initial: State | null = !VAPID_PUBLIC_KEY
      ? "unconfigured"
      : typeof window === "undefined" ||
          !("serviceWorker" in navigator) ||
          !("PushManager" in window) ||
          !("Notification" in window)
        ? "unsupported"
        : Notification.permission === "denied"
          ? "denied"
          : null;

    if (initial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot capability read
      setState(initial);
      return;
    }

    // Otherwise resolve the live subscription state asynchronously.
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "on" : "off"))
      .catch(() => setState("off"));
  }, []);

  const enable = async () => {
    setState("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setState(permission === "denied" ? "denied" : "off");

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), entryId }),
      });
      setState(res.ok ? "on" : "off");
    } catch {
      setState("off");
    }
  };

  const disable = async () => {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => {});
        await sub.unsubscribe().catch(() => {});
      }
      setState("off");
    } catch {
      setState("on");
    }
  };

  // Invisible states: don't clutter the page when push can't work here.
  if (state === "checking" || state === "unconfigured" || state === "unsupported") return null;

  const denied = state === "denied";
  const on = state === "on";
  const busy = state === "busy";

  return (
    <div className="tc-card flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            on ? "bg-cyan-500/15 text-cyan-400" : "bg-[color:var(--surface-hover)] text-[color:var(--text-secondary)]"
          }`}
        >
          {on ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        </div>
        <div>
          <p className="text-sm font-bold">
            {on ? "Push alerts are on for this device" : "Get push alerts on this device"}
          </p>
          <p className="text-xs tc-text-muted">
            {denied
              ? "Notifications are blocked in your browser settings — re-enable them there."
              : "Price moves, injuries to your players, and deadline reminders."}
          </p>
        </div>
      </div>
      {!denied && (
        <button
          type="button"
          onClick={on ? disable : enable}
          disabled={busy}
          className={`tc-focus-visible inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition disabled:opacity-60 ${
            on
              ? "border border-[color:var(--surface-border)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
              : "bg-[color:var(--accent)] text-[color:var(--accent-contrast)] hover:opacity-90"
          }`}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : on ? (
            <BellOff className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {busy ? "Working…" : on ? "Turn off" : "Enable"}
        </button>
      )}
    </div>
  );
}
