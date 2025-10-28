import type { LatestGwDTO } from "@/lib/fpl/dto";

type LatestGwCardProps = {
  latest: LatestGwDTO;
};

export function LatestGwCard({ latest }: LatestGwCardProps) {
  return (
    <section className="tc-card rounded-3xl p-6 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <h2 className="tc-text-muted text-sm font-medium uppercase tracking-wide">
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
      <div className="mt-6 text-sm tc-text-muted">
        {latest.chipUsed ? (
          <p>
            Chip played:{" "}
            <span className="font-semibold uppercase tracking-wide text-[var(--accent)]">
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
    <span className="inline-flex items-center rounded-full bg-[color:var(--surface-border)]/30 px-3 py-1 text-xs font-semibold uppercase tc-text-muted">
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
    <div className="rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-elevated)]/90 px-4 py-5">
      <p className="tc-text-muted text-xs uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
