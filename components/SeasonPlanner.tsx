import { loadSeasonPlan } from "@/lib/fpl/service";
import type { HorizonCell } from "@/lib/data/horizon";
import { CalendarRange } from "lucide-react";

/** FDR (1 easy .. 5 hard) → cell background + text, readable in both themes. */
function fdrStyle(avgFdr: number | null): { background: string; color: string } {
  if (avgFdr == null) return { background: "var(--surface-hover)", color: "var(--text-tertiary)" };
  const f = Math.round(avgFdr);
  if (f <= 2) return { background: "color-mix(in srgb, var(--brand-secondary) 22%, transparent)", color: "var(--text-primary)" };
  if (f === 3) return { background: "color-mix(in srgb, var(--brand-gold) 16%, transparent)", color: "var(--text-primary)" };
  return { background: "color-mix(in srgb, var(--accent) 20%, transparent)", color: "var(--text-primary)" };
}

/**
 * Season Planner — projected xP for each squad player across the next N
 * gameweeks over their real fixtures, coloured by difficulty (zero AI). The
 * fixture-swing view that drives transfer & chip planning. Renders nothing when
 * projections aren't ready.
 */
export async function SeasonPlanner({ entryId }: { entryId: number }) {
  const data = await loadSeasonPlan(entryId);
  if (!data) return null;

  return (
    <section className="tc-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--surface-border)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent)]/15 text-[color:var(--accent)]">
            <CalendarRange className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-black uppercase tracking-tight">Season Planner</h2>
            <p className="text-xs tc-text-muted">
              Projected points over GW{data.gws[0]}–{data.gws[data.gws.length - 1]} by fixture difficulty.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[color:var(--text-tertiary)]">
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded" style={{ background: fdrStyle(1).background }} /> Easy
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded" style={{ background: fdrStyle(5).background }} /> Hard
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[color:var(--surface-border)] text-[10px] font-black uppercase tracking-widest text-[color:var(--text-tertiary)]">
              <th className="sticky left-0 z-10 bg-[color:var(--surface-elevated)] px-4 py-2.5 text-left">Player</th>
              {data.gws.map((gw) => (
                <th key={gw} className="px-2 py-2.5 text-center">GW{gw}</th>
              ))}
              <th className="px-3 py-2.5 text-right">xPts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--surface-border)]">
            {data.rows.map((r) => (
              <tr key={r.element} className="hover:bg-[color:var(--surface-hover)]">
                <td className="sticky left-0 z-10 bg-[color:var(--surface-elevated)] px-4 py-2">
                  <p className="truncate text-sm font-bold">{r.name}</p>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[color:var(--text-tertiary)]">
                    {r.position} · {r.teamShort} · £{r.price.toFixed(1)}
                  </p>
                </td>
                {r.cells.map((c) => (
                  <Cell key={c.gw} cell={c} />
                ))}
                <td className="tc-numeric px-3 py-2 text-right text-sm font-black text-[color:var(--accent)]">
                  {r.total.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Cell({ cell }: { cell: HorizonCell }) {
  if (cell.opponents.length === 0) {
    return (
      <td className="px-1 py-2 text-center align-middle" style={fdrStyle(null)}>
        <span className="text-[10px] font-bold tc-text-muted">—</span>
      </td>
    );
  }
  const s = fdrStyle(cell.avgFdr);
  return (
    <td className="px-1 py-2 text-center align-middle" style={{ background: s.background, color: s.color }}>
      <div className="leading-tight">
        {cell.opponents.map((o, i) => (
          <p key={i} className="text-[10px] font-black uppercase">
            {o.short}
            <span className="font-bold opacity-60">{o.home ? " (H)" : " (A)"}</span>
          </p>
        ))}
        <p className="tc-numeric text-[11px] font-black">{cell.xp.toFixed(1)}</p>
      </div>
    </td>
  );
}
