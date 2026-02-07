"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LeagueSummaryDTO } from "@/lib/fpl/dto";
import {
  getStoredLeaguePreference,
  setStoredLeaguePreference,
} from "@/lib/storage";
import { Badge } from "./ui";
import { ChevronDown, ChevronUp } from "lucide-react";

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

  const smallLeagues = leagues.filter(
    (league) => league.entryRank !== null && league.entryRank < SMALL_LEAGUE_THRESHOLD
  );
  const largeLeagues = leagues.filter(
    (league) => league.entryRank !== null && league.entryRank >= SMALL_LEAGUE_THRESHOLD
  );

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

  const handleSelect = (leagueId: number) => {
    setStoredLeaguePreference(entryId, leagueId);
    startTransition(() => {
      const url = `/${entryId}/leagues?leagueId=${leagueId}`;
      router.push(url);
    });
  };

  if (leagues.length === 0) {
    return (
        <Badge variant="secondary" className="px-4 py-2">No classic leagues joined</Badge>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {displayedLeagues.map((league) => {
        const isActive = league.id === selectedLeagueId;
        return (
          <button
            key={league.id}
            onClick={() => handleSelect(league.id)}
            disabled={isActive || isPending}
            className={`flex items-center gap-3 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              isActive
                ? "bg-[color:var(--accent)] text-[color:var(--accent-contrast)] shadow-lg shadow-[color:var(--accent)]/30 scale-105"
                : "bg-white/5 border border-white/5 text-white/50 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className="truncate max-w-[150px]">{league.name}</span>
            <div className={`px-1.5 py-0.5 rounded bg-black/20 text-[9px] font-black ${isActive ? 'text-white' : 'text-[color:var(--accent)]'}`}>
                {league.entryRank}
            </div>
          </button>
        );
      })}
      
      {largeLeagues.length > 0 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-white/40 hover:bg-white/10 hover:text-white transition-all"
        >
          {showAll ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {showAll ? 'Show Smaller' : `+${largeLeagues.length} Large Leagues`}
        </button>
      )}
    </div>
  );
}
