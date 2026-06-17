import { prisma } from "@/lib/prisma";
import { positionOf, type Position } from "@/lib/data/types";

type PickRow = {
  id: number;
  name: string;
  pos: Position;
  team: string;
  price: number;
  xp: number;
  cap: number;
  value: number;
  archetype: string;
};

/**
 * Pre-computed custom-xP picks (zero tokens at request time — reads the
 * PlayerProjection table the nightly precompute fills). Three lenses: top
 * expected points, best value (xP per £m), and best captaincy.
 */
export async function PowerPicks() {
  const projections = await prisma.playerProjection
    .findMany({ orderBy: { xPoints: "desc" }, take: 80 })
    .catch(() => []);
  if (projections.length === 0) return null;

  const players = await prisma.player.findMany({
    where: { id: { in: projections.map((p) => p.playerId) } },
    include: { team: true },
  });
  const byId = new Map(players.map((p) => [p.id, p]));

  const rows: PickRow[] = projections
    .map((proj): PickRow | null => {
      const p = byId.get(proj.playerId);
      if (!p) return null;
      const price = p.nowCost / 10;
      return {
        id: p.id,
        name: p.webName,
        pos: positionOf(p.elementType),
        team: p.team.shortName,
        price,
        xp: Math.round(proj.xPoints * 100) / 100,
        cap: Math.round(proj.capScore * 10) / 10,
        value: price > 0 ? Math.round((proj.xPoints / price) * 100) / 100 : 0,
        archetype: proj.archetype,
      };
    })
    .filter((r): r is PickRow => r !== null);

  const topXp = [...rows].sort((a, b) => b.xp - a.xp).slice(0, 8);
  const bestValue = [...rows].filter((r) => r.price >= 4).sort((a, b) => b.value - a.value).slice(0, 8);
  const captains = [...rows].sort((a, b) => b.cap - a.cap).slice(0, 8);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-black uppercase tracking-tight">
          Power Picks
        </h2>
        <p className="mt-1 text-sm tc-text-muted">
          Our own expected-points model from 13 seasons of data — no AI, recomputed nightly.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PickList title="Top Expected Points" unit="xP" rows={topXp} metric={(r) => r.xp.toFixed(2)} />
        <PickList title="Best Value" unit="xP / £m" rows={bestValue} metric={(r) => r.value.toFixed(2)} />
        <PickList title="Captain Picks" unit="cap score" rows={captains} metric={(r) => r.cap.toFixed(1)} />
      </div>
    </section>
  );
}

function PickList({
  title,
  unit,
  rows,
  metric,
}: {
  title: string;
  unit: string;
  rows: PickRow[];
  metric: (r: PickRow) => string;
}) {
  return (
    <div className="tc-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[color:var(--surface-border)] px-4 py-3">
        <h3 className="text-[11px] font-black uppercase tracking-widest">{title}</h3>
        <span className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-tertiary)]">
          {unit}
        </span>
      </div>
      <ul className="divide-y divide-[color:var(--surface-border)]">
        {rows.map((r, i) => (
          <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className="w-4 text-xs font-black text-[color:var(--text-tertiary)]">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{r.name}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-[color:var(--text-tertiary)]">
                {r.pos} · {r.team} · £{r.price}m
              </p>
            </div>
            <span className="tc-numeric text-sm font-black text-[color:var(--accent)]">{metric(r)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
