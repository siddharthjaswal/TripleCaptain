import { loadSquadInsights } from "@/lib/fpl/service";
import { ArrowRight, Sparkles, Layers, Zap } from "lucide-react";

const CHIP_CONFIDENCE: Record<string, string> = {
  high: "text-cyan-400 bg-cyan-500/15",
  medium: "text-[color:var(--brand-gold)] bg-[color:var(--brand-gold)]/15",
  low: "text-[color:var(--text-tertiary)] bg-[color:var(--surface-hover)]",
};

/**
 * SquadLab — zero-token squad analysis surfaced on the planner. Reads the
 * deterministic engine (best XI, optimal single transfers, chip timing) for a
 * real manager's squad. Self-fetching server component; renders nothing
 * intrusive when projections aren't ready yet.
 */
export async function SquadLab({ entryId }: { entryId: number }) {
  const data = await loadSquadInsights(entryId);

  if (!data.available) {
    return (
      <section className="tc-card p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent)]/15 text-[color:var(--accent)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-black uppercase tracking-tight">
              SquadLab
            </h2>
            <p className="text-sm tc-text-muted">
              Our model is recomputing projections — check back shortly.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[color:var(--accent)]" />
          <h2 className="font-display text-2xl font-black uppercase tracking-tight">
            SquadLab
          </h2>
          <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-cyan-400">
            Zero AI
          </span>
        </div>
        <p className="text-sm tc-text-muted">
          Our deterministic engine on your squad — multi-season expected points,
          recomputed nightly.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Best XI */}
        <div className="tc-card overflow-hidden lg:col-span-1">
          <div className="flex items-center justify-between border-b border-[color:var(--surface-border)] px-4 py-3">
            <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest">
              <Layers className="h-3.5 w-3.5 text-[color:var(--accent)]" />
              Best XI
            </span>
            <span className="tc-numeric text-[11px] font-black text-[color:var(--text-tertiary)]">
              {data.bestXi?.formation} · {data.bestXi?.projectedTotal} xP
            </span>
          </div>
          <ul className="divide-y divide-[color:var(--surface-border)]">
            {data.bestXi?.starters.map((p, i) => (
              <li key={i} className="flex items-center gap-2 px-4 py-2">
                <span className="w-7 shrink-0 text-[9px] font-black uppercase tracking-wider text-[color:var(--text-tertiary)]">
                  {p.position}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold">{p.name}</span>
                <span className="tc-numeric text-sm font-black text-[color:var(--accent)]">
                  {p.xp.toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
          {data.bestXi && data.bestXi.bench.length > 0 && (
            <div className="border-t border-[color:var(--surface-border)] bg-[color:var(--surface-hover)]/40 px-4 py-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-tertiary)]">
                Bench
              </p>
              <p className="mt-1 truncate text-xs font-bold tc-text-muted">
                {data.bestXi.bench.map((p) => p.name).join(" · ")}
              </p>
            </div>
          )}
        </div>

        {/* Transfer suggestions */}
        <div className="tc-card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[color:var(--surface-border)] px-4 py-3">
            <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest">
              <ArrowRight className="h-3.5 w-3.5 text-[color:var(--accent)]" />
              Top Transfers
            </span>
            <span className="tc-numeric text-[11px] font-black text-[color:var(--text-tertiary)]">
              £{data.bank.toFixed(1)}m ITB · {data.freeTransfers} FT
            </span>
          </div>
          {data.transfers.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-bold">No net-positive move right now.</p>
              <p className="mt-1 text-xs tc-text-muted">
                Your squad already maximises projected points — bank the transfer.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[color:var(--surface-border)]">
              {data.transfers.map((t) => (
                <li key={`${t.outId}-${t.inId}`} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-rose-400">
                      {t.outName}
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-[color:var(--text-tertiary)]" />
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-cyan-400">
                      {t.inName}
                    </span>
                    <span className="tc-numeric shrink-0 rounded-lg bg-cyan-500/15 px-2 py-1 text-xs font-black text-cyan-400">
                      +{t.netGain.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs tc-text-muted">{t.rationale}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Chip timing */}
      {data.chips.length > 0 && (
        <div className="tc-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[color:var(--surface-border)] px-4 py-3">
            <Zap className="h-3.5 w-3.5 text-[color:var(--brand-gold)]" />
            <span className="text-[11px] font-black uppercase tracking-widest">Chip Strategy</span>
          </div>
          <div className="grid gap-px bg-[color:var(--surface-border)] sm:grid-cols-2 lg:grid-cols-4">
            {data.chips.map((c) => (
              <div key={c.chip} className="bg-[color:var(--surface-elevated)] p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-black">{c.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                      CHIP_CONFIDENCE[c.confidence] ?? CHIP_CONFIDENCE.low
                    }`}
                  >
                    {c.confidence}
                  </span>
                </div>
                {c.bestEvent != null && (
                  <p className="tc-numeric mt-1 text-[10px] font-black uppercase tracking-wider text-[color:var(--accent)]">
                    Target GW {c.bestEvent}
                  </p>
                )}
                <p className="mt-2 text-xs tc-text-muted">{c.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
