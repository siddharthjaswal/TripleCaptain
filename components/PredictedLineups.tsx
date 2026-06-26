import { getBootstrap } from "@/lib/fpl/client";
import { predictClubXI, type LineupPlayer, type ClubXI } from "@/lib/data/lineups";
import { Users } from "lucide-react";

/**
 * Predicted Lineups — each club's projected starting XI from deterministic
 * nailedness (zero AI). Year-round; refreshes as minutes/status data updates.
 */
export async function PredictedLineups() {
  const bootstrap = await getBootstrap().catch(() => null);
  if (!bootstrap) return null;

  const gamesPlayed = Math.max(1, bootstrap.events.filter((e) => e.finished).length);
  const byTeam = new Map<number, LineupPlayer[]>();
  for (const el of bootstrap.elements) {
    const list = byTeam.get(el.team) ?? [];
    list.push({
      name: el.web_name,
      elementType: el.element_type,
      status: el.status,
      chanceNext: el.chance_of_playing_next_round ?? null,
      minutes: el.minutes ?? 0,
      starts: el.starts ?? 0,
    });
    byTeam.set(el.team, list);
  }

  const clubs = bootstrap.teams
    .map((t) =>
      predictClubXI({
        players: byTeam.get(t.id) ?? [],
        teamShort: t.short_name,
        teamName: t.name,
        gamesPlayed,
      }),
    )
    .filter((c) => c.lines.GK.length > 0)
    .sort((a, b) => a.teamName.localeCompare(b.teamName));
  if (clubs.length === 0) return null;

  return (
    <section className="tc-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[color:var(--surface-border)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent)]/15 text-[color:var(--accent)]">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-black uppercase tracking-tight">Predicted Lineups</h2>
            <p className="text-xs tc-text-muted">
              Each club&apos;s projected XI from minutes &amp; availability — no AI.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-400">
          Zero AI
        </span>
      </div>
      <div className="grid gap-px bg-[color:var(--surface-border)] sm:grid-cols-2 lg:grid-cols-3">
        {clubs.map((c) => (
          <ClubCard key={c.teamShort} club={c} />
        ))}
      </div>
    </section>
  );
}

function ClubCard({ club }: { club: ClubXI }) {
  return (
    <div className="bg-[color:var(--surface-elevated)] px-4 py-3">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[11px] font-black uppercase tracking-widest text-[color:var(--text-secondary)]">
          {club.teamShort}
        </span>
        <span className="tc-numeric text-[10px] font-black text-[color:var(--text-tertiary)]">
          {club.formation}
        </span>
      </div>
      <Line label="GK" names={club.lines.GK} />
      <Line label="DEF" names={club.lines.DEF} />
      <Line label="MID" names={club.lines.MID} />
      <Line label="FWD" names={club.lines.FWD} />
    </div>
  );
}

function Line({ label, names }: { label: string; names: string[] }) {
  if (names.length === 0) return null;
  return (
    <div className="flex gap-2 py-0.5 text-xs">
      <span className="w-8 shrink-0 text-[9px] font-black uppercase tracking-wider text-[color:var(--text-tertiary)]">
        {label}
      </span>
      <span className="min-w-0 font-medium">{names.join(", ")}</span>
    </div>
  );
}
