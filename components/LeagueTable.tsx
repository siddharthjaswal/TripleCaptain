"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { LeagueStandingDTO } from "@/lib/fpl/dto";
import { formatNumber } from "@/lib/format";

type LeagueTableProps = {
  league: LeagueStandingDTO;
  currentEntryId: number;
};

export function LeagueTable({ league, currentEntryId }: LeagueTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const gameweekLabel = league.gameweek ? `GW ${league.gameweek}` : null;

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <section className="tc-card rounded-3xl p-6 shadow-lg">
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
              <th scope="col" className="w-28 px-3 py-2 font-medium text-right">
                GW Pts
              </th>
              <th scope="col" className="w-28 px-3 py-2 font-medium text-right">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--surface-border)]/60">
            {league.entries.map((entry) => {
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
                  <td className="px-3 py-3 text-right font-mono text-sm">
                    {formatNumber(entry.points)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-sm">
                    {formatNumber(entry.totalPoints)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {(league.page > 1 || league.hasNextPage) && (
        <div className="mt-6 flex items-center justify-between border-t border-[color:var(--surface-border)] pt-6">
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
            {isPending ? "Loading..." : "Previous"}
          </button>
          <button
            type="button"
            onClick={() => handlePageChange(league.page + 1)}
            disabled={!league.hasNextPage || isPending}
            className="tc-focus-visible inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-[color:var(--surface-elevated)]"
          >
            {isPending ? "Loading..." : "Next"}
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
