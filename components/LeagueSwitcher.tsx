"use client";

import { useEffect, useRef, useTransition } from "react";
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

export function LeagueSwitcher({
  entryId,
  leagues,
  selectedLeagueId,
}: LeagueSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const hasSyncedPreference = useRef(false);

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
    <div className="flex flex-wrap gap-2">
      {leagues.map((league) => {
        const isActive = league.id === selectedLeagueId;
        const displayName = `${league.name} #${league.entryRank}`;
        return (
          <button
            key={league.id}
            type="button"
            onClick={() => handleSelect(league.id)}
            disabled={isActive || isPending}
            className={`tc-focus-visible rounded-full px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-[color:var(--accent)] text-[color:var(--accent-contrast)]"
                : "border border-[color:var(--surface-border)] bg-[color:var(--surface-elevated)]/90 text-[color:var(--text-primary)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
            }`}
          >
            {displayName}
          </button>
        );
      })}
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
