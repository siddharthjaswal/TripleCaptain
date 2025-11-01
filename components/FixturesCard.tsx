"use client";

import { useTransition } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
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
        weekday: "short",
        day: "2-digit",
        month: "short",
      }).toUpperCase();
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(fixture);
      return acc;
    },
    {} as Record<string, FixtureDTO[]>,
  );

  const sortedDates = Object.keys(fixturesByDate).sort((a, b) => {
    const dateA = fixturesByDate[a][0]?.kickoffTime;
    const dateB = fixturesByDate[b][0]?.kickoffTime;
    if (!dateA || !dateB) return 0;
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });

  return (
    <section className="tc-card rounded-3xl p-6 shadow-lg relative">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Fixtures</h2>
          <p className="tc-text-muted text-sm mt-1">Gameweek {event}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleGameweekChange(event - 1)}
            disabled={event === 1 || isPending}
            className="tc-focus-visible inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-[color:var(--surface-elevated)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                clipRule="evenodd"
              />
            </svg>
            Previous
          </button>
          <button
            type="button"
            onClick={() => handleGameweekChange(event + 1)}
            disabled={event >= 38 || isPending}
            className="tc-focus-visible inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-[color:var(--surface-elevated)]"
          >
            Next
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </header>

      <div className="mt-6 space-y-6">
        {sortedDates.length === 0 ? (
          <p className="tc-text-muted text-center py-8">No fixtures available for this gameweek.</p>
        ) : (
          sortedDates.map((dateKey) => (
            <div key={dateKey}>
              <h3 className="tc-text-muted text-xs font-semibold uppercase tracking-wide mb-3">
                {dateKey}
              </h3>
              <div className="space-y-2">
                {fixturesByDate[dateKey].map((fixture) => (
                  <FixtureRow
                    key={fixture.id}
                    fixture={fixture}
                    players={playersByFixture.get(fixture.id) ?? []}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-[color:var(--surface-root)]/60 backdrop-blur-sm rounded-3xl">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[color:var(--surface-border)] border-t-[color:var(--accent)]" />
            <p className="text-sm font-medium">Loading...</p>
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
    if (homeScore === null || awayScore === null) return "";
    if (homeScore === awayScore) return "text-[color:var(--text-primary)]";
    const isWinner = isHome ? homeScore > awayScore : awayScore > homeScore;
    return isWinner ? "text-emerald-400" : "text-rose-400";
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

  return (
    <div className="rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-elevated)]/60 overflow-hidden transition hover:border-[color:var(--accent)]/50">
      <div className="flex items-center justify-between px-4 py-3 gap-4">
        {/* Home Team: Name + Crest + Score */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="font-bold text-base truncate">
            {fixture.homeTeam}
          </span>
          <Image
            src={fixture.homeTeamBadge}
            alt={fixture.homeTeam}
            width={28}
            height={28}
            className="h-7 w-7 object-contain shrink-0"
          />
          {showScore && (
            <span className={`${homeColor} text-lg font-bold tabular-nums min-w-[24px] text-right`}>
              {fixture.homeScore ?? 0}
            </span>
          )}
        </div>

        {/* Divider */}
        <span className="tc-text-muted font-medium shrink-0">-</span>

        {/* Away Team: Score + Crest + Name */}
        <div className="flex items-center gap-2 flex-1">
          {showScore && (
            <span className={`${awayColor} text-lg font-bold tabular-nums min-w-[24px]`}>
              {fixture.awayScore ?? 0}
            </span>
          )}
          <Image
            src={fixture.awayTeamBadge}
            alt={fixture.awayTeam}
            width={28}
            height={28}
            className="h-7 w-7 object-contain shrink-0"
          />
          <span className="font-bold text-base truncate">
            {fixture.awayTeam}
          </span>
        </div>

        {/* Status/Time on right */}
        <div className="flex items-center gap-2 shrink-0">
          {fixture.finished ? (
            <span className="tc-chip">FT</span>
          ) : fixture.started ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          ) : fixture.kickoffTime ? (
            <span className="tc-text-muted text-sm font-medium">
              {formatKickoffTime(fixture.kickoffTime)}
            </span>
          ) : null}
        </div>
      </div>

      {players.length > 0 && (
        <div className="border-t border-[color:var(--surface-border)] px-4 py-3 bg-[color:var(--surface-elevated)]/40">
          <div className="flex gap-4">
            {/* Home team players - left column, right-justified */}
            <div className="flex-1 flex flex-col gap-2 items-end">
              {homePlayers.map((player) => (
                <div
                  key={player.elementId}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] px-2.5 py-1"
                >
                  <span className="text-xs font-medium">{player.name}</span>
                  {(player.isCaptain || player.isViceCaptain) && (
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {player.isCaptain ? "C" : "V"}
                    </span>
                  )}
                  <span className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)]/15 px-1.5 py-0.5 text-xs font-bold text-[color:var(--accent)] min-w-[20px]">
                    {player.points}
                  </span>
                </div>
              ))}
            </div>
            {/* Away team players - right column, left-justified */}
            <div className="flex-1 flex flex-col gap-2 items-start">
              {awayPlayers.map((player) => (
                <div
                  key={player.elementId}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] px-2.5 py-1"
                >
                  <span className="text-xs font-medium">{player.name}</span>
                  {(player.isCaptain || player.isViceCaptain) && (
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {player.isCaptain ? "C" : "V"}
                    </span>
                  )}
                  <span className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)]/15 px-1.5 py-0.5 text-xs font-bold text-[color:var(--accent)] min-w-[20px]">
                    {player.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
