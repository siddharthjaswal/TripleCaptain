"use client";

import { useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { FixtureDTO, FixturePlayerDTO } from "@/lib/fpl/dto";

type FixturesCardProps = {
  entryId: number;
  event: number;
  fixtures: FixtureDTO[];
  playersByFixture: Map<number, FixturePlayerDTO[]>;
};

export function FixturesCard({ entryId, event, fixtures, playersByFixture }: FixturesCardProps) {
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
    <section className="tc-card rounded-3xl p-6 shadow-lg">
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

  return (
    <div className="rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-elevated)]/60 overflow-hidden transition hover:border-[color:var(--accent)]/50">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center justify-center gap-3 flex-1">
          <span className="font-semibold text-base">
            {fixture.homeTeam}
          </span>
          {showScore ? (
            <div className="flex items-center gap-2 font-bold tabular-nums">
              <span className={`${homeColor} text-xl`}>
                {fixture.homeScore ?? 0}
              </span>
              <span className="tc-text-muted">-</span>
              <span className={`${awayColor} text-xl`}>
                {fixture.awayScore ?? 0}
              </span>
            </div>
          ) : (
            <span className="tc-text-muted text-sm font-medium px-3">
              {formatKickoffTime(fixture.kickoffTime)}
            </span>
          )}
          <span className="font-semibold text-base">
            {fixture.awayTeam}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {fixture.finished && (
            <span className="tc-chip shrink-0">FT</span>
          )}
          {fixture.started && !fixture.finished && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 shrink-0">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          )}
        </div>
      </div>

      {players.length > 0 && (
        <div className="border-t border-[color:var(--surface-border)] px-4 py-3 bg-[color:var(--surface-elevated)]/40">
          <div className="flex flex-wrap gap-2 justify-center">
            {players.map((player) => (
              <div
                key={player.elementId}
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] px-3 py-1.5"
              >
                <span className="text-sm font-medium">{player.name}</span>
                {(player.isCaptain || player.isViceCaptain) && (
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {player.isCaptain ? "C" : "V"}
                  </span>
                )}
                <span className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)]/15 px-2 py-0.5 text-xs font-bold text-[color:var(--accent)] min-w-[24px]">
                  {player.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
