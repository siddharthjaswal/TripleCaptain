"use client";

import { useTransition } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Calendar, ChevronLeft, ChevronRight, Clock, Trophy } from "lucide-react";
import type { FixtureDTO, FixturePlayerDTO } from "@/lib/fpl/dto";

type FixturesCardProps = {
  event: number;
  fixtures: FixtureDTO[];
  playersByFixture: Map<number, FixturePlayerDTO[]>;
};

export function FixturesCard({ event, fixtures, playersByFixture }: FixturesCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleGameweekChange = (newEvent: number) => {
    startTransition(() => {
      router.push(`${pathname}?event=${newEvent}`);
    });
  };

  // Group fixtures by date
  const fixturesByDate = fixtures.reduce(
    (acc, fixture) => {
      if (!fixture.kickoffTime) return acc;
      const date = new Date(fixture.kickoffTime);
      const dateKey = date.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      });
      const sortKey = date.toISOString().split("T")[0];
      if (!acc[sortKey]) {
        acc[sortKey] = { label: dateKey, fixtures: [] };
      }
      acc[sortKey].fixtures.push(fixture);
      return acc;
    },
    {} as Record<string, { label: string; fixtures: FixtureDTO[] }>,
  );

  const sortedDates = Object.keys(fixturesByDate).sort();

  return (
    <section className="relative">
      {/* Premium Gameweek Selector */}
      <div className="tc-card rounded-3xl p-6 shadow-lg mb-6 bg-gradient-to-br from-[color:var(--accent)]/5 to-transparent border-[color:var(--accent)]/10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[color:var(--accent)] to-[color:var(--accent)]/80 shadow-lg shadow-[color:var(--accent)]/20">
              <Calendar className="h-7 w-7 text-[color:var(--accent-contrast)]" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Gameweek {event}</h2>
              <p className="tc-text-muted text-sm font-medium">
                {fixtures.length} {fixtures.length === 1 ? "fixture" : "fixtures"}
              </p>
            </div>
          </div>
          
          {/* Navigation Pills */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleGameweekChange(event - 1)}
              disabled={event === 1 || isPending}
              className="group tc-focus-visible inline-flex items-center gap-2 rounded-xl bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] px-5 py-3 text-sm font-bold transition-all hover:border-[color:var(--accent)] hover:bg-[color:var(--accent)]/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[color:var(--surface-border)] disabled:hover:bg-[color:var(--surface-elevated)]"
            >
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <div className="flex h-10 items-center justify-center rounded-xl bg-[color:var(--accent)]/10 border border-[color:var(--accent)]/20 px-4 min-w-[60px]">
              <span className="text-sm font-black text-[color:var(--accent)] tabular-nums">
                GW {event}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleGameweekChange(event + 1)}
              disabled={event >= 38 || isPending}
              className="group tc-focus-visible inline-flex items-center gap-2 rounded-xl bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] px-5 py-3 text-sm font-bold transition-all hover:border-[color:var(--accent)] hover:bg-[color:var(--accent)]/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[color:var(--surface-border)] disabled:hover:bg-[color:var(--surface-elevated)]"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Fixtures List */}
      <div className="space-y-8">
        {sortedDates.length === 0 ? (
          <div className="tc-card rounded-3xl p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--surface-elevated)]">
                <Trophy className="h-8 w-8 tc-text-muted" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">No Fixtures Available</h3>
                <p className="tc-text-muted text-sm">
                  There are no fixtures scheduled for Gameweek {event}.
                </p>
              </div>
            </div>
          </div>
        ) : (
          sortedDates.map((sortKey) => {
            const { label, fixtures: dateFixtures } = fixturesByDate[sortKey];
            return (
              <div key={sortKey} className="space-y-4">
                {/* Date Header */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent)]/10">
                    <Clock className="h-5 w-5 text-[color:var(--accent)]" />
                  </div>
                  <h3 className="text-lg font-black tracking-tight">{label}</h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-[color:var(--surface-border)] to-transparent" />
                </div>

                {/* Fixtures for this date */}
                <div className="grid gap-3">
                  {dateFixtures.map((fixture) => (
                    <FixtureRow
                      key={fixture.id}
                      fixture={fixture}
                      players={playersByFixture.get(fixture.id) ?? []}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Loading Overlay */}
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-[color:var(--surface-root)]/80 backdrop-blur-md rounded-3xl z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[color:var(--surface-border)] border-t-[color:var(--accent)]" />
            <p className="text-sm font-bold">Loading fixtures...</p>
          </div>
        </div>
      )}
    </section>
  );
}

type FixtureRowProps = {
  fixture: FixtureDTO;
  players: FixturePlayerDTO[];
};

function FixtureRow({ fixture, players }: FixtureRowProps) {
  const getScoreColor = (
    homeScore: number | null,
    awayScore: number | null,
    isHome: boolean,
  ) => {
    if (homeScore === null || awayScore === null) return "text-[color:var(--text-primary)]";
    if (homeScore === awayScore) return "text-amber-400";
    const isWinner = isHome ? homeScore > awayScore : awayScore > homeScore;
    return isWinner ? "text-emerald-400" : "text-[color:var(--text-tertiary)]";
  };

  const formatKickoffTime = (kickoffTime: string | null) => {
    if (!kickoffTime) return "";
    const date = new Date(kickoffTime);
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const showScore = fixture.finished || fixture.started;
  const homeColor = getScoreColor(fixture.homeScore, fixture.awayScore, true);
  const awayColor = getScoreColor(fixture.homeScore, fixture.awayScore, false);

  // Separate players by team
  const homePlayers = players.filter((p) => p.teamId === fixture.homeTeamId);
  const awayPlayers = players.filter((p) => p.teamId === fixture.awayTeamId);

  const hasPlayers = players.length > 0;

  return (
    <div className="tc-card rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.01] border-transparent hover:border-[color:var(--accent)]/30">
      {/* Match Score Row */}
      <div className="flex items-center justify-between px-5 py-4 gap-4">
        {/* Home Team */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative shrink-0">
            <Image
              src={fixture.homeTeamBadge}
              alt={fixture.homeTeam}
              width={40}
              height={40}
              className="h-10 w-10 object-contain drop-shadow-md"
            />
            {homePlayers.length > 0 && (
              <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--accent)] text-[10px] font-black text-[color:var(--accent-contrast)] shadow-lg">
                {homePlayers.length}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base truncate">
              {fixture.homeTeam}
            </p>
            {showScore && (
              <p className={`${homeColor} text-2xl font-black tabular-nums leading-none`}>
                {fixture.homeScore ?? 0}
              </p>
            )}
          </div>
        </div>

        {/* Center Status */}
        <div className="flex flex-col items-center gap-2 shrink-0 px-4">
          {fixture.finished ? (
            <div className="flex flex-col items-center gap-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/15 px-3 py-1 text-xs font-black text-slate-400 uppercase tracking-wider">
                Full Time
              </span>
            </div>
          ) : fixture.started ? (
            <div className="flex flex-col items-center gap-1">
              <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-black text-emerald-400 uppercase tracking-wider shadow-lg shadow-emerald-500/10">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                </span>
                Live
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-medium tc-text-muted uppercase tracking-wide">Kickoff</span>
              <span className="text-sm font-black tabular-nums">
                {formatKickoffTime(fixture.kickoffTime)}
              </span>
            </div>
          )}
          {!showScore && (
            <span className="text-2xl font-black tc-text-muted">vs</span>
          )}
        </div>

        {/* Away Team */}
        <div className="flex items-center gap-3 flex-1 min-w-0 flex-row-reverse">
          <div className="relative shrink-0">
            <Image
              src={fixture.awayTeamBadge}
              alt={fixture.awayTeam}
              width={40}
              height={40}
              className="h-10 w-10 object-contain drop-shadow-md"
            />
            {awayPlayers.length > 0 && (
              <div className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--accent)] text-[10px] font-black text-[color:var(--accent-contrast)] shadow-lg">
                {awayPlayers.length}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 text-right">
            <p className="font-bold text-base truncate">
              {fixture.awayTeam}
            </p>
            {showScore && (
              <p className={`${awayColor} text-2xl font-black tabular-nums leading-none`}>
                {fixture.awayScore ?? 0}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Players Section */}
      {hasPlayers && (
        <div className="border-t border-[color:var(--surface-border)] bg-gradient-to-b from-[color:var(--surface-elevated)]/40 to-transparent px-5 py-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Home Players */}
            {homePlayers.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-wider tc-text-muted mb-3">
                  Your Players
                </p>
                {homePlayers.map((player) => (
                  <PlayerChip key={player.elementId} player={player} />
                ))}
              </div>
            )}
            
            {/* Away Players */}
            {awayPlayers.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-wider tc-text-muted mb-3">
                  Your Players
                </p>
                {awayPlayers.map((player) => (
                  <PlayerChip key={player.elementId} player={player} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerChip({ player }: { player: FixturePlayerDTO }) {
  const pointsColor = player.points > 0 
    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
    : player.points < 0 
    ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
    : "bg-slate-500/20 text-slate-400 border-slate-500/30";

  return (
    <div className="flex items-center gap-2 rounded-xl bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] px-3 py-2 transition-all hover:border-[color:var(--accent)]/50">
      <span className="text-sm font-bold flex-1">{player.name}</span>
      
      {/* Captain/Vice Badge */}
      {(player.isCaptain || player.isViceCaptain) && (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-red-500 to-red-600 text-[10px] font-black text-white shadow-lg shadow-red-500/30">
          {player.isCaptain ? "C" : "V"}
        </span>
      )}
      
      {/* Points Badge */}
      <span className={`inline-flex items-center justify-center rounded-lg border px-2.5 py-1 text-xs font-black tabular-nums min-w-[36px] ${pointsColor}`}>
        {player.points > 0 ? "+" : ""}{player.points}
      </span>
    </div>
  );
}
