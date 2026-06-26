"use client";

import { useEffect } from "react";

/**
 * Registers the push service worker once on load. Silent and best-effort —
 * unsupported browsers or registration failures are ignored. Registration alone
 * grants no notification permission; that's requested later via EnableNotifications.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* best-effort: ignore */
      });
    };
    if (document.readyState === "complete") onLoad();
    else {
      window.addEventListener("load", onLoad);
      return () => window.removeEventListener("load", onLoad);
    }
  }, []);

  return null;
}
