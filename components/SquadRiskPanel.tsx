import { loadSquadNailedness } from "@/lib/fpl/service";
import type { NailedTier } from "@/lib/data/nailedness";
import { ShieldAlert, ShieldCheck, Crown } from "lucide-react";

const TIER_STYLE: Record<NailedTier, { bar: string; chip: string }> = {
  nailed: { bar: "var(--brand-secondary)", chip: "bg-cyan-500/15 text-cyan-400" },
  likely: { bar: "var(--brand-secondary)", chip: "bg-cyan-500/10 text-cyan-400" },
  rotation: { bar: "var(--brand-gold)", chip: "bg-[color:var(--brand-gold)]/15 text-[color:var(--brand-gold)]" },
  doubt: { bar: "var(--brand-gold)", chip: "bg-[color:var(--brand-gold)]/15 text-[color:var(--brand-gold)]" },
  unavailable: { bar: "var(--accent)", chip: "bg-[color:var(--accent)]/15 text-[color:var(--accent)]" },
  fringe: { bar: "var(--text-tertiary)", chip: "bg-[color:var(--surface-hover)] text-[color:var(--text-tertiary)]" },
};

/**
 * Lineup Watch — the manager's squad ranked by rotation/injury risk, from the
 * deterministic nailedness engine (zero AI). Riskiest starters on top so a doubt
 * or rotation risk can't slip past the deadline. Self-fetching; renders nothing
 * when picks aren't available.
 */
export async function SquadRiskPanel({ entryId }: { entryId: number }) {
  const data = await loadSquadNailedness(entryId);
  if (!data) return null;

  const starters = data.players.filter((p) => p.isStarter);
  const bench = data.players.filter((p) => !p.isStarter);

  return (
    <section className="tc-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[color:var(--surface-border)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              data.risks > 0 ? "bg-[color:var(--brand-gold)]/15 text-[color:var(--brand-gold)]" : "bg-cyan-500/15 text-cyan-400"
            }`}
          >
            {data.risks > 0 ? <ShieldAlert className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="font-display text-lg font-black uppercase tracking-tight">Lineup Watch</h2>
            <p className="text-xs tc-text-muted">
              {data.risks > 0
                ? `${data.risks} starter${data.risks > 1 ? "s" : ""} to keep an eye on`
                : "Your XI looks nailed-on"}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-400">
          Zero AI
        </span>
      </div>

      <ul className="divide-y divide-[color:var(--surface-border)]">
        {starters.map((p, i) => (
          <Row key={i} p={p} />
        ))}
      </ul>

      {bench.length > 0 && (
        <details className="group border-t border-[color:var(--surface-border)]">
          <summary className="tc-focus-visible cursor-pointer list-none px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-[color:var(--text-tertiary)] hover:text-[color:var(--text-secondary)]">
            Bench ({bench.length}) — tap to view
          </summary>
          <ul className="divide-y divide-[color:var(--surface-border)] opacity-80">
            {bench.map((p, i) => (
              <Row key={i} p={p} />
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function Row({
  p,
}: {
  p: {
    name: string;
    position: string;
    teamShort: string;
    isCaptain: boolean;
    report: { startProb: number; tier: NailedTier; label: string; reason: string };
  };
}) {
  const s = TIER_STYLE[p.report.tier];
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-bold">{p.name}</span>
          {p.isCaptain && (
            <Crown className="h-3.5 w-3.5 shrink-0 text-[color:var(--brand-gold)]" />
          )}
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${s.chip}`}>
            {p.report.label}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[11px] tc-text-muted">
          {p.position} · {p.teamShort} — {p.report.reason}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="tc-numeric text-sm font-black">{p.report.startProb}%</span>
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[color:var(--surface-hover)]">
          <div className="h-full rounded-full" style={{ width: `${p.report.startProb}%`, background: s.bar }} />
        </div>
      </div>
    </li>
  );
}
