"use client";

import { useState } from "react";
import Image from "next/image";
import type { LatestGwDTO } from "@/lib/fpl/dto";
import { getPlayerPhotoUrl } from "@/lib/fpl/images";
import { PlayerDetailsModal } from "./PlayerDetailsModal";

type TeamPitchModalProps = {
  teamPicks: LatestGwDTO;
  teamName: string;
  isOpen: boolean;
  onClose: () => void;
};

export function TeamPitchModal({
  teamPicks,
  teamName,
  isOpen,
  onClose,
}: TeamPitchModalProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  if (!isOpen) return null;

  // Group players by position
  const gk = teamPicks.players.filter((p) => !p.isBench && p.position === "GK");
  const def = teamPicks.players.filter((p) => !p.isBench && p.position === "DEF");
  const mid = teamPicks.players.filter((p) => !p.isBench && p.position === "MID");
  const fwd = teamPicks.players.filter((p) => !p.isBench && p.position === "FWD");
  const bench = teamPicks.players.filter((p) => p.isBench);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="tc-card rounded-3xl p-6 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">{teamName}</h2>
            <p className="tc-text-muted text-sm mt-1">
              Gameweek {teamPicks.event} • {teamPicks.points} points
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tc-focus-visible flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-[color:var(--surface-hover)]"
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
        </div>

        {/* Pitch */}
        <div className="tc-pitch mb-6">
          {/* Forwards */}
          {fwd.length > 0 && (
            <div className="tc-pitch-row">
              <div className="tc-pitch-row__label">FORWARDS</div>
              <div className="tc-pitch-row__players">
                {fwd.map((player) => (
                  <PlayerChip
                    key={player.elementId}
                    player={player}
                    onClick={() => setSelectedPlayerId(player.elementId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Midfielders */}
          {mid.length > 0 && (
            <div className="tc-pitch-row">
              <div className="tc-pitch-row__label">MIDFIELDERS</div>
              <div className="tc-pitch-row__players">
                {mid.map((player) => (
                  <PlayerChip
                    key={player.elementId}
                    player={player}
                    onClick={() => setSelectedPlayerId(player.elementId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Defenders */}
          {def.length > 0 && (
            <div className="tc-pitch-row">
              <div className="tc-pitch-row__label">DEFENDERS</div>
              <div className="tc-pitch-row__players">
                {def.map((player) => (
                  <PlayerChip
                    key={player.elementId}
                    player={player}
                    onClick={() => setSelectedPlayerId(player.elementId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Goalkeeper */}
          {gk.length > 0 && (
            <div className="tc-pitch-row">
              <div className="tc-pitch-row__label">GOALKEEPER</div>
              <div className="tc-pitch-row__players">
                {gk.map((player) => (
                  <PlayerChip
                    key={player.elementId}
                    player={player}
                    onClick={() => setSelectedPlayerId(player.elementId)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bench */}
        {bench.length > 0 && (
          <div className="border-t border-[color:var(--surface-border)] pt-6">
            <h3 className="tc-text-muted text-xs font-semibold uppercase tracking-wide mb-3">
              Substitutes
            </h3>
            <div className="flex flex-wrap gap-2">
              {bench.map((player) => (
                <div
                  key={player.elementId}
                  className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-elevated)]/60 px-3 py-2"
                >
                  <span className="text-sm font-medium">{player.name}</span>
                  <span className="tc-text-muted text-xs">{player.position}</span>
                  <span className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)]/15 px-2 py-0.5 text-xs font-bold text-[color:var(--accent)]">
                    {player.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Player Details Modal */}
        {selectedPlayerId && (
          <PlayerDetailsModal
            playerId={selectedPlayerId}
            isOpen={true}
            onClose={() => setSelectedPlayerId(null)}
          />
        )}
      </div>
    </div>
  );
}

type PlayerChipProps = {
  player: {
    elementId: number;
    name: string;
    position: string;
    points: number;
    isCaptain: boolean;
    isViceCaptain: boolean;
    photo: string | null;
  };
  onClick?: () => void;
};

function PlayerChip({ player, onClick }: PlayerChipProps) {
  const [imageError, setImageError] = useState(false);
  const photoUrl = getPlayerPhotoUrl(player.photo);
  const showFallback = !photoUrl || imageError;

  return (
    <div
      className={`tc-player-chip-vertical tc-player-chip-vertical--compact ${onClick ? "cursor-pointer transition hover:scale-105" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <div className="tc-player-chip-vertical__image">
        {!showFallback ? (
          <Image
            src={photoUrl}
            alt={player.name}
            width={60}
            height={60}
            className="object-contain"
            unoptimized
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="tc-placeholder-avatar flex h-[60px] w-[60px] items-center justify-center rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-6 w-6"
            >
              <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
            </svg>
          </div>
        )}

        {player.isCaptain && (
          <div className="tc-player-chip-vertical__badge">C</div>
        )}
        {player.isViceCaptain && (
          <div className="tc-player-chip-vertical__badge" style={{ background: 'var(--info)' }}>V</div>
        )}
      </div>

      <div className="tc-player-chip-vertical__info">
        <div className="tc-player-chip-vertical__name">{player.name}</div>
        <div className="tc-player-chip-vertical__position">{player.position}</div>
        <div className="tc-player-chip-vertical__points">{player.points}</div>
      </div>
    </div>
  );
}
