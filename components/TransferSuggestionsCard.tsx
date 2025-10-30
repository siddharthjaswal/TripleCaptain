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
    return null;
  }

  return (
    <section className="tc-card rounded-3xl p-6 shadow-lg">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Transfer Suggestions 🔄</h2>
            <p className="tc-text-muted text-sm mt-1">
              Top {suggestions.length} recommended transfers
            </p>
          </div>
          <div className="text-right">
            <p className="tc-text-muted text-xs">Budget Available</p>
            <p className="font-bold text-lg text-[color:var(--accent)]">
              £{budgetAvailable.toFixed(1)}m
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
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
  return (
    <div className="tc-card rounded-2xl p-4 border border-[color:var(--surface-border)] hover:border-[color:var(--accent)] transition">
      {/* Rank Badge */}
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-xs font-semibold tc-text-muted">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)]">
            {rank}
          </span>
          Transfer Suggestion
        </span>
      </div>

      {/* Player OUT */}
      <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3">
        <div className="flex items-center gap-1 mb-2">
          <span className="text-xs font-semibold text-red-600 dark:text-red-400">
            ⬇️ OUT
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
        <p className="text-xs tc-text-muted mt-2">{suggestion.playerOut.reasoning}</p>
      </div>

      {/* Player IN */}
      <div className="mb-3 rounded-lg bg-green-500/10 border border-green-500/30 p-3">
        <div className="flex items-center gap-1 mb-2">
          <span className="text-xs font-semibold text-green-600 dark:text-green-400">
            ⬆️ IN
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
          <div className="mt-2 flex items-center gap-1">
            {suggestion.playerIn.upcomingFixtures.map((fixture, i) => (
              <div
                key={i}
                className={`flex-1 rounded px-2 py-1 text-center ${
                  fixture.difficulty <= 2
                    ? "bg-green-500/20 text-green-600 dark:text-green-400"
                    : fixture.difficulty === 3
                      ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                      : "bg-red-500/20 text-red-600 dark:text-red-400"
                }`}
              >
                <p className="text-xs font-medium">
                  {fixture.isHome ? "vs" : "@"} {fixture.opponentShort}
                </p>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs tc-text-muted mt-2">{suggestion.playerIn.reasoning}</p>
      </div>

      {/* Net Cost */}
      <div className="rounded-lg bg-[color:var(--surface-elevated)] p-2">
        <div className="flex items-center justify-between">
          <span className="text-xs tc-text-muted">Net Cost:</span>
          <span
            className={`text-sm font-bold ${
              suggestion.netCost > 0
                ? "text-red-600 dark:text-red-400"
                : suggestion.netCost < 0
                  ? "text-green-600 dark:text-green-400"
                  : ""
            }`}
          >
            {suggestion.netCost > 0 ? "-" : suggestion.netCost < 0 ? "+" : ""}£
            {Math.abs(suggestion.netCost).toFixed(1)}m
          </span>
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
    <div className="flex items-center gap-2">
      {/* Player Photo */}
      {!showFallback ? (
        <Image
          src={photoUrl}
          alt={player.playerName}
          width={40}
          height={40}
          className="rounded-lg object-cover"
          unoptimized
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-800">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5 text-slate-400"
          >
            <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
          </svg>
        </div>
      )}

      {/* Player Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{player.playerName}</p>
        <div className="flex items-center gap-2 text-xs tc-text-muted">
          <span>{player.position}</span>
          <span>•</span>
          <span>£{player.cost.toFixed(1)}m</span>
        </div>
      </div>

      {/* Stats */}
      <div className="text-right">
        <p className="text-xs tc-text-muted">EP</p>
        <p className="font-bold text-sm">{player.expectedPoints.toFixed(1)}</p>
      </div>
      <div className="text-right">
        <p className="text-xs tc-text-muted">Form</p>
        <p className="font-bold text-sm">{player.form.toFixed(1)}</p>
      </div>
    </div>
  );
}
