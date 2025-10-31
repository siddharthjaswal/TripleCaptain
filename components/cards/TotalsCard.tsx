import type { TotalsDTO } from "@/lib/fpl/dto";
import { formatNumber } from "@/lib/format";

type TotalsCardProps = {
  totals: TotalsDTO;
};

export function TotalsCard({ totals }: TotalsCardProps) {
  return (
    <section className="tc-card rounded-3xl p-6 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <h2 className="tc-text-muted text-sm font-medium uppercase tracking-wide">
          Overall Performance
        </h2>
        <span className="tc-chip px-3 py-1 text-xs font-semibold">
          GW {totals.currentEvent}
        </span>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Kpi label="Total Points" value={formatNumber(totals.totalPoints)} />
        <KpiWithChange
          label="Overall Rank"
          value={
            totals.overallRank ? `#${formatNumber(totals.overallRank)}` : "—"
          }
          rankChange={totals.rankChange}
        />
      </div>
    </section>
  );
}

type KpiProps = {
  label: string;
  value: string;
};

function Kpi({ label, value }: KpiProps) {
  return (
    <div className="rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-elevated)]/90 px-4 py-5">
      <p className="tc-text-muted text-xs uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

type KpiWithChangeProps = {
  label: string;
  value: string;
  rankChange: number | null;
};

function KpiWithChange({ label, value, rankChange }: KpiWithChangeProps) {
  const hasChange = rankChange !== null && rankChange !== 0;
  const isImprovement = rankChange !== null && rankChange < 0; // Negative = rank went down = improvement
  const isWorsened = rankChange !== null && rankChange > 0; // Positive = rank went up = worsened

  return (
    <div className="rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-elevated)]/90 px-4 py-5">
      <p className="tc-text-muted text-xs uppercase tracking-wide">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <p className="text-2xl font-semibold">{value}</p>
        {hasChange && (
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
              isImprovement
                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                : isWorsened
                  ? "bg-red-500/10 text-red-700 dark:text-red-400"
                  : ""
            }`}
          >
            {isImprovement ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3 h-3"
              >
                <path
                  fillRule="evenodd"
                  d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3 h-3"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span>{formatNumber(Math.abs(rankChange))}</span>
          </div>
        )}
      </div>
    </div>
  );
}
