import { getBootstrap } from "@/lib/fpl/client";
import { computePriceWatch, type PriceCandidate } from "@/lib/data/price";
import { TrendingUp, TrendingDown } from "lucide-react";

const CONF: Record<PriceCandidate["confidence"], string> = {
  high: "bg-[color:var(--brand-gold)]/20 text-[color:var(--brand-gold)]",
  medium: "bg-[color:var(--surface-hover)] text-[color:var(--text-secondary)]",
  low: "bg-[color:var(--surface-hover)] text-[color:var(--text-tertiary)]",
};

/**
 * Price Watch — transfer-momentum view of likely overnight price moves. Reads
 * live bootstrap transfer counts (zero AI). Off-season the market is quiet, so
 * it shows a gentle empty state rather than vanishing.
 */
export async function PriceWatch() {
  const bootstrap = await getBootstrap().catch(() => null);
  if (!bootstrap) return null;

  const teamShortById = new Map(bootstrap.teams.map((t) => [t.id, t.short_name]));
  const { risers, fallers } = computePriceWatch({
    elements: bootstrap.elements,
    totalPlayers: bootstrap.total_players,
    teamShortById,
  });

  const quiet = risers.length === 0 && fallers.length === 0;

  return (
    <section className="tc-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[color:var(--surface-border)] px-5 py-4">
        <div>
          <h2 className="font-display text-lg font-black uppercase tracking-tight">Price Watch</h2>
          <p className="text-xs tc-text-muted">
            Transfer momentum — where the market is moving. An approximation of FPL&apos;s price algorithm.
          </p>
        </div>
        <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-400">
          Zero AI
        </span>
      </div>

      {quiet ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm font-bold">The transfer market is quiet.</p>
          <p className="mt-1 text-xs tc-text-muted">
            Predicted risers and fallers appear here once the season is live.
          </p>
        </div>
      ) : (
        <div className="grid gap-px bg-[color:var(--surface-border)] sm:grid-cols-2">
          <PriceColumn title="Predicted Risers" icon="up" rows={risers} />
          <PriceColumn title="Predicted Fallers" icon="down" rows={fallers} />
        </div>
      )}
    </section>
  );
}

function PriceColumn({
  title,
  icon,
  rows,
}: {
  title: string;
  icon: "up" | "down";
  rows: PriceCandidate[];
}) {
  const up = icon === "up";
  return (
    <div className="bg-[color:var(--surface-elevated)]">
      <div className="flex items-center gap-2 px-4 py-2.5">
        {up ? (
          <TrendingUp className="h-4 w-4 text-cyan-400" />
        ) : (
          <TrendingDown className="h-4 w-4 text-rose-400" />
        )}
        <span className="text-[11px] font-black uppercase tracking-widest">{title}</span>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 pb-4 text-xs tc-text-muted">Nothing notable.</p>
      ) : (
        <ul className="divide-y divide-[color:var(--surface-border)]">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {r.name}
                  {r.alreadyMoved !== 0 && (
                    <span className="ml-1.5 text-[10px] font-black text-[color:var(--text-tertiary)]">
                      (moved {r.alreadyMoved > 0 ? "+" : ""}
                      {(r.alreadyMoved / 10).toFixed(1)})
                    </span>
                  )}
                </p>
                <p className="text-[10px] font-black uppercase tracking-wider text-[color:var(--text-tertiary)]">
                  {r.position} · {r.teamShort} · £{r.price.toFixed(1)}m · {r.ownership}%
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${CONF[r.confidence]}`}
              >
                {r.confidence}
              </span>
              <span
                className={`tc-numeric w-14 text-right text-sm font-black ${
                  up ? "text-cyan-400" : "text-rose-400"
                }`}
              >
                {r.flowPct > 0 ? "+" : ""}
                {r.flowPct}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
