"use client";

import { useState } from "react";
import Link from "next/link";
import { LAST_ENTRY_STORAGE_KEY, type StoredEntryProfile } from "@/lib/storage";

export function RecentEntryCard() {
  const [recentEntries, setRecentEntries] = useState<
    Array<StoredEntryProfile & { ageLabel: string }>
  >(() => readRecent());

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

  if (recentEntries.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-md rounded-3xl border border-slate-200/10 bg-slate-900/40 p-6 text-slate-100 shadow-lg backdrop-blur">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Recently Viewed
          </p>
          <p className="text-xs text-slate-400">
            Up to {recentEntries.length} saved entries
          </p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="text-xs font-medium text-slate-400 transition hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          Clear All
        </button>
      </header>
      <ul className="mt-4 space-y-3">
        {recentEntries.map((entry) => (
          <li
            key={entry.entryId}
            className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  {entry.teamName}
                </p>
                <p className="text-xs text-slate-400">
                  Managed by {entry.managerName}
                </p>
              </div>
              <span className="text-xs text-slate-400">
                {entry.ageLabel} ago
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/${entry.entryId}`}
                className="inline-flex items-center rounded-full bg-sky-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-sky-400"
              >
                Open Dashboard
              </Link>
              <Link
                href={`/${entry.entryId}/leagues`}
                className="inline-flex items-center rounded-full border border-slate-700/60 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-sky-400/60 hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
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
