"use client";

import { useState } from "react";
import Link from "next/link";
import { LAST_ENTRY_STORAGE_KEY, type StoredEntryProfile } from "@/lib/storage";

type RecentEntry = StoredEntryProfile & {
  ageLabel: string;
};

export function RecentEntryCard() {
  const [recent, setRecent] = useState<RecentEntry | null>(() => readRecent());

  const handleClear = () => {
    try {
      window.localStorage.removeItem(LAST_ENTRY_STORAGE_KEY);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Unable to clear recent entry", error);
      }
    }
    setRecent(null);
  };

  if (!recent) {
    return null;
  }

  return (
    <section className="w-full max-w-md rounded-3xl border border-slate-200/10 bg-slate-900/40 p-6 text-slate-100 shadow-lg backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Recently Viewed
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-50">
            {recent.teamName}
          </h2>
          <p className="text-sm text-slate-300">
            Managed by {recent.managerName}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="text-xs font-medium text-slate-400 transition hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          Clear
        </button>
      </div>
      <p className="mt-4 text-xs text-slate-400">
        Last visited {recent.ageLabel}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={`/${recent.entryId}`}
          className="inline-flex items-center rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-sky-400"
        >
          Open Dashboard
        </Link>
        <Link
          href={`/${recent.entryId}/leagues`}
          className="inline-flex items-center rounded-full border border-slate-700/60 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-sky-400/60 hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
        >
          View Leagues
        </Link>
      </div>
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

function readRecent(): RecentEntry | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(LAST_ENTRY_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredEntryProfile;
    if (!parsed?.entryId || !parsed?.teamName) {
      return null;
    }

    return {
      ...parsed,
      ageLabel: timeAgoLabel(parsed.persistedAt),
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Unable to read recent entry from storage", error);
    }
    return null;
  }
}
