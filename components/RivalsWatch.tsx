import { loadRivalsWatch } from "@/lib/fpl/service";
import { Swords, Crown, Gem, AlertTriangle } from "lucide-react";

/**
 * Rivals Watch — mini-league intelligence for the selected league. Captaincy
 * board, your differentials (edge), template gaps (risk) and per-rival head-to-
 * head. Zero AI. Self-fetching; renders nothing without a league to analyse.
 */
export async function RivalsWatch({ entryId, leagueId }: { entryId: number; leagueId: number }) {
  const data = await loadRivalsWatch(entryId, leagueId);
  if (!data) return null;

  return (
    <section className="tc-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--surface-border)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent)]/15 text-[color:var(--accent)]">
            <Swords className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-black uppercase tracking-tight">Rivals Watch</h2>
            <p className="text-xs tc-text-muted truncate">
              {data.leagueName} · {data.fieldSize} rivals · GW{data.event}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-400">
          Zero AI
        </span>
      </div>

      <div className="grid gap-px bg-[color:var(--surface-border)] lg:grid-cols-3">
        {/* Captaincy board */}
        <Col title="Captaincy Board" icon={<Crown className="h-3.5 w-3.5 text-[color:var(--brand-gold)]" />}>
          {data.captaincy.map((c, i) => (
            <li key={i} className="flex items-center gap-2 px-4 py-2">
              <span className="min-w-0 flex-1 truncate text-sm font-bold">
                {c.name}
                {c.isMine && (
                  <span className="ml-1.5 rounded bg-[color:var(--brand-gold)]/15 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-[color:var(--brand-gold)]">
                    You
                  </span>
                )}
              </span>
              <span className="tc-numeric text-xs font-black tc-text-muted">{c.count}</span>
              <span className="tc-numeric w-10 text-right text-xs font-black text-[color:var(--accent)]">{c.pct}%</span>
            </li>
          ))}
        </Col>

        {/* Your differentials */}
        <Col title="Your Differentials" icon={<Gem className="h-3.5 w-3.5 text-cyan-400" />} empty={data.differentials.length === 0 ? "No standout differentials — you're on template." : null}>
          {data.differentials.map((d, i) => (
            <Row key={i} name={d.name} sub={`${d.position} · ${d.teamShort}`} value={`${d.rivalPct}%`} valueClass="text-cyan-400" />
          ))}
        </Col>

        {/* Template gaps */}
        <Col title="Template Gaps" icon={<AlertTriangle className="h-3.5 w-3.5 text-[color:var(--accent)]" />} empty={data.templateGaps.length === 0 ? "You own all the league template — no gaps." : null}>
          {data.templateGaps.map((g, i) => (
            <Row key={i} name={g.name} sub={`${g.position} · ${g.teamShort}`} value={`${g.rivalPct}%`} valueClass="text-[color:var(--accent)]" />
          ))}
        </Col>
      </div>

      {/* Per-rival head-to-head */}
      <div className="border-t border-[color:var(--surface-border)]">
        <p className="px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-[color:var(--text-tertiary)]">
          Head-to-head
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-tertiary)]">
                <th className="px-5 py-2 text-left">Manager</th>
                <th className="px-2 py-2 text-center">Rank</th>
                <th className="px-2 py-2 text-center">Shared</th>
                <th className="px-5 py-2 text-right">Captain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--surface-border)]">
              {data.rivals.map((r) => (
                <tr key={r.name + r.rank} className="hover:bg-[color:var(--surface-hover)]">
                  <td className="px-5 py-2">
                    <p className="truncate text-sm font-bold">{r.name}</p>
                    <p className="truncate text-[10px] tc-text-muted">{r.manager}</p>
                  </td>
                  <td className="tc-numeric px-2 py-2 text-center text-xs font-black tc-text-muted">
                    {r.rank ?? "—"}
                  </td>
                  <td className="tc-numeric px-2 py-2 text-center text-xs font-black">{r.overlap}/15</td>
                  <td className="px-5 py-2 text-right">
                    <span className={`inline-flex items-center justify-end gap-1 text-xs font-bold ${r.differsCaptain ? "text-[color:var(--accent)]" : "tc-text-muted"}`}>
                      {r.differsCaptain && (
                        <Swords className="h-3 w-3" aria-hidden="true" />
                      )}
                      {r.captainName ?? "—"}
                      {r.differsCaptain && <span className="sr-only"> (differs from your captain)</span>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Col({
  title,
  icon,
  children,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  empty?: string | null;
}) {
  return (
    <div className="bg-[color:var(--surface-elevated)]">
      <div className="flex items-center gap-2 px-4 py-2.5">
        {icon}
        <span className="text-[11px] font-black uppercase tracking-widest">{title}</span>
      </div>
      {empty ? (
        <p className="px-4 pb-4 text-xs tc-text-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-[color:var(--surface-border)]">{children}</ul>
      )}
    </div>
  );
}

function Row({ name, sub, value, valueClass }: { name: string; sub: string; value: string; valueClass: string }) {
  return (
    <li className="flex items-center gap-2 px-4 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{name}</p>
        <p className="text-[10px] font-black uppercase tracking-wider text-[color:var(--text-tertiary)]">{sub}</p>
      </div>
      <span className={`tc-numeric text-xs font-black ${valueClass}`}>{value}</span>
    </li>
  );
}
