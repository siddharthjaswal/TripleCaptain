"use client";

import { useState } from "react";
import type { LatestGwDTO, LatestGwPlayerDTO } from "@/lib/fpl/dto";
import { formatNumber } from "@/lib/format";
import { getPlayerPhotoUrl } from "@/lib/fpl/images";
import Image from "next/image";

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
        <div className="tc-pitch rounded-3xl border border-[color:var(--surface-border)] p-4">
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
                <PlayerChip key={player.elementId} player={player} compact isLiveGameweek={latest.isLive} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

type PitchRowProps = {
  position: LatestGwPlayerDTO["position"];
  players: LatestGwPlayerDTO[];
  isLiveGameweek: boolean;
};

function PitchRow({ position, players, isLiveGameweek }: PitchRowProps) {
  return (
    <div className="tc-pitch-row">
      <span className="tc-pitch-row__label text-xs font-semibold uppercase tracking-wide">
        {labelPosition(position)}
      </span>
      <div className="tc-pitch-row__players">
        {players.map((player) => (
          <PlayerChip key={player.elementId} player={player} isLiveGameweek={isLiveGameweek} />
        ))}
      </div>
    </div>
  );
}

type PlayerChipProps = {
  player: LatestGwPlayerDTO;
  compact?: boolean;
  isLiveGameweek: boolean;
};

function PlayerChip({ player, compact = false, isLiveGameweek }: PlayerChipProps) {
  const badge = player.isCaptain ? "C" : player.isViceCaptain ? "V" : null;
  const multiplierLabel =
    player.multiplier > 1 ? `×${player.multiplier}` : null;

  const photoUrl = getPlayerPhotoUrl(player.photo);
  const showLiveIndicator = isLiveGameweek && player.rawPoints > 0;
  const [imageError, setImageError] = useState(false);

  const showFallback = !photoUrl || imageError;

  return (
    <div
      className={`tc-player-chip-vertical ${compact ? "tc-player-chip-vertical--compact" : ""}`}
      aria-label={`${player.name}, ${player.position}, ${player.points} points`}
    >
      <div className="tc-player-chip-vertical__image">
        {!showFallback ? (
          <Image
            src={photoUrl}
            alt={player.name}
            width={compact ? 48 : 56}
            height={compact ? 48 : 56}
            className="rounded-lg object-cover"
            unoptimized
            onError={() => setImageError(true)}
          />
        ) : (
          <div
            className="flex items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-800"
            style={{ width: compact ? '48px' : '56px', height: compact ? '48px' : '56px' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`text-slate-400 ${compact ? 'h-6 w-6' : 'h-7 w-7'}`}
            >
              <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
            </svg>
          </div>
        )}
        {badge && (
          <span className="tc-player-chip-vertical__badge" aria-label={badge === "C" ? "Captain" : "Vice Captain"}>
            {badge}
          </span>
        )}
        {showLiveIndicator && (
          <span className="tc-player-chip-vertical__live" aria-label="Playing">
            <span className="tc-player-chip-vertical__live-dot" />
          </span>
        )}
      </div>
      <div className="tc-player-chip-vertical__info">
        <p className="tc-player-chip-vertical__name">{player.name}</p>
        <p className="tc-player-chip-vertical__position">
          {player.position}
          {multiplierLabel ? ` ${multiplierLabel}` : ""}
        </p>
      </div>
      <div className="tc-player-chip-vertical__points">{player.points}</div>
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
