"use client";

import type { LatestGwDTO, LatestGwPlayerDTO } from "@/lib/fpl/dto";
import { formatNumber } from "@/lib/format";
import { getPlayerPhotoUrl, getTeamShirtUrl } from "@/lib/fpl/images";
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
                <PlayerChip key={player.elementId} player={player} compact />
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
};

function PitchRow({ position, players }: PitchRowProps) {
  return (
    <div className="tc-pitch-row">
      <span className="tc-pitch-row__label text-xs font-semibold uppercase tracking-wide">
        {labelPosition(position)}
      </span>
      <div className="tc-pitch-row__players">
        {players.map((player) => (
          <PlayerChip key={player.elementId} player={player} />
        ))}
      </div>
    </div>
  );
}

type PlayerChipProps = {
  player: LatestGwPlayerDTO;
  compact?: boolean;
};

function PlayerChip({ player, compact = false }: PlayerChipProps) {
  const badge = player.isCaptain ? "C" : player.isViceCaptain ? "V" : null;
  const multiplierLabel =
    player.multiplier > 1 ? `×${player.multiplier}` : null;

  const photoUrl = getPlayerPhotoUrl(player.photo);
  const shirtUrl = getTeamShirtUrl(player.teamCode);
  const imageUrl = photoUrl ?? shirtUrl;

  return (
    <div
      className={`tc-player-chip ${compact ? "tc-player-chip--compact" : ""}`}
      aria-label={`${player.name}, ${player.position}, ${player.points} points`}
    >
      {imageUrl && (
        <div className="tc-player-chip__image">
          <Image
            src={imageUrl}
            alt={player.name}
            width={40}
            height={40}
            className="rounded-md object-cover"
            unoptimized
          />
          {badge && (
            <span className="tc-player-chip__badge" aria-label={badge === "C" ? "Captain" : "Vice Captain"}>
              {badge}
            </span>
          )}
        </div>
      )}
      <div className="tc-player-chip__info">
        <p className="tc-player-chip__name">{player.name}</p>
        <p className="tc-player-chip__meta">
          {player.position}
          {!imageUrl && badge ? ` · ${badge}` : ""}
          {multiplierLabel ? ` · ${multiplierLabel}` : ""}
        </p>
      </div>
      <p className="tc-player-chip__points">{player.points}</p>
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
