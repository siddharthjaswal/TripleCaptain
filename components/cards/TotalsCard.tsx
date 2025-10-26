import type { TotalsDTO } from "@/lib/fpl/dto";

type TotalsCardProps = {
  totals: TotalsDTO;
};

export function TotalsCard({ totals }: TotalsCardProps) {
  return (
    <section className="rounded-3xl border border-slate-200/10 bg-slate-900/40 p-6 text-slate-100 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">
          Overall Performance
        </h2>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200">
          GW {totals.currentEvent}
        </span>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Kpi label="Total Points" value={totals.totalPoints.toLocaleString()} />
        <Kpi
          label="Overall Rank"
          value={
            totals.overallRank ? `#${totals.overallRank.toLocaleString()}` : "—"
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
    <div className="rounded-2xl border border-slate-700/40 bg-slate-900/60 px-4 py-5">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-50">{value}</p>
    </div>
  );
}
