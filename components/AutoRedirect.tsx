"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LAST_ENTRY_STORAGE_KEY, type StoredEntryProfile } from "@/lib/storage";

/**
 * Auto-redirects to the most recent entry dashboard if one exists in localStorage.
 * This prevents users from seeing the login page after they've already logged in.
 */
export function AutoRedirect() {
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LAST_ENTRY_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as StoredEntryProfile[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return;
      }

      const mostRecent = parsed[0];
      if (mostRecent?.entryId) {
        // Replace history entry so back button quits app instead of returning to home
        router.replace(`/${mostRecent.entryId}`);
      }
    } catch (error) {
      // Silently fail - user stays on home page
      if (process.env.NODE_ENV !== "production") {
        console.warn("Unable to auto-redirect to recent entry", error);
      }
    }
  }, [router]);

  return null;
}
