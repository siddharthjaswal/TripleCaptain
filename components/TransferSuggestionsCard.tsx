"use client";

import { useState } from "react";
import Image from "next/image";
import type { TransferSuggestionDTO } from "@/lib/fpl/dto";
import { getPlayerPhotoUrl } from "@/lib/fpl/images";

type TransferSuggestionsCardProps = {
  suggestions: TransferSuggestionDTO[];
  budgetAvailable: number;
};

export function TransferSuggestionsCard({
  suggestions,
  budgetAvailable,
}: TransferSuggestionsCardProps) {
  if (suggestions.length === 0) {
    return (
      <section className="tc-card rounded-3xl p-6 shadow-lg">
        <header className="mb-6">
          <h2 className="text-xl font-semibold">Transfer Suggestions 🔄</h2>
          <p className="tc-text-muted text-sm mt-1">
            Recommended transfers based on form and fixtures
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
                d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Your Squad Looks Good!</h3>
          <p className="tc-text-muted max-w-md">
            No transfer suggestions at the moment. Your current squad appears well-optimized for the upcoming gameweeks.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="tc-card rounded-3xl p-6 shadow-lg">
      <header className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Transfer Suggestions 🔄</h2>
            <p className="tc-text-muted text-sm mt-1">
              Top {suggestions.length} recommended transfers based on form and fixtures
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-[color:var(--surface-elevated)] px-4 py-3 border border-[color:var(--surface-border)]">
            <div className="text-right">
              <p className="tc-text-muted text-xs font-medium uppercase tracking-wide">Budget Available</p>
              <p className="font-bold text-2xl text-[color:var(--accent)]">
                £{budgetAvailable.toFixed(1)}m
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {suggestions.map((suggestion, index) => (
          <TransferSuggestionItem
            key={`${suggestion.playerOut.playerId}-${suggestion.playerIn.playerId}`}
            suggestion={suggestion}
            rank={index + 1}
          />
        ))}
      </div>
    </section>
  );
}

type TransferSuggestionItemProps = {
  suggestion: TransferSuggestionDTO;
  rank: number;
};

function TransferSuggestionItem({
  suggestion,
  rank,
}: TransferSuggestionItemProps) {
  const rankColors = [
    "from-yellow-500 to-yellow-600", // 1st - Gold
    "from-gray-400 to-gray-500",     // 2nd - Silver
    "from-orange-600 to-orange-700", // 3rd - Bronze
  ];

  return (
    <div className="flex flex-col tc-card rounded-3xl p-6 border border-[color:var(--surface-border)] hover:border-[color:var(--accent)] transition shadow-sm hover:shadow-md">
      {/* Rank Badge */}
      <div className="mb-6 flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${rankColors[rank - 1] || rankColors[2]} text-white font-bold text-lg shadow-md`}
        >
          {rank}
        </div>
        <span className="text-xs font-medium tc-text-muted uppercase tracking-wider">
          Suggestion #{rank}
        </span>
      </div>

      {/* Player OUT */}
      <div className="mb-5 rounded-2xl bg-red-500/10 border-2 border-red-500/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/20">
            <span className="text-sm font-bold text-red-600 dark:text-red-400">⬇</span>
          </div>
          <span className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">
            Transfer Out
          </span>
        </div>
        <PlayerTransferInfo
          player={{
            playerId: suggestion.playerOut.playerId,
            playerName: suggestion.playerOut.playerName,
            playerPhoto: suggestion.playerOut.playerPhoto,
            position: suggestion.playerOut.position,
            cost: suggestion.playerOut.cost,
            expectedPoints: suggestion.playerOut.expectedPoints,
            form: suggestion.playerOut.form,
          }}
        />
        <div className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 h-16 flex items-center justify-center">
          <p className="text-xs tc-text-muted leading-relaxed text-center">{suggestion.playerOut.reasoning}</p>
        </div>
      </div>

      {/* Transfer Arrow */}
      <div className="flex justify-center -my-2 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--accent)] text-[color:var(--accent-contrast)] shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path
              fillRule="evenodd"
              d="M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* Player IN */}
      <div className="mb-5 rounded-2xl bg-green-500/10 border-2 border-green-500/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/20">
            <span className="text-sm font-bold text-green-600 dark:text-green-400">⬆</span>
          </div>
          <span className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">
            Transfer In
          </span>
        </div>
        <PlayerTransferInfo
          player={{
            playerId: suggestion.playerIn.playerId,
            playerName: suggestion.playerIn.playerName,
            playerPhoto: suggestion.playerIn.playerPhoto,
            position: suggestion.playerIn.position,
            cost: suggestion.playerIn.cost,
            expectedPoints: suggestion.playerIn.expectedPoints,
            form: suggestion.playerIn.form,
          }}
        />

        {/* Upcoming Fixtures */}
        {suggestion.playerIn.upcomingFixtures.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold tc-text-muted uppercase tracking-wide mb-2">Next 3 Fixtures</p>
            <div className="flex items-center gap-2">
              {suggestion.playerIn.upcomingFixtures.map((fixture, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-lg px-2 py-2 text-center border-2 ${
                    fixture.difficulty <= 2
                      ? "bg-green-100 border-green-400 text-green-800 dark:bg-green-500/20 dark:border-green-500/40 dark:text-green-300"
                      : fixture.difficulty === 3
                        ? "bg-yellow-100 border-yellow-400 text-yellow-800 dark:bg-yellow-500/20 dark:border-yellow-500/40 dark:text-yellow-300"
                        : "bg-red-100 border-red-400 text-red-800 dark:bg-red-500/20 dark:border-red-500/40 dark:text-red-300"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    {fixture.isHome ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path fillRule="evenodd" d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
                      </svg>
                    )}
                    <p className="text-xs font-bold">
                      {fixture.isHome ? "HOME" : "AWAY"}
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

        <div className="mt-3 rounded-lg bg-green-500/10 px-3 py-2 h-16 flex items-center justify-center">
          <p className="text-xs tc-text-muted leading-relaxed text-center">{suggestion.playerIn.reasoning}</p>
        </div>
      </div>

      {/* Net Cost - Always at bottom */}
      <div className="mt-auto rounded-xl bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold tc-text-muted">Net Cost</span>
          <div className="flex items-center gap-2">
            <span
              className={`text-xl font-bold ${
                suggestion.netCost > 0
                  ? "text-red-600 dark:text-red-400"
                  : suggestion.netCost < 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-[color:var(--text-primary)]"
              }`}
            >
              {suggestion.netCost > 0 ? "-" : suggestion.netCost < 0 ? "+" : ""}£
              {Math.abs(suggestion.netCost).toFixed(1)}m
            </span>
            {suggestion.netCost === 0 && (
              <span className="text-xs tc-text-muted">(Free)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type PlayerTransferInfoProps = {
  player: {
    playerId: number;
    playerName: string;
    playerPhoto: string | null;
    position: "GK" | "DEF" | "MID" | "FWD";
    cost: number;
    expectedPoints: number;
    form: number;
  };
};

function PlayerTransferInfo({ player }: PlayerTransferInfoProps) {
  const photoUrl = getPlayerPhotoUrl(player.playerPhoto);
  const [imageError, setImageError] = useState(false);

  const showFallback = !photoUrl || imageError;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {/* Player Photo */}
        {!showFallback ? (
          <Image
            src={photoUrl}
            alt={player.playerName}
            width={56}
            height={56}
            className="rounded-xl object-cover border-2 border-white/20"
            unoptimized
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-white/20" style={{ width: '56px', height: '56px' }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-7 w-7 text-slate-400"
            >
              <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
            </svg>
          </div>
        )}

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base truncate text-[color:var(--text-primary)]">
            {player.playerName}
          </p>
          <div className="flex items-center gap-2 text-sm tc-text-muted mt-1">
            <span className="font-medium">{player.position}</span>
            <span>•</span>
            <span className="font-semibold text-[color:var(--accent)]">
              £{player.cost.toFixed(1)}m
            </span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] p-2.5 text-center">
          <p className="text-xs font-medium tc-text-muted uppercase tracking-wide">Expected Pts</p>
          <p className="font-bold text-lg mt-0.5 text-[color:var(--text-primary)]">
            {player.expectedPoints.toFixed(1)}
          </p>
        </div>
        <div className="rounded-lg bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] p-2.5 text-center">
          <p className="text-xs font-medium tc-text-muted uppercase tracking-wide">Form</p>
          <p className="font-bold text-lg mt-0.5 text-[color:var(--text-primary)]">
            {player.form.toFixed(1)}
          </p>
        </div>
      </div>
    </div>
  );
}
