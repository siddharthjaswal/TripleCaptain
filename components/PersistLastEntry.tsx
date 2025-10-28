"use client";

import { useEffect } from "react";
import { LAST_ENTRY_STORAGE_KEY, type StoredEntryProfile } from "@/lib/storage";

type PersistLastEntryProps = {
  entryId: number;
  teamName: string;
  managerName: string;
};

export function PersistLastEntry({
  entryId,
  teamName,
  managerName,
}: PersistLastEntryProps) {
  useEffect(() => {
    try {
      const payload: StoredEntryProfile = {
        entryId,
        teamName,
        managerName,
        persistedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(
        LAST_ENTRY_STORAGE_KEY,
        JSON.stringify(payload),
      );
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Unable to persist last entry", error);
      }
    }
  }, [entryId, teamName, managerName]);

  return null;
}
