"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { LeagueStandingDTO, LatestGwDTO } from "@/lib/fpl/dto";
import { formatNumber } from "@/lib/format";
import { useLeagueTeamPicks } from "@/hooks/useLeagueTeamPicks";
import { TeamPitchModal } from "./TeamPitchModal";

type LeagueTableProps = {
  league: LeagueStandingDTO;
  currentEntryId: number;
};

export function LeagueTable({ league, currentEntryId }: LeagueTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [selectedTeam, setSelectedTeam] = useState<{
    teamName: string;
    teamPicks: LatestGwDTO;
  } | null>(null);
  const gameweekLabel = league.gameweek ? `GW ${league.gameweek}` : null;

  // Fetch team picks for small leagues (< 20 members)
  const { entries: enrichedEntries } = useLeagueTeamPicks(
    league.entries,
    league.gameweek,
    league.entries.length < 20
  );

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <section className="tc-card rounded-3xl p-6 shadow-lg relative">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-semibold">{league.leagueName}</h2>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--accent)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3.5 w-3.5"
              >
                <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 5.404a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM6.464 14.596a.75.75 0 1 0-1.06-1.06l-1.06 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10ZM14.596 15.657a.75.75 0 0 0 1.06-1.06l-1.06-1.061a.75.75 0 1 0-1.06 1.06l1.06 1.06ZM5.404 6.464a.75.75 0 0 0 1.06-1.06l-1.06-1.06a.75.75 0 1 0-1.061 1.06l1.06 1.06Z" />
              </svg>
              Page {league.page}
            </span>
          </div>
        </div>
        {gameweekLabel ? (
          <span className="tc-chip">{gameweekLabel}</span>
        ) : null}
      </header>
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full table-fixed text-left text-sm">
          <thead className="tc-text-muted">
            <tr className="border-b border-[color:var(--surface-border)]">
              <th scope="col" className="w-16 px-3 py-2 font-medium">
                Rank
              </th>
              <th scope="col" className="w-16 px-3 py-2 font-medium">
                Δ
              </th>
              <th scope="col" className="min-w-[12rem] px-3 py-2 font-medium">
                Entry
              </th>
              <th scope="col" className="min-w-[10rem] px-3 py-2 font-medium">
                Manager
              </th>
              {enrichedEntries.length < 20 && (
                <th scope="col" className="min-w-[10rem] px-3 py-2 font-medium">
                  Captain
                </th>
              )}
              <th scope="col" className="w-28 px-3 py-2 font-medium text-right">
                GW Pts
              </th>
              <th scope="col" className="w-28 px-3 py-2 font-medium text-right">
                Total
              </th>
              {enrichedEntries.length < 20 && (
                <th scope="col" className="w-16 px-3 py-2 font-medium text-center">
                  Team
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--surface-border)]/60">
            {enrichedEntries.map((entry) => {
              const delta = formatRankDelta(entry.rank, entry.lastRank);
              const isCurrentUser = entry.entryId === currentEntryId;
              return (
                <tr
                  key={entry.entryId}
                  className={`transition ${
                    isCurrentUser
                      ? "bg-[color:var(--accent)]/10 hover:bg-[color:var(--accent)]/15"
                      : "hover:bg-[color:var(--surface-elevated)]/60"
                  }`}
                >
                  <td className="px-3 py-3">
                    {entry.rank ? (
                      <span className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-[color:var(--accent)]/15 px-2 text-xs font-bold text-[color:var(--accent)]">
                        {formatNumber(entry.rank)}
                      </span>
                    ) : (
                      <span className="text-sm tc-text-muted">—</span>
                    )}
                  </td>
                  <td
                    className={`px-3 py-3 font-mono text-xs transition ${delta.className}`}
                  >
                    {delta.label}
                  </td>
                  <td className={`px-3 py-3 ${isCurrentUser ? "font-bold" : "font-medium"}`}>
                    {entry.entryName}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs font-semibold text-[color:var(--accent)]">
                        (You)
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 tc-text-muted">
                    {entry.playerName}
                  </td>
                  {enrichedEntries.length < 20 && (
                    <td className="px-3 py-3">
                      {entry.isLoading ? (
                        <div className="h-4 w-24 animate-pulse rounded bg-[color:var(--surface-border)]/60" />
                      ) : entry.captain ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            C
                          </span>
                          <span className="text-sm font-medium">
                            {entry.captain.playerName}
                          </span>
                        </div>
                      ) : (
                        <span className="tc-text-muted text-xs">—</span>
                      )}
                    </td>
                  )}
                  <td className="px-3 py-3 text-right font-mono text-sm">
                    {formatNumber(entry.points)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-sm">
                    {formatNumber(entry.totalPoints)}
                  </td>
                  {enrichedEntries.length < 20 && (
                    <td className="px-3 py-3 text-center">
                      {entry.isLoading ? (
                        <div className="mx-auto h-4 w-4 animate-pulse rounded bg-[color:var(--surface-border)]/60" />
                      ) : entry.teamPicks ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedTeam({
                              teamName: entry.entryName,
                              teamPicks: entry.teamPicks,
                            })
                          }
                          className="tc-focus-visible inline-flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-[color:var(--surface-hover)] text-[color:var(--accent)]"
                          title="View team"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-4 w-4"
                          >
                            <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                            <path
                              fillRule="evenodd"
                              d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      ) : (
                        <span className="tc-text-muted text-xs">—</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {(league.page > 1 || league.hasNextPage) && (
        <div className="mt-6 flex items-center justify-center gap-2 border-t border-[color:var(--surface-border)] pt-6">
          <button
            type="button"
            onClick={() => handlePageChange(league.page - 1)}
            disabled={league.page === 1 || isPending}
            className="tc-focus-visible inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-[color:var(--surface-elevated)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                clipRule="evenodd"
              />
            </svg>
            Previous
          </button>
          <button
            type="button"
            onClick={() => handlePageChange(league.page + 1)}
            disabled={!league.hasNextPage || isPending}
            className="tc-focus-visible inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-[color:var(--surface-elevated)]"
          >
            Next
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-[color:var(--surface-root)]/60 backdrop-blur-sm rounded-3xl">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[color:var(--surface-border)] border-t-[color:var(--accent)]" />
            <p className="text-sm font-medium">Loading...</p>
          </div>
        </div>
      )}

      {/* Team Pitch Modal */}
      {selectedTeam && selectedTeam.teamPicks && (
        <TeamPitchModal
          teamPicks={selectedTeam.teamPicks}
          teamName={selectedTeam.teamName}
          isOpen={true}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </section>
  );
}

function formatRankDelta(
  current: number | null,
  previous: number | null,
): { label: string; className: string } {
  if (!current || !previous) {
    return { label: "—", className: "tc-text-muted" };
  }

  const delta = previous - current;

  if (delta === 0) {
    return { label: "↔", className: "tc-text-muted" };
  }

  if (delta > 0) {
    return { label: `↑${delta}`, className: "text-emerald-400" };
  }

  return { label: `↓${Math.abs(delta)}`, className: "text-rose-400" };
}
