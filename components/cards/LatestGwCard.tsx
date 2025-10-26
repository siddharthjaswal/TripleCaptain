import type { LatestGwDTO } from "@/lib/fpl/dto";

type LatestGwCardProps = {
  latest: LatestGwDTO;
};

export function LatestGwCard({ latest }: LatestGwCardProps) {
  return (
    <section className="rounded-3xl border border-slate-200/10 bg-slate-900/40 p-6 text-slate-100 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-400">
          Latest Gameweek
        </h2>
        <StatusPill isLive={latest.isLive} event={latest.event} />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Metric label="GW Points" value={latest.points.toLocaleString()} />
        <Metric
          label="GW Rank"
          value={latest.rank ? `#${latest.rank.toLocaleString()}` : "—"}
        />
        <Metric label="Bench Points" value={latest.pointsOnBench.toString()} />
      </div>
      <div className="mt-6 text-sm text-slate-300">
        {latest.chipUsed ? (
          <p>
            Chip played:{" "}
            <span className="font-semibold uppercase tracking-wide text-sky-300">
              {latest.chipUsed.replace(/_/g, " ")}
            </span>
          </p>
        ) : (
          <p>No chip used this gameweek.</p>
        )}
      </div>
    </section>
  );
}

type StatusPillProps = {
  isLive: boolean;
  event: number;
};

function StatusPill({ isLive, event }: StatusPillProps) {
  if (isLive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase text-emerald-300 ring-1 ring-inset ring-emerald-500/40">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
        Live — GW {event}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase text-slate-300">
      Completed — GW {event}
    </span>
  );
}

type MetricProps = {
  label: string;
  value: string;
};

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-2xl border border-slate-700/40 bg-slate-900/60 px-4 py-5">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-50">{value}</p>
    </div>
  );
}
