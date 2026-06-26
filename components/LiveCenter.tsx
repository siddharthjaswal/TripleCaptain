import { loadLiveCenter } from "@/lib/fpl/service";
import { LiveAutoRefresh } from "./LiveAutoRefresh";
import { ArrowRightLeft, Crown, TrendingUp, TrendingDown, Zap } from "lucide-react";

/**
 * Live Gameweek Command Center — live score with provisional bonus, captain
 * status, auto-sub preview and progress vs the GW average. Self-fetching server
 * component; renders nothing when there's no started gameweek to show.
 */
export async function LiveCenter({ entryId, event }: { entryId: number; event?: number }) {
  const data = await loadLiveCenter(entryId, event);
  if (!data) return null;

  const s = data.summary;
  const live = s.isLive && !data.isFinished;
  const vs = s.vsAverage;

  return (
    <section className="tc-card overflow-hidden">
      <LiveAutoRefresh enabled={live} />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[color:var(--surface-border)] px-5 py-4">
        <div className="flex items-center gap-3">
          {live ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-cyan-500/15 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-cyan-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
              </span>
              Live
            </span>
          ) : (
            <span className="rounded-full bg-[color:var(--surface-hover)] px-3 py-1 text-[11px] font-black uppercase tracking-widest text-[color:var(--text-secondary)]">
              {data.isFinished ? "Final" : "GW"} {data.event}
            </span>
          )}
          <h2 className="font-display text-lg font-black uppercase tracking-tight">
            Gameweek {data.event}
          </h2>
        </div>
        {vs != null && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${
              vs >= 0 ? "bg-cyan-500/15 text-cyan-400" : "bg-rose-500/15 text-rose-400"
            }`}
          >
            {vs >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {vs >= 0 ? "+" : ""}
            {vs} vs avg
          </span>
        )}
      </div>

      {/* Score + progress */}
      <div className="grid gap-px bg-[color:var(--surface-border)] sm:grid-cols-3">
        <Stat label={live ? "Live points" : "Points"} value={`${s.livePoints}`} hero />
        <Stat
          label="Provisional bonus"
          value={s.provisionalBonus > 0 ? `+${s.provisionalBonus}` : "—"}
          accent="gold"
        />
        <Stat
          label="Progress"
          value={`${s.startersPlayed}/${s.counted}`}
          sub={
            s.startersInPlay > 0
              ? `${s.startersInPlay} in play · ${s.startersToPlay} to come`
              : `${s.startersToPlay} to come`
          }
        />
      </div>

      {/* Captain + bench + autosubs */}
      <div className="space-y-px bg-[color:var(--surface-border)]">
        <div className="flex items-center justify-between bg-[color:var(--surface-elevated)] px-5 py-3">
          <span className="flex items-center gap-2 text-sm font-bold">
            <Crown className="h-4 w-4 text-[color:var(--brand-gold)]" />
            {data.captainName ?? "Captain"}
            {s.captain.usedVice && (
              <span className="rounded-full bg-[color:var(--brand-gold)]/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[color:var(--brand-gold)]">
                Vice
              </span>
            )}
          </span>
          <span className="tc-numeric text-sm font-black">
            {s.captain.element == null
              ? "—"
              : !s.captain.played && s.captain.finished
                ? "Blanked"
                : !s.captain.played
                  ? "Yet to play"
                  : `${s.captain.points} × ${s.captain.multiplier} = ${s.captain.points * s.captain.multiplier}`}
          </span>
        </div>

        {data.autoSubs.length > 0 && (
          <div className="bg-[color:var(--surface-elevated)] px-5 py-3">
            <p className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[color:var(--text-tertiary)]">
              <ArrowRightLeft className="h-3.5 w-3.5" /> Auto-subs
            </p>
            <ul className="space-y-1.5">
              {data.autoSubs.map((sub, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="font-bold text-rose-400">{sub.outName}</span>
                  <ArrowRightLeft className="h-3.5 w-3.5 text-[color:var(--text-tertiary)]" />
                  <span className="font-bold text-cyan-400">{sub.inName}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between bg-[color:var(--surface-elevated)] px-5 py-3 text-xs tc-text-muted">
          <span className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" /> Bench
          </span>
          <span className="tc-numeric font-bold">{s.benchPoints} pts</span>
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
  hero = false,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  hero?: boolean;
  accent?: "gold";
}) {
  return (
    <div className="bg-[color:var(--surface-elevated)] px-5 py-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-tertiary)]">
        {label}
      </p>
      <p
        className={`tc-numeric mt-1 font-black ${
          hero
            ? "text-4xl text-[color:var(--accent)]"
            : accent === "gold"
              ? "text-2xl text-[color:var(--brand-gold)]"
              : "text-2xl"
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[11px] tc-text-muted">{sub}</p>}
    </div>
  );
}
