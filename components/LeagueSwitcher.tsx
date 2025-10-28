"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LeagueSummaryDTO } from "@/lib/fpl/dto";

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

  if (leagues.length === 0) {
    return (
      <p className="rounded-2xl border border-slate-700/60 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
        This entry is not part of any classic leagues yet.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {leagues.map((league) => {
        const isActive = league.id === selectedLeagueId;
        return (
          <button
            key={league.id}
            type="button"
            onClick={() => handleSelect(league.id)}
            disabled={isActive || isPending}
            className={`rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-sky-400 ${isActive ? "bg-sky-500 text-slate-950" : "border border-slate-700/60 bg-slate-900/60 text-slate-200 hover:border-sky-400/60 hover:text-sky-200"}`}
          >
            {league.name}
          </button>
        );
      })}
    </div>
  );

  function handleSelect(leagueId: number) {
    startTransition(() => {
      const url = `/${entryId}/leagues?leagueId=${leagueId}`;
      router.push(url);
    });
  }
}
