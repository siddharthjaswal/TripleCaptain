import type { TotalsDTO, LatestGwDTO } from "@/lib/fpl/dto";
import { formatNumber } from "@/lib/format";
import { TrendingUp, TrendingDown } from "lucide-react";

type StatBarProps = {
  totals: TotalsDTO;
  latest: LatestGwDTO;
};

/** Compact rank: 4,721,829 -> "4.7M", 512,000 -> "512K". */
function compactRank(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `#${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `#${Math.round(n / 1000)}K`;
  return `#${formatNumber(n)}`;
}

/**
 * The consolidated 4-metric scoreboard that sits at the top of the dashboard:
 * GW Points · Total Points · Overall Rank (with movement) · Avg / GW.
 */
export function StatBar({ totals, latest }: StatBarProps) {
  const avg =
    totals.currentEvent > 0
      ? (totals.totalPoints / totals.currentEvent).toFixed(1)
      : "—";

  const hasRankChange = totals.rankChange !== null && totals.rankChange !== 0;
  const rankImproved = totals.rankChange !== null && totals.rankChange < 0;

  return (
    <div className="tc-card grid grid-cols-2 divide-[color:var(--surface-border)] sm:grid-cols-4 sm:divide-x">
      <Stat
        label={`GW${latest.event} Points`}
        value={formatNumber(latest.points)}
        tone="cyan"
      />
      <Stat
        label="Total Points"
        value={formatNumber(totals.totalPoints)}
        tone="accent"
      />
      <Stat label="Overall Rank" value={compactRank(totals.overallRank)} tone="cyan">
        {hasRankChange && (
          <span
            className={`mt-1 flex items-center gap-1 text-[11px] font-black ${
              rankImproved
                ? "text-[color:var(--success-text)]"
                : "text-[color:var(--error)]"
            }`}
          >
            {rankImproved ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {formatNumber(Math.abs(totals.rankChange as number))}
          </span>
        )}
      </Stat>
      <Stat label="Avg / GW" value={avg} tone="gold" />
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  children,
}: {
  label: string;
  value: string;
  tone: "cyan" | "accent" | "gold";
  children?: React.ReactNode;
}) {
  const toneClass = {
    cyan: "text-[color:var(--brand-secondary)]",
    accent: "text-[color:var(--accent)]",
    gold: "text-[color:var(--brand-gold)]",
  }[tone];

  return (
    <div className="flex flex-col items-center px-4 py-5 text-center sm:py-6">
      <span className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-tertiary)]">
        {label}
      </span>
      <span className={`tc-numeric mt-1.5 text-2xl font-black sm:text-3xl ${toneClass}`}>
        {value}
      </span>
      {children}
    </div>
  );
}
