"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LAST_ENTRY_STORAGE_KEY,
  MAX_RECENT_ENTRIES,
  type StoredEntryProfile,
} from "@/lib/storage";

export function RecentEntryCard() {
  const [recentEntries, setRecentEntries] = useState<
    Array<StoredEntryProfile & { ageLabel: string }>
  >([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setRecentEntries(readRecent());
  }, []);

  const handleClear = () => {
    try {
      window.localStorage.removeItem(LAST_ENTRY_STORAGE_KEY);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Unable to clear recent entry", error);
      }
    }
    setRecentEntries([]);
  };

  if (!isClient || recentEntries.length === 0) {
    return null;
  }

  return (
    <section className="tc-card w-full max-w-md rounded-3xl p-6 shadow-lg">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="tc-text-muted text-xs font-medium uppercase tracking-wide">
            Recently Viewed
          </p>
          <p className="tc-text-muted text-xs">
            Showing {recentEntries.length} of up to {MAX_RECENT_ENTRIES} saved
            entries
          </p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="tc-focus-visible text-xs font-medium text-[color:var(--accent)] transition hover:opacity-80"
        >
          Clear All
        </button>
      </header>
      <ul className="mt-4 space-y-3">
        {recentEntries.map((entry) => (
          <li
            key={entry.entryId}
            className="rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-elevated)]/90 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{entry.teamName}</p>
                <p className="tc-text-muted text-xs">
                  Managed by {entry.managerName}
                </p>
              </div>
              <span className="tc-text-muted text-xs">{entry.ageLabel}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/${entry.entryId}`}
                className="tc-focus-visible inline-flex items-center rounded-full bg-[color:var(--accent)] px-3 py-1.5 text-xs font-semibold text-[color:var(--accent-contrast)] transition hover:opacity-90"
              >
                Open Dashboard
              </Link>
              <Link
                href={`/${entry.entryId}/leagues`}
                className="tc-focus-visible inline-flex items-center rounded-full border border-[color:var(--surface-border)] px-3 py-1.5 text-xs font-medium transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
              >
                View Leagues
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function timeAgoLabel(timestamp: string): string {
  const persisted = new Date(timestamp).getTime();
  if (Number.isNaN(persisted)) {
    return "just now";
  }

  const diff = Date.now() - persisted;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes === 1) return "1 minute ago";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function readRecent(): Array<StoredEntryProfile & { ageLabel: string }> {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LAST_ENTRY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as StoredEntryProfile[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item) => item?.entryId && item?.teamName)
      .slice(0, MAX_RECENT_ENTRIES)
      .map((item) => ({
        ...item,
        ageLabel: timeAgoLabel(item.persistedAt),
      }));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Unable to read recent entry from storage", error);
    }
    return [];
  }
}
