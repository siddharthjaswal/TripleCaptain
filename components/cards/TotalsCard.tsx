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
        <Kpi
          label="Overall Rank"
          value={
            totals.overallRank ? `#${formatNumber(totals.overallRank)}` : "—"
          }
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
