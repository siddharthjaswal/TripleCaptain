"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { PlayerDetailsDTO } from "@/lib/fpl/dto";
import { getPlayerPhotoUrl } from "@/lib/fpl/images";

type PlayerDetailsModalProps = {
  playerId: number;
  isOpen: boolean;
  onClose: () => void;
};

export function PlayerDetailsModal({
  playerId,
  isOpen,
  onClose,
}: PlayerDetailsModalProps) {
  const [player, setPlayer] = useState<PlayerDetailsDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!isOpen || !playerId) return;

    const fetchPlayerDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/players/${playerId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch player details");
        }

        const data: PlayerDetailsDTO = await response.json();
        setPlayer(data);
      } catch (err) {
        console.error("Error fetching player details:", err);
        setError("Unable to load player details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerDetails();
  }, [playerId, isOpen]);

  if (!isOpen) return null;

  const photoUrl = player?.photo ? getPlayerPhotoUrl(player.photo) : null;
  const showFallback = !photoUrl || imageError;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="tc-card rounded-3xl p-6 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="tc-focus-visible absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-[color:var(--surface-hover)]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[color:var(--surface-border)] border-t-[color:var(--accent)]" />
            <p className="mt-4 text-sm tc-text-muted">Loading player details...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="py-12 text-center">
            <p className="text-rose-400">{error}</p>
          </div>
        )}

        {/* Player Details */}
        {player && !isLoading && !error && (
          <>
            {/* Header Section */}
            <div className="flex items-start gap-6 pb-6 border-b border-[color:var(--surface-border)]">
              <div className="flex-shrink-0">
                {!showFallback ? (
                  <Image
                    src={photoUrl}
                    alt={player.name}
                    width={100}
                    height={100}
                    className="object-contain rounded-lg"
                    unoptimized
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="tc-placeholder-avatar flex h-[100px] w-[100px] items-center justify-center rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-12 w-12"
                    >
                      <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold mb-1">{player.fullName || player.name}</h2>
                <div className="flex items-center gap-3 flex-wrap mb-3">
                  <span className="tc-chip">{player.team}</span>
                  <span className="tc-chip">{player.position}</span>
                  <span className="tc-chip font-mono">£{player.currentPrice}m</span>
                </div>

                {/* Availability Warning */}
                {player.status !== 'Available' && (
                  <div className="inline-flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4 text-amber-500"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <span className="font-semibold text-amber-500">{player.status}</span>
                      {player.news && <span className="ml-2 tc-text-muted">• {player.news}</span>}
                      {player.chanceOfPlayingNextRound !== null && (
                        <span className="ml-2 tc-text-muted">• {player.chanceOfPlayingNextRound}% chance of playing</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-b border-[color:var(--surface-border)]">
              <StatCard label="Total Points" value={player.totalPoints} />
              <StatCard label="PPG" value={player.pointsPerGame.toFixed(1)} />
              <StatCard label="Form" value={player.form.toFixed(1)} />
              <StatCard label="Owned by" value={`${player.selectedByPercent}%`} />
            </div>

            {/* Season Stats */}
            <div className="py-6 border-b border-[color:var(--surface-border)]">
              <h3 className="text-sm font-semibold uppercase tracking-wide tc-text-muted mb-4">
                Season Statistics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <MiniStat label="Minutes" value={player.minutes} />
                <MiniStat label="Goals" value={player.goalsScored} />
                <MiniStat label="Assists" value={player.assists} />
                <MiniStat label="Clean Sheets" value={player.cleanSheets} />
                <MiniStat label="Goals Conceded" value={player.goalsConceded} />
                <MiniStat label="Bonus" value={player.bonus} />
                <MiniStat label="Yellow Cards" value={player.yellowCards} />
                <MiniStat label="Red Cards" value={player.redCards} />
                {player.position === "GK" && (
                  <>
                    <MiniStat label="Saves" value={player.saves} />
                    <MiniStat label="Penalties Saved" value={player.penaltiesSaved} />
                  </>
                )}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="py-6 border-b border-[color:var(--surface-border)]">
              <h3 className="text-sm font-semibold uppercase tracking-wide tc-text-muted mb-4">
                Expected Stats
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MiniStat label="xP Next GW" value={player.expectedPoints.toFixed(1)} />
                <MiniStat label="xG" value={player.expectedGoals.toFixed(2)} />
                <MiniStat label="xA" value={player.expectedAssists.toFixed(2)} />
                <MiniStat label="xGI" value={player.expectedGoalInvolvements.toFixed(2)} />
              </div>
            </div>

            {/* ICT Index */}
            <div className="py-6 border-b border-[color:var(--surface-border)]">
              <h3 className="text-sm font-semibold uppercase tracking-wide tc-text-muted mb-4">
                ICT Index
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MiniStat label="ICT Index" value={player.ictIndex.toFixed(1)} />
                <MiniStat label="Influence" value={player.influence.toFixed(1)} />
                <MiniStat label="Creativity" value={player.creativity.toFixed(1)} />
                <MiniStat label="Threat" value={player.threat.toFixed(1)} />
              </div>
            </div>

            {/* Transfers */}
            <div className="py-6 border-b border-[color:var(--surface-border)]">
              <h3 className="text-sm font-semibold uppercase tracking-wide tc-text-muted mb-4">
                Transfers
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MiniStat label="In (Total)" value={player.transfersIn.toLocaleString()} />
                <MiniStat label="Out (Total)" value={player.transfersOut.toLocaleString()} />
                <MiniStat label="In (This GW)" value={player.transfersInEvent.toLocaleString()} />
                <MiniStat label="Out (This GW)" value={player.transfersOutEvent.toLocaleString()} />
              </div>
            </div>

            {/* Next Fixtures */}
            {player.nextFixtures.length > 0 && (
              <div className="pt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide tc-text-muted mb-4">
                  Next 5 Fixtures
                </h3>
                <div className="flex flex-wrap gap-2">
                  {player.nextFixtures.map((fixture, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-elevated)]/60 px-3 py-2"
                    >
                      <span className="text-xs tc-text-muted">
                        {fixture.isHome ? '🏠' : '📍'}
                      </span>
                      <span className="text-sm font-medium">
                        {fixture.opponentShort}
                      </span>
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${getDifficultyColor(
                          fixture.difficulty
                        )}`}
                      >
                        {fixture.difficulty}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-[color:var(--accent)]">{value}</div>
      <div className="text-xs tc-text-muted mt-1">{label}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-[color:var(--surface-elevated)]/60 px-3 py-2">
      <span className="text-xs tc-text-muted">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function getDifficultyColor(difficulty: number): string {
  if (difficulty <= 2) return "bg-emerald-500/20 text-emerald-400";
  if (difficulty === 3) return "bg-slate-500/20 text-slate-400";
  if (difficulty === 4) return "bg-amber-500/20 text-amber-400";
  return "bg-rose-500/20 text-rose-400";
}
