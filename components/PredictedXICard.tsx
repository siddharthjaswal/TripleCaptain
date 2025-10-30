import Image from "next/image";
import type { PlayerPredictionDTO, PredictedXIDTO } from "@/lib/fpl/dto";
import { getPlayerPhotoUrl } from "@/lib/fpl/images";

type PredictedXICardProps = {
  predicted: PredictedXIDTO;
};

const POSITION_ORDER = ["GK", "DEF", "MID", "FWD"] as const;

export function PredictedXICard({ predicted }: PredictedXICardProps) {
  return (
    <section className="tc-card rounded-3xl p-6 shadow-lg">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Predicted Best XI 🎯</h2>
          <p className="tc-text-muted text-sm mt-1">
            Optimal formation: {predicted.formation}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="tc-text-muted">Total Predicted:</span>
          <span className="font-bold text-lg text-[color:var(--accent)]">
            {predicted.totalPredictedPoints.toFixed(1)} pts
          </span>
        </div>
      </header>

      {/* Pitch */}
      <div className="tc-pitch rounded-3xl border border-[color:var(--surface-border)] p-4">
        {POSITION_ORDER.map((position) => {
          let players: PlayerPredictionDTO[] = [];

          if (position === "GK") {
            players = [predicted.goalkeeper];
          } else if (position === "DEF") {
            players = predicted.defenders;
          } else if (position === "MID") {
            players = predicted.midfielders;
          } else if (position === "FWD") {
            players = predicted.forwards;
          }

          if (players.length === 0) {
            return null;
          }

          return (
            <PitchRow
              key={position}
              position={position}
              players={players}
              captainId={predicted.captain}
            />
          );
        })}
      </div>

      {/* Bench */}
      {predicted.bench.length > 0 && (
        <div className="mt-4">
          <p className="tc-text-muted text-xs font-semibold uppercase tracking-wide mb-2">
            Bench
          </p>
          <div className="flex flex-wrap gap-2">
            {predicted.bench.map((player) => (
              <PlayerChip
                key={player.playerId}
                player={player}
                isCaptain={false}
                compact
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

type PitchRowProps = {
  position: (typeof POSITION_ORDER)[number];
  players: PlayerPredictionDTO[];
  captainId: number;
};

function PitchRow({ position, players, captainId }: PitchRowProps) {
  return (
    <div className="tc-pitch-row">
      <span className="tc-pitch-row__label text-xs font-semibold uppercase tracking-wide">
        {labelPosition(position)}
      </span>
      <div className="tc-pitch-row__players">
        {players.map((player) => (
          <PlayerChip
            key={player.playerId}
            player={player}
            isCaptain={player.playerId === captainId}
          />
        ))}
      </div>
    </div>
  );
}

type PlayerChipProps = {
  player: PlayerPredictionDTO;
  isCaptain: boolean;
  compact?: boolean;
};

function PlayerChip({ player, isCaptain, compact = false }: PlayerChipProps) {
  const photoUrl = getPlayerPhotoUrl(player.playerPhoto);

  return (
    <div
      className={`tc-player-chip-vertical ${compact ? "tc-player-chip-vertical--compact" : ""}`}
      aria-label={`${player.playerName}, ${player.position}, ${player.expectedPoints} predicted points`}
    >
      <div className="tc-player-chip-vertical__image">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={player.playerName}
            width={compact ? 48 : 56}
            height={compact ? 48 : 56}
            className="rounded-lg object-cover"
            unoptimized
          />
        ) : (
          <div
            className="flex items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-800"
            style={{
              width: compact ? "48px" : "56px",
              height: compact ? "48px" : "56px",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`text-slate-400 ${compact ? "h-6 w-6" : "h-7 w-7"}`}
            >
              <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
            </svg>
          </div>
        )}
        {isCaptain && (
          <span
            className="tc-player-chip-vertical__badge"
            aria-label="Recommended Captain"
          >
            C
          </span>
        )}
      </div>
      <div className="tc-player-chip-vertical__info">
        <p className="tc-player-chip-vertical__name">{player.playerName}</p>
        <p className="tc-player-chip-vertical__position">{player.position}</p>
        {player.fixture && (
          <p className="text-xs tc-text-muted">
            {player.fixture.isHome ? "vs" : "@"} {player.fixture.opponentShort}
          </p>
        )}
      </div>
      <div className="tc-player-chip-vertical__points">
        {player.expectedPoints.toFixed(1)}
      </div>
    </div>
  );
}

function labelPosition(position: (typeof POSITION_ORDER)[number]): string {
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
