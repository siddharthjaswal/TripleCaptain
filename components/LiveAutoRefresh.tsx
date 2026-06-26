"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * While a gameweek is live, re-fetch the server component on an interval so live
 * points keep ticking without a manual refresh. Inert when not live.
 */
export function LiveAutoRefresh({ enabled, intervalMs = 60_000 }: { enabled: boolean; intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs, router]);
  return null;
}
