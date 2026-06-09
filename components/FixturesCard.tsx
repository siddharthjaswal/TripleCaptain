"use client";

import { useTransition, useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Calendar, ChevronLeft, ChevronRight, Clock, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import type { FixtureDTO, FixturePlayerDTO } from "@/lib/fpl/dto";
import { Skeleton } from "./ui/Skeleton";

type FixturesCardProps = {
  event: number;
  fixtures: FixtureDTO[];
  playersByFixture: Map<number, FixturePlayerDTO[]>;
  isLoading?: boolean;
};

export function FixturesCard({ event, fixtures, playersByFixture, isLoading = false }: FixturesCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleGameweekChange = (newEvent: number) => {
    startTransition(() => {
      router.push(`${pathname}?event=${newEvent}`);
    });
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <section className="relative">
        {/* Premium Gameweek Selector Skeleton */}
        <div className="tc-card rounded-3xl p-6 mb-6 bg-gradient-to-br from-[color:var(--accent)]/5 to-transparent border-[color:var(--accent)]/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Skeleton variant="rectangular" width="56px" height="56px" className="rounded-2xl" />
              <div>
                <Skeleton variant="text" width="150px" height="24px" className="mb-2" />
                <Skeleton variant="text" width="100px" height="14px" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton variant="rectangular" width="100px" height="44px" className="rounded-xl" />
              <Skeleton variant="rectangular" width="60px" height="40px" className="rounded-xl" />
              <Skeleton variant="rectangular" width="100px" height="44px" className="rounded-xl" />
            </div>
          </div>
        </div>

        {/* Fixtures List Skeleton */}
        <div className="space-y-8">
          {[1, 2].map((day) => (
            <div key={day} className="space-y-4">
              <div className="flex items-center gap-3 justify-center">
                <div className="h-px bg-[color:var(--surface-border)] flex-1" />
                <Skeleton variant="text" width="200px" height="20px" />
                <div className="h-px bg-[color:var(--surface-border)] flex-1" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {[1, 2, 3].map((fixture) => (
                  <div key={fixture} className="tc-card rounded-2xl p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <Skeleton variant="circular" width="40px" height="40px" />
                        <div className="flex-1">
                          <Skeleton variant="text" width="80%" height="16px" className="mb-2" />
                          <Skeleton variant="text" width="40%" height="28px" />
                        </div>
                      </div>
                      <Skeleton variant="rectangular" width="60px" height="40px" className="rounded-xl" />
                      <div className="flex items-center gap-3 flex-1 flex-row-reverse">
                        <Skeleton variant="circular" width="40px" height="40px" />
                        <div className="flex-1 text-right">
                          <Skeleton variant="text" width="80%" height="16px" className="mb-2 ml-auto" />
                          <Skeleton variant="text" width="40%" height="28px" className="ml-auto" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Group fixtures by date
  const fixturesByDate = fixtures.reduce(
    (acc, fixture) => {
      if (!fixture.kickoffTime) return acc;
      const date = new Date(fixture.kickoffTime);
      const dateKey = date.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "short",
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
      <div className="tc-card rounded-3xl p-6 mb-6 bg-gradient-to-br from-[color:var(--accent)]/5 to-transparent border-[color:var(--accent)]/10">
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
                {/* Centered Date Header */}
                <div className="flex items-center gap-3 justify-center">
                  <div className="h-px bg-gradient-to-r from-transparent via-[color:var(--surface-border)] to-transparent flex-1" />
                  <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)]">
                    <Clock className="h-4 w-4 text-[color:var(--accent)]" />
                    <h3 className="text-base font-black tracking-tight">{label}</h3>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-[color:var(--surface-border)] to-transparent flex-1" />
                </div>

                {/* Fixtures for this date */}
                <div className="grid gap-3 md:grid-cols-2">
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
    return isWinner ? "text-cyan-400" : "text-[color:var(--text-tertiary)]";
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
          <div className="shrink-0">
            <Image
              src={fixture.homeTeamBadge}
              alt={fixture.homeTeam}
              width={40}
              height={40}
              className="h-10 w-10 object-contain drop-shadow-md"
            />
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
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/15 px-3 py-1 text-xs font-black text-[color:var(--text-secondary)] uppercase tracking-wider">
                Full Time
              </span>
            </div>
          ) : fixture.started ? (
            <div className="flex flex-col items-center gap-1">
              <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-cyan-500/20 border border-cyan-500/30 px-3 py-1.5 text-xs font-black text-cyan-400 uppercase tracking-wider shadow-lg shadow-cyan-500/10">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
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
          <div className="shrink-0">
            <Image
              src={fixture.awayTeamBadge}
              alt={fixture.awayTeam}
              width={40}
              height={40}
              className="h-10 w-10 object-contain drop-shadow-md"
            />
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
        <div className="border-t border-[color:var(--surface-border)] bg-gradient-to-b from-blue-500/5 via-purple-500/5 to-transparent px-5 py-4">
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-[color:var(--accent)] flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-[color:var(--accent)]" />
              Your Squad ({players.length})
            </p>
            <div className="grid gap-2">
              {[...homePlayers, ...awayPlayers].map((player) => (
                <PlayerChip key={player.elementId} player={player} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerChip({ player }: { player: FixturePlayerDTO }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Calculate point breakdown
  const basePoints = player.multiplier > 1 ? player.points / player.multiplier : player.points;
  
  const getPointsStyle = (points: number) => {
    if (points > 5) return "bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-cyan-500/20";
    if (points > 0) return "bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-blue-500/20";
    if (points < 0) return "bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-rose-500/20";
    return "bg-slate-500/20 text-[color:var(--text-secondary)] border-slate-500/40";
  };

  const hasStats = player.stats && (player.stats.minutes > 0 || player.stats.goals_scored > 0);

  return (
    <div className="rounded-xl bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] overflow-hidden transition-all hover:border-[color:var(--accent)]/50">
      <div 
        className={`flex items-center gap-2 px-3 py-2.5 ${hasStats ? 'cursor-pointer' : ''}`}
        onClick={() => hasStats && setIsExpanded(!isExpanded)}
      >
        <span className="text-sm font-bold flex-1">{player.name}</span>
        
        {/* Captain/Vice Badge */}
        {(player.isCaptain || player.isViceCaptain) && (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-[11px] font-black text-white shadow-lg shadow-red-500/30">
            {player.isCaptain ? "C" : "V"}
          </span>
        )}
        
        {/* Points Badge */}
        <span className={`inline-flex items-center justify-center rounded-lg border shadow-lg px-3 py-1.5 text-sm font-black tabular-nums min-w-[42px] ${getPointsStyle(player.points)}`}>
          {player.points > 0 ? "+" : ""}{player.points}
        </span>

        {/* Expand indicator */}
        {hasStats && (
          <div className="flex items-center justify-center w-6 h-6">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 tc-text-muted" />
            ) : (
              <ChevronDown className="h-4 w-4 tc-text-muted" />
            )}
          </div>
        )}
      </div>

      {/* Expandable Stats */}
      {isExpanded && player.stats && (
        <div className="border-t border-[color:var(--surface-border)] bg-[color:var(--surface-root)]/40 px-3 py-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {player.stats.minutes > 0 && (
              <StatBadge label="Minutes" value={player.stats.minutes} />
            )}
            {player.stats.goals_scored > 0 && (
              <StatBadge label="Goals" value={player.stats.goals_scored} color="emerald" />
            )}
            {player.stats.assists > 0 && (
              <StatBadge label="Assists" value={player.stats.assists} color="blue" />
            )}
            {player.stats.clean_sheets > 0 && (
              <StatBadge label="Clean Sheet" value={player.stats.clean_sheets} color="green" />
            )}
            {player.stats.saves > 0 && (
              <StatBadge label="Saves" value={player.stats.saves} color="cyan" />
            )}
            {player.stats.bonus > 0 && (
              <StatBadge label="Bonus" value={player.stats.bonus} color="amber" />
            )}
            {player.stats.yellow_cards > 0 && (
              <StatBadge label="Yellow" value={player.stats.yellow_cards} color="yellow" />
            )}
            {player.stats.red_cards > 0 && (
              <StatBadge label="Red" value={player.stats.red_cards} color="red" />
            )}
            {player.stats.own_goals > 0 && (
              <StatBadge label="Own Goals" value={player.stats.own_goals} color="rose" />
            )}
            {player.stats.penalties_missed > 0 && (
              <StatBadge label="Pen Miss" value={player.stats.penalties_missed} color="rose" />
            )}
            {player.stats.penalties_saved > 0 && (
              <StatBadge label="Pen Save" value={player.stats.penalties_saved} color="emerald" />
            )}
            {player.multiplier > 1 && (
              <StatBadge label={`${player.multiplier}x Captain`} value={Math.round(basePoints)} color="purple" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBadge({ 
  label, 
  value, 
  color = "default" 
}: { 
  label: string; 
  value: number; 
  color?: "default" | "emerald" | "blue" | "green" | "cyan" | "amber" | "yellow" | "red" | "rose" | "purple";
}) {
  const colorClasses = {
    default: "bg-slate-500/10 text-[color:var(--text-secondary)]",
    emerald: "bg-cyan-500/10 text-cyan-400",
    blue: "bg-blue-500/10 text-blue-400",
    green: "bg-cyan-500/10 text-cyan-400",
    cyan: "bg-cyan-500/10 text-cyan-400",
    amber: "bg-amber-500/10 text-amber-400",
    yellow: "bg-yellow-500/10 text-yellow-400",
    red: "bg-red-500/10 text-red-400",
    rose: "bg-rose-500/10 text-rose-400",
    purple: "bg-purple-500/10 text-purple-400",
  };

  return (
    <div className={`flex items-center justify-between rounded-lg px-2 py-1.5 ${colorClasses[color]}`}>
      <span className="font-medium">{label}</span>
      <span className="font-black">{value}</span>
    </div>
  );
}
