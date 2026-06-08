"use client";

import { useState } from "react";
import Image from "next/image";
import type { PlayerPredictionDTO, PredictedXIDTO } from "@/lib/fpl/dto";
import { getPlayerPhotoUrl } from "@/lib/fpl/images";
import { Card, Typography } from "./ui";
import { Target, Zap } from "lucide-react";

type PredictedXICardProps = {
  predicted: PredictedXIDTO;
};

const POSITION_ORDER = ["GK", "DEF", "MID", "FWD"] as const;

export function PredictedXICard({ predicted }: PredictedXICardProps) {
  return (
    <section className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-cyan-500 text-black shadow-lg shadow-cyan-500/20">
                <Target className="h-6 w-6" />
                </div>
                <div>
                    <Typography variant="title" weight="black">Predicted Best XI</Typography>
                    <Typography variant="caption">Optimal formation: {predicted.formation}</Typography>
                </div>
            </div>
            
            <Card className="px-6 py-3 flex items-center gap-3 border-cyan-500/20 bg-cyan-500/5" glass hover={false}>
                <Typography variant="caption" weight="black" className="text-[10px] opacity-40">TOTAL EXPECTED</Typography>
                <Typography variant="title" weight="black" className="text-2xl text-cyan-500">{predicted.totalPredictedPoints.toFixed(1)}</Typography>
                <Typography variant="caption" weight="black" className="text-cyan-500/60">PTS</Typography>
            </Card>
        </div>

      {/* Pitch */}
      <div className="tc-pitch border-4 border-white/10 rounded-[3rem] p-8 shadow-2xl relative">
        <div className="absolute inset-0 bg-black/10 z-0" />
        <div className="tc-pitch-bottom-box" />
        
        <div className="space-y-12 relative z-10">
            {POSITION_ORDER.map((position) => {
                let players: PlayerPredictionDTO[] = [];
                if (position === "GK") players = [predicted.goalkeeper];
                else if (position === "DEF") players = predicted.defenders;
                else if (position === "MID") players = predicted.midfielders;
                else if (position === "FWD") players = predicted.forwards;

                if (players.length === 0) return null;

                return (
                    <div key={position} className="tc-pitch-row">
                        <Typography variant="caption" weight="black" className="text-center opacity-30 tracking-[0.5em] text-[10px]">{labelPosition(position)}</Typography>
                        <div className="tc-pitch-row__players">
                            {players.map((player) => (
                                <PredictorPlayerChip
                                    key={player.playerId}
                                    player={player}
                                    isCaptain={player.playerId === predicted.captain}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Predicted Bench */}
      {predicted.bench.length > 0 && (
        <Card className="p-6" glass hover={false}>
            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                <Typography variant="caption" weight="black" className="opacity-50 uppercase tracking-widest text-[10px]">Strategic Substitutes</Typography>
            </div>
            <div className="flex justify-around items-start">
                {predicted.bench.map((player) => (
                    <PredictorPlayerChip
                        key={player.playerId}
                        player={player}
                        isCaptain={false}
                        compact
                    />
                ))}
            </div>
        </Card>
      )}
    </section>
  );
}

function PredictorPlayerChip({ player, isCaptain, compact = false }: { player: PlayerPredictionDTO; isCaptain: boolean; compact?: boolean }) {
  const photoUrl = getPlayerPhotoUrl(player.playerPhoto);
  const [imgUrl, setImgUrl] = useState(photoUrl);
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    if (!imgUrl) return;
    if (imgUrl.includes('250x250')) {
      setImgUrl(imgUrl.replace('250x250', '110x140'));
      return;
    }
    setImageError(true);
  };

  const showFallback = !imgUrl || imageError;

  return (
    <div className={`tc-player-chip-vertical ${compact ? "tc-player-chip-vertical--compact" : ""}`}>
      <div className="tc-player-chip-vertical__image">
        {!showFallback ? (
          <Image
            src={imgUrl!}
            alt={player.playerName}
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
                <Zap className="h-8 w-8 text-white/20" />
            </div>
        )}
        {isCaptain && (
          <span className="tc-player-chip-vertical__badge">C</span>
        )}
      </div>
      <div className="tc-player-chip-vertical__info">
        <p className="tc-player-chip-vertical__name">{player.playerName}</p>
        <div className="tc-player-chip-vertical__position">
          <span>{player.position}</span>
          {player.fixture && (
            <span className="opacity-50">vs {player.fixture.opponentShort}</span>
          )}
        </div>
        <div className="tc-player-chip-vertical__points text-cyan-400">
            {player.expectedPoints.toFixed(1)}
        </div>
      </div>
    </div>
  );
}

function labelPosition(position: string): string {
  switch (position) {
    case "GK": return "Goalkeeper";
    case "DEF": return "Defence";
    case "MID": return "Midfield";
    case "FWD": return "Forwards";
    default: return position;
  }
}
