import { prisma } from "@/lib/prisma";
import { ShieldCheck } from "lucide-react";

/**
 * "Proven Accuracy" credibility badge — reads the backtest scorecard the nightly
 * precompute persists (ModelAccuracy). Renders nothing until a backtest exists.
 * Pure data, zero AI: this is the moat made visible.
 */
export async function AccuracyBadge() {
  const acc = await prisma.modelAccuracy
    .findUnique({ where: { model: "match-predictor" } })
    .catch(() => null);
  if (!acc) return null;

  const edge = Math.round((acc.accuracy - acc.baselineAccuracy) * 10) / 10;
  const beatsUniform = acc.logLoss < acc.uniformLogLoss;

  const stats = [
    { label: "Results called", value: `${acc.accuracy}%`, sub: `of ${acc.matches} matches`, hero: true },
    { label: "Home-pick baseline", value: `${acc.baselineAccuracy}%`, sub: edge >= 0 ? `we beat it by ${edge}pts` : `${edge}pts` },
    { label: "Log-loss", value: acc.logLoss.toFixed(3), sub: beatsUniform ? `beats ${acc.uniformLogLoss.toFixed(2)} no-info` : `vs ${acc.uniformLogLoss.toFixed(2)}` },
    { label: "Brier score", value: acc.brier.toFixed(3), sub: "lower is sharper" },
  ];

  return (
    <section className="tc-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--surface-border)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-black uppercase tracking-tight">
              Proven Accuracy
            </h2>
            <p className="text-xs tc-text-muted">
              Backtested on the {acc.testSeason} season — no AI, pure data.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-400">
          Zero AI
        </span>
      </div>
      <div className="grid grid-cols-2 gap-px bg-[color:var(--surface-border)] lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-[color:var(--surface-elevated)] px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-tertiary)]">
              {s.label}
            </p>
            <p
              className={`tc-numeric mt-1 font-black ${
                s.hero ? "text-3xl text-[color:var(--accent)]" : "text-2xl"
              }`}
            >
              {s.value}
            </p>
            <p className="mt-0.5 text-[11px] tc-text-muted">{s.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
