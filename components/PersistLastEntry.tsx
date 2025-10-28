"use client";

import { useEffect } from "react";
import {
  LAST_ENTRY_STORAGE_KEY,
  MAX_RECENT_ENTRIES,
  type StoredEntryProfile,
} from "@/lib/storage";

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
    persistRecentEntry({ entryId, teamName, managerName });
  }, [entryId, teamName, managerName]);

  return null;
}

function persistRecentEntry(payload: {
  entryId: number;
  teamName: string;
  managerName: string;
}) {
  try {
    const existingRaw = window.localStorage.getItem(LAST_ENTRY_STORAGE_KEY);
    const existing: StoredEntryProfile[] = existingRaw
      ? (JSON.parse(existingRaw) as StoredEntryProfile[])
      : [];

    const filtered = existing.filter(
      (item) => item.entryId !== payload.entryId,
    );
    const next: StoredEntryProfile[] = [
      {
        ...payload,
        persistedAt: new Date().toISOString(),
      },
      ...filtered,
    ].slice(0, MAX_RECENT_ENTRIES);

    window.localStorage.setItem(LAST_ENTRY_STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Unable to persist recent entry", error);
    }
  }
}
