import { getBootstrap } from "@/lib/fpl/client";
import { computeSetPieceTakers, type TeamSetPieces } from "@/lib/data/setpieces";
import { Target } from "lucide-react";

/**
 * Set-Piece Takers — each club's penalty, free-kick and corner hierarchy from
 * FPL's published order (zero AI). Penalty takers are a hidden points edge, so
 * the first-choice taker is highlighted. Works year-round.
 */
export async function SetPieceTakers() {
  const bootstrap = await getBootstrap().catch(() => null);
  if (!bootstrap) return null;

  const teamShortById = new Map(bootstrap.teams.map((t) => [t.id, t.short_name]));
  const teamNameById = new Map(bootstrap.teams.map((t) => [t.id, t.name]));
  const teams = computeSetPieceTakers({
    elements: bootstrap.elements,
    teamShortById,
    teamNameById,
  });
  if (teams.length === 0) return null;

  return (
    <section className="tc-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[color:var(--surface-border)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--brand-gold)]/15 text-[color:var(--brand-gold)]">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-black uppercase tracking-tight">Set-Piece Takers</h2>
            <p className="text-xs tc-text-muted">
              Penalties, free-kicks &amp; corners by club — the hidden points edge.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-400">
          Zero AI
        </span>
      </div>
      {/* 4 columns divides the 20 PL clubs evenly — no ragged trailing gap. */}
      <div className="grid gap-px bg-[color:var(--surface-border)] sm:grid-cols-2 lg:grid-cols-4">
        {teams.map((t) => (
          <TeamCard key={t.teamShort} team={t} />
        ))}
      </div>
    </section>
  );
}

function TeamCard({ team }: { team: TeamSetPieces }) {
  return (
    <div className="bg-[color:var(--surface-elevated)] px-4 py-3">
      <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-[color:var(--text-secondary)]">
        {team.teamShort}
      </p>
      <Row label="PEN" takers={team.penalties.map((p) => p.name)} highlight />
      <Row label="FK" takers={team.freekicks.map((p) => p.name)} />
      <Row label="COR" takers={team.corners.map((p) => p.name)} />
    </div>
  );
}

function Row({
  label,
  takers,
  highlight = false,
}: {
  label: string;
  takers: string[];
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2 py-0.5">
      <span
        className={`w-8 shrink-0 text-[9px] font-black uppercase tracking-wider ${
          highlight ? "text-[color:var(--brand-gold)]" : "text-[color:var(--text-tertiary)]"
        }`}
      >
        {label}
      </span>
      {takers.length === 0 ? (
        <span className="text-xs tc-text-muted">—</span>
      ) : (
        <span className="min-w-0 text-xs">
          <span className={highlight ? "font-bold" : "font-medium"}>{takers[0]}</span>
          {takers.length > 1 && (
            <span className="tc-text-muted"> › {takers.slice(1).join(" › ")}</span>
          )}
        </span>
      )}
    </div>
  );
}
