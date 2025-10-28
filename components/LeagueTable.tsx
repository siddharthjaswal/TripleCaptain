import type { LeagueStandingDTO } from "@/lib/fpl/dto";
import { formatNumber } from "@/lib/format";

type LeagueTableProps = {
  league: LeagueStandingDTO;
};

export function LeagueTable({ league }: LeagueTableProps) {
  const gameweekLabel = league.gameweek ? `GW ${league.gameweek}` : null;

  return (
    <section className="tc-card rounded-3xl p-6 shadow-lg">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{league.leagueName}</h2>
          <p className="tc-text-muted text-sm">
            Page {league.page}
            {league.hasNextPage ? " • More standings available" : ""}
          </p>
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
              return (
                <tr
                  key={entry.entryId}
                  className="transition hover:bg-[color:var(--surface-elevated)]/60"
                >
                  <td className="px-3 py-3 font-mono text-sm">
                    {entry.rank ? `#${formatNumber(entry.rank)}` : "—"}
                  </td>
                  <td
                    className={`px-3 py-3 font-mono text-xs transition ${delta.className}`}
                  >
                    {delta.label}
                  </td>
                  <td className="px-3 py-3 font-medium">{entry.entryName}</td>
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
