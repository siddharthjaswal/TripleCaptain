"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LeagueSummaryDTO } from "@/lib/fpl/dto";
import {
  getStoredLeaguePreference,
  setStoredLeaguePreference,
} from "@/lib/storage";

type LeagueSwitcherProps = {
  entryId: number;
  leagues: LeagueSummaryDTO[];
  selectedLeagueId: number | null;
};

const SMALL_LEAGUE_THRESHOLD = 100;

export function LeagueSwitcher({
  entryId,
  leagues,
  selectedLeagueId,
}: LeagueSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAll, setShowAll] = useState(false);
  const hasSyncedPreference = useRef(false);

  // Filter leagues: small ones (< 100 members) vs large ones
  const smallLeagues = leagues.filter(
    (league) => league.entryRank !== null && league.entryRank < SMALL_LEAGUE_THRESHOLD
  );
  const largeLeagues = leagues.filter(
    (league) => league.entryRank !== null && league.entryRank >= SMALL_LEAGUE_THRESHOLD
  );

  // Always show the selected league even if it's large
  const displayedLeagues = showAll
    ? leagues
    : selectedLeagueId && largeLeagues.some((l) => l.id === selectedLeagueId)
    ? [...smallLeagues, ...largeLeagues.filter((l) => l.id === selectedLeagueId)]
    : smallLeagues;

  useEffect(() => {
    if (hasSyncedPreference.current) return;
    const stored = getStoredLeaguePreference(entryId);
    if (!stored || stored === selectedLeagueId) return;
    if (!leagues.some((league) => league.id === stored)) return;
    hasSyncedPreference.current = true;
    startTransition(() => {
      router.replace(`/${entryId}/leagues?leagueId=${stored}`);
    });
  }, [entryId, leagues, router, selectedLeagueId, startTransition]);

  if (leagues.length === 0) {
    return (
      <p className="tc-card tc-text-muted rounded-2xl px-4 py-3 text-sm">
        This entry is not part of any classic leagues yet.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayedLeagues.map((league) => {
        const isActive = league.id === selectedLeagueId;
        return (
          <button
            key={league.id}
            type="button"
            onClick={() => handleSelect(league.id)}
            disabled={isActive || isPending}
            className={`tc-focus-visible inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              isActive
                ? "bg-[color:var(--accent)] text-[color:var(--accent-contrast)]"
                : "border border-[color:var(--surface-border)] bg-[color:var(--surface-elevated)]/90 text-[color:var(--text-primary)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
            }`}
          >
            <span className="truncate max-w-[200px]">{league.name}</span>
            <span
              className={`inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                isActive
                  ? "bg-[color:var(--accent-contrast)]/20 text-[color:var(--accent-contrast)]"
                  : "bg-[color:var(--accent)]/15 text-[color:var(--accent)]"
              }`}
            >
              {league.entryRank}
            </span>
          </button>
        );
      })}
      {largeLeagues.length > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="tc-focus-visible inline-flex items-center gap-1.5 rounded-full border border-[color:var(--surface-border)] bg-[color:var(--surface-elevated)]/90 px-3 py-1.5 text-xs font-medium text-[color:var(--text-secondary)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
        >
          {showAll ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3 w-3"
              >
                <path
                  fillRule="evenodd"
                  d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
              Show Less
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3 w-3"
              >
                <path
                  fillRule="evenodd"
                  d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
              +{largeLeagues.length} More
            </>
          )}
        </button>
      )}
    </div>
  );

  function handleSelect(leagueId: number) {
    setStoredLeaguePreference(entryId, leagueId);
    startTransition(() => {
      const url = `/${entryId}/leagues?leagueId=${leagueId}`;
      router.push(url);
    });
  }
}
