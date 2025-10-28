import type { LeagueStandingDTO } from "@/lib/fpl/dto";

type LeagueTableProps = {
  league: LeagueStandingDTO;
};

export function LeagueTable({ league }: LeagueTableProps) {
  const gameweekLabel = league.gameweek ? `GW ${league.gameweek}` : null;

  return (
    <section className="rounded-3xl border border-slate-200/10 bg-slate-900/40 p-6 text-slate-100 shadow-lg backdrop-blur">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-50">
            {league.leagueName}
          </h2>
          <p className="text-sm text-slate-400">
            Page {league.page}
            {league.hasNextPage ? " • More standings available" : ""}
          </p>
        </div>
      </header>
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full table-fixed text-left text-sm">
          <thead className="text-slate-300">
            <tr className="border-b border-slate-700/50">
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
                GW Pts{gameweekLabel ? ` (${gameweekLabel})` : ""}
              </th>
              <th scope="col" className="w-28 px-3 py-2 font-medium text-right">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {league.entries.map((entry) => {
              const delta = formatRankDelta(entry.rank, entry.lastRank);
              return (
                <tr
                  key={entry.entryId}
                  className="transition hover:bg-slate-800/40"
                >
                  <td className="px-3 py-3 font-mono text-sm text-slate-100">
                    {entry.rank ? `#${entry.rank}` : "—"}
                  </td>
                  <td
                    className={`px-3 py-3 font-mono text-xs transition ${delta.className}`}
                  >
                    {delta.label}
                  </td>
                  <td className="px-3 py-3 font-medium text-slate-100">
                    {entry.entryName}
                  </td>
                  <td className="px-3 py-3 text-slate-300">
                    {entry.playerName}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-sm text-slate-100">
                    {entry.points.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-sm text-slate-100">
                    {entry.totalPoints.toLocaleString()}
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
    return { label: "—", className: "text-slate-400" };
  }

  const delta = previous - current;

  if (delta === 0) {
    return { label: "↔", className: "text-slate-400" };
  }

  if (delta > 0) {
    return { label: `↑${delta}`, className: "text-emerald-400" };
  }

  return { label: `↓${Math.abs(delta)}`, className: "text-rose-400" };
}
