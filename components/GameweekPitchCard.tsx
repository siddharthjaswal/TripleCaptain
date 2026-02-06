"use client";

import { useState } from "react";
import type { LatestGwDTO, LatestGwPlayerDTO } from "@/lib/fpl/dto";
import { formatNumber } from "@/lib/format";
import { getPlayerPhotoUrl } from "@/lib/fpl/images";
import Image from "next/image";
import { PlayerDetailsModal } from "./PlayerDetailsModal";

const POSITION_ORDER: Array<LatestGwPlayerDTO["position"]> = [
  "GK",
  "DEF",
  "MID",
  "FWD",
];

type GameweekPitchCardProps = {
  latest: LatestGwDTO;
};

export function GameweekPitchCard({ latest }: GameweekPitchCardProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  if (!latest.players || latest.players.length === 0) {
    return null;
  }

  const starters = latest.players.filter((player) => !player.isBench);
  const bench = latest.players.filter((player) => player.isBench);

  return (
    <section className="tc-card rounded-3xl p-6 shadow-lg">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="tc-text-muted text-xs uppercase tracking-wide">
            Gameweek Overview
          </p>
          <h2 className="text-xl font-semibold">Gameweek {latest.event}</h2>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span>
            Total Points: <strong>{formatNumber(latest.points)}</strong>
          </span>
          {latest.rank ? (
            <span>
              GW Rank: <strong>#{formatNumber(latest.rank)}</strong>
            </span>
          ) : null}
          {latest.pointsOnBench ? (
            <span>
              Bench: <strong>{formatNumber(latest.pointsOnBench)}</strong>
            </span>
          ) : null}
        </div>
      </header>
      <div className="mt-6 space-y-4">
        <div className="tc-pitch rounded-3xl border border-[color:var(--surface-border)]">
          <div className="tc-pitch-bottom-box" />
          {POSITION_ORDER.map((position) => {
            const rowPlayers = starters.filter(
              (player) => player.position === position,
            );
            if (rowPlayers.length === 0) {
              return null;
            }
            return (
              <PitchRow
                key={position}
                position={position}
                players={rowPlayers}
                isLiveGameweek={latest.isLive}
                onPlayerClick={setSelectedPlayerId}
              />
            );
          })}
        </div>
        {bench.length > 0 ? (
          <div>
            <p className="tc-text-muted text-xs font-semibold uppercase tracking-wide">
              Bench
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {bench.map((player) => (
                <PlayerChip
                  key={player.elementId}
                  player={player}
                  compact
                  isLiveGameweek={latest.isLive}
                  onClick={() => setSelectedPlayerId(player.elementId)}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Player Details Modal */}
      {selectedPlayerId && (
        <PlayerDetailsModal
          playerId={selectedPlayerId}
          isOpen={true}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}
    </section>
  );
}

type PitchRowProps = {
  position: LatestGwPlayerDTO["position"];
  players: LatestGwPlayerDTO[];
  isLiveGameweek: boolean;
  onPlayerClick: (playerId: number) => void;
};

function PitchRow({ position, players, isLiveGameweek, onPlayerClick }: PitchRowProps) {
  return (
    <div className="tc-pitch-row">
      <span className="tc-pitch-row__label text-xs font-semibold uppercase tracking-wide">
        {labelPosition(position)}
      </span>
      <div className="tc-pitch-row__players">
        {players.map((player) => (
          <PlayerChip
            key={player.elementId}
            player={player}
            isLiveGameweek={isLiveGameweek}
            onClick={() => onPlayerClick(player.elementId)}
          />
        ))}
      </div>
    </div>
  );
}

type PlayerChipProps = {
  player: LatestGwPlayerDTO;
  compact?: boolean;
  isLiveGameweek: boolean;
  onClick?: () => void;
};

function PlayerChip({ player, compact = false, isLiveGameweek, onClick }: PlayerChipProps) {
  const badge = player.isCaptain ? "C" : player.isViceCaptain ? "V" : null;
  const multiplierLabel =
    player.multiplier > 1 ? `×${player.multiplier}` : null;

  const photoUrl = getPlayerPhotoUrl(player.photo, player.code);
  const showLiveIndicator = isLiveGameweek && player.rawPoints > 0;
  const [imgUrl, setImgUrl] = useState(photoUrl);
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    if (!imgUrl) return;
    
    // Fallback 1: Try .jpg instead of .png
    if (imgUrl.endsWith('.png')) {
      setImgUrl(imgUrl.replace('.png', '.jpg'));
      return;
    }
    
    // Fallback 2: Try without 'p' prefix
    if (imgUrl.includes('/p')) {
        setImgUrl(imgUrl.replace('/p', '/'));
        return;
    }

    // Fallback 3: Try standard dist path
    if (imgUrl.includes('photos/players')) {
        const parts = imgUrl.split('/');
        const fileName = parts[parts.length - 1];
        setImgUrl(`https://fantasy.premierleague.com/dist/img/players/${fileName}`);
        return;
    }

    setImageError(true);
  };

  const showFallback = !imgUrl || imageError;
  const isHighImpact = player.impactScore !== null && player.impactScore >= 5;
  const isDeadwood = player.points <= 2 && player.ownership !== null && player.ownership > 20;

  return (
    <div
      className={`tc-player-chip-vertical ${compact ? "tc-player-chip-vertical--compact" : ""} ${onClick ? "cursor-pointer transition hover:scale-105" : ""} ${isHighImpact ? 'z-30' : ''}`}
      aria-label={`${player.name}, ${player.position}, ${player.points} points`}
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
            src={imgUrl!}
            alt={player.name}
            width={compact ? 44 : 66}
            height={compact ? 55 : 82}
            className="object-contain"
            unoptimized
            onError={handleImageError}
          />
        ) : (
          <div
            className="flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur-sm border border-white/10"
            style={{ width: compact ? '40px' : '60px', height: compact ? '50px' : '75px' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`text-slate-400 ${compact ? 'h-6 w-6' : 'h-8 w-8'}`}
            >
              <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
            </svg>
          </div>
        )}
        {badge && (
          <span className="tc-player-chip-vertical__badge">
            {badge}
          </span>
        )}
        {showLiveIndicator && (
          <span className="tc-player-chip-vertical__live">
            <span className="tc-player-chip-vertical__live-dot" />
          </span>
        )}
        {isDeadwood && (
            <div className="absolute inset-0 bg-red-900/40 rounded-xl flex items-center justify-center backdrop-blur-[1px] z-20">
                <span className="text-[10px] font-black text-white bg-red-600 px-1.5 rounded-sm uppercase tracking-tighter shadow-lg">Blanked</span>
            </div>
        )}
      </div>
      <div className="tc-player-chip-vertical__info">
        <p className="tc-player-chip-vertical__name">{player.name}</p>
        <p className="tc-player-chip-vertical__position">
            {player.position}
            {multiplierLabel ? ` ${multiplierLabel}` : ""}
        </p>
        <div className="tc-player-chip-vertical__points">{player.points}</div>
        
        {player.impactScore !== null && player.impactScore > 5 && (
            <div className="tc-impact-badge">
                <span title="Rank Booster vs the World" className="text-[9px] font-black bg-emerald-500 text-black px-1.5 py-0.5 rounded-full shadow-lg border border-white/20">
                    +{player.impactScore}
                </span>
            </div>
        )}
      </div>
    </div>
  );
}

function labelPosition(position: LatestGwPlayerDTO["position"]): string {
  switch (position) {
    case "GK":
      return "Goalkeeper";
    case "DEF":
      return "Defence";
    case "MID":
      return "Midfield";
    case "FWD":
      return "Forwards";
    default:
      return position;
  }
}
