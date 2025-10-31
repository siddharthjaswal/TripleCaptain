"use client";

import { useState } from "react";
import Image from "next/image";
import type { DifferentialPickDTO } from "@/lib/fpl/dto";
import { getPlayerPhotoUrl } from "@/lib/fpl/images";

type DifferentialPicksCardProps = {
  differentials: DifferentialPickDTO[];
};

export function DifferentialPicksCard({
  differentials,
}: DifferentialPicksCardProps) {
  if (differentials.length === 0) {
    return (
      <section className="tc-card rounded-3xl p-6 shadow-lg">
        <header className="mb-6">
          <h2 className="text-xl font-semibold">Differential Picks 💎</h2>
          <p className="tc-text-muted text-sm mt-1">
            Low-ownership, high-upside players to gain an edge over your rivals
          </p>
        </header>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--surface-elevated)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-8 w-8 tc-text-muted"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No Differentials Found</h3>
          <p className="tc-text-muted max-w-md">
            No affordable differential picks available at the moment. All low-ownership players either don't meet the criteria or are outside your budget.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="tc-card rounded-3xl p-6 shadow-lg">
      <header className="mb-8">
        <h2 className="text-xl font-semibold">Differential Picks 💎</h2>
        <p className="tc-text-muted text-sm mt-1">
          Low-ownership, high-upside players to gain an edge over your rivals
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {differentials.map((diff, index) => (
          <DifferentialPickItem
            key={diff.playerId}
            differential={diff}
            rank={index + 1}
          />
        ))}
      </div>
    </section>
  );
}

type DifferentialPickItemProps = {
  differential: DifferentialPickDTO;
  rank: number;
};

function DifferentialPickItem({
  differential,
  rank,
}: DifferentialPickItemProps) {
  const photoUrl = getPlayerPhotoUrl(differential.playerPhoto);
  const [imageError, setImageError] = useState(false);

  const showFallback = !photoUrl || imageError;

  const rankColors = [
    "from-yellow-500 to-yellow-600", // 1st - Gold
    "from-gray-400 to-gray-500",     // 2nd - Silver
    "from-orange-600 to-orange-700", // 3rd - Bronze
    "from-blue-500 to-blue-600",     // 4th - Blue
    "from-purple-500 to-purple-600", // 5th - Purple
  ];

  return (
    <div className="flex flex-col tc-card rounded-3xl p-6 border border-[color:var(--surface-border)] hover:border-[color:var(--accent)] transition shadow-sm hover:shadow-md">
      {/* Rank Badge */}
      <div className="mb-6 flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${rankColors[rank - 1] || rankColors[4]} text-white font-bold text-lg shadow-md`}
        >
          {rank}
        </div>
        <div className="text-right">
          <p className="text-xs font-medium tc-text-muted uppercase tracking-wide">
            Ownership
          </p>
          <p className="font-bold text-lg text-[color:var(--accent)]">
            {differential.ownership.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Player Info */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-4">
          {/* Player Photo */}
          {!showFallback ? (
            <Image
              src={photoUrl}
              alt={differential.playerName}
              width={64}
              height={64}
              className="rounded-xl object-cover border-2 border-white/20"
              unoptimized
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="tc-placeholder-avatar flex items-center justify-center rounded-xl border-2 border-[color:var(--surface-border)]" style={{ width: '64px', height: '64px' }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-8 w-8"
              >
                <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
              </svg>
            </div>
          )}

          {/* Player Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base truncate text-[color:var(--text-primary)]">
              {differential.playerName}
            </h3>
            <div className="flex items-center gap-2 text-sm tc-text-muted mt-1">
              <span className="font-medium">{differential.position}</span>
              <span>•</span>
              <span className="font-semibold">{differential.team}</span>
            </div>
            <div className="text-sm font-semibold text-[color:var(--accent)] mt-1">
              £{differential.cost.toFixed(1)}m
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-lg bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] p-2.5 text-center">
            <p className="text-xs font-medium tc-text-muted uppercase tracking-wide">
              Expected
            </p>
            <p className="font-bold text-base mt-0.5 text-[color:var(--text-primary)]">
              {differential.expectedPoints.toFixed(1)}
            </p>
          </div>
          <div className="rounded-lg bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] p-2.5 text-center">
            <p className="text-xs font-medium tc-text-muted uppercase tracking-wide">
              Form
            </p>
            <p className="font-bold text-base mt-0.5 text-[color:var(--text-primary)]">
              {differential.form.toFixed(1)}
            </p>
          </div>
          <div className="rounded-lg bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] p-2.5 text-center">
            <p className="text-xs font-medium tc-text-muted uppercase tracking-wide">
              Upside
            </p>
            <p className="font-bold text-base mt-0.5 text-[color:var(--text-primary)]">
              {differential.upsideScore.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Next Fixture */}
        {differential.fixture && (
          <div className="mb-4">
            <p className="text-xs font-semibold tc-text-muted uppercase tracking-wide mb-2">
              Next Fixture
            </p>
            <div
              className={`rounded-lg px-3 py-2 text-center border-2 ${
                differential.fixture.difficulty <= 2
                  ? "bg-green-200 border-green-500 text-green-900 dark:bg-green-500/20 dark:border-green-500/40 dark:text-green-300"
                  : differential.fixture.difficulty === 3
                    ? "bg-amber-200 border-amber-500 text-amber-900 dark:bg-yellow-500/20 dark:border-yellow-500/40 dark:text-yellow-300"
                    : "bg-red-200 border-red-500 text-red-900 dark:bg-red-500/20 dark:border-red-500/40 dark:text-red-300"
              }`}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                {differential.fixture.isHome ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
                  </svg>
                )}
                <p className="text-xs font-bold">
                  {differential.fixture.isHome ? "HOME" : "AWAY"}
                </p>
              </div>
              <p className="text-sm font-semibold">
                {differential.fixture.opponentShort}
              </p>
            </div>
          </div>
        )}

        {/* Upcoming Fixtures */}
        {differential.upcomingFixtures.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold tc-text-muted uppercase tracking-wide mb-2">
              Upcoming Fixtures
            </p>
            <div className="flex items-center gap-2">
              {differential.upcomingFixtures.slice(0, 3).map((fixture, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-center border-2 ${
                    fixture.difficulty <= 2
                      ? "bg-green-200 border-green-500 text-green-900 dark:bg-green-500/20 dark:border-green-500/40 dark:text-green-300"
                      : fixture.difficulty === 3
                        ? "bg-amber-200 border-amber-500 text-amber-900 dark:bg-yellow-500/20 dark:border-yellow-500/40 dark:text-yellow-300"
                        : "bg-red-200 border-red-500 text-red-900 dark:bg-red-500/20 dark:border-red-500/40 dark:text-red-300"
                  }`}
                >
                  <div className="flex items-center justify-center gap-0.5 mb-0.5">
                    {fixture.isHome ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5">
                        <path fillRule="evenodd" d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5">
                        <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
                      </svg>
                    )}
                    <p className="text-[10px] font-bold leading-none">
                      {fixture.isHome ? "H" : "A"}
                    </p>
                  </div>
                  <p className="text-xs font-semibold">
                    {fixture.opponentShort}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reasoning */}
        <div className="rounded-xl bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] p-4">
          <p className="text-xs tc-text-muted leading-relaxed">
            {differential.reasoning}
          </p>
        </div>
      </div>
    </div>
  );
}
