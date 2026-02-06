"use client";

import { useState } from "react";
import Image from "next/image";
import type { DifferentialPickDTO } from "@/lib/fpl/dto";
import { getPlayerPhotoUrl } from "@/lib/fpl/images";
import { Card, Typography } from "./ui";
import { Gem } from "lucide-react";

type DifferentialPicksCardProps = {
  differentials: DifferentialPickDTO[];
};

export function DifferentialPicksCard({
  differentials,
}: DifferentialPicksCardProps) {
  if (differentials.length === 0) {
    return (
      <Card className="p-12 text-center" glass>
        <Typography variant="title" weight="black" className="mb-2 uppercase">Hidden Gems Depleted</Typography>
        <Typography className="text-[color:var(--text-secondary)]">No affordable differential picks found for your budget.</Typography>
      </Card>
    );
  }

  return (
    <section className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-yellow-500 text-black shadow-lg shadow-yellow-500/20">
                <Gem className="h-6 w-6" />
            </div>
            <div>
                <Typography variant="title" weight="black">Differential Picks</Typography>
                <Typography variant="caption">Low ownership gems to climb the ranks</Typography>
            </div>
        </div>

      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
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

function DifferentialPickItem({ differential, rank }: { differential: DifferentialPickDTO; rank: number }) {
  const photoUrl = getPlayerPhotoUrl(differential.playerPhoto);
  const [, setImageError] = useState(false);
  const rankColors = ["bg-yellow-500 text-black", "bg-slate-300 text-black", "bg-orange-600 text-white"];

  return (
    <Card className="relative overflow-hidden flex flex-col h-full border-white/5" glass>
       <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Gem className="h-24 w-24" />
       </div>

       <div className="p-8 space-y-6 flex-1 flex flex-col">
            <div className="flex justify-between items-start">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xl shadow-lg ${rankColors[rank-1] || 'bg-white/10'}`}>
                    {rank}
                </div>
                <Card className="px-3 py-1 bg-white/5 border-white/10" hover={false}>
                     <Typography variant="caption" weight="black" className="text-[10px] text-[color:var(--accent)]">{differential.ownership.toFixed(1)}% OWNED</Typography>
                </Card>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 bg-slate-800 rounded-2xl overflow-hidden shadow-inner shrink-0">
                    <Image 
                        src={photoUrl || ''} 
                        alt={differential.playerName} 
                        fill 
                        className="object-contain" 
                        unoptimized 
                        onError={() => setImageError(true)} 
                    />
                </div>
                <div className="min-w-0">
                    <Typography weight="black" className="text-xl uppercase truncate leading-none mb-1">{differential.playerName}</Typography>
                    <Typography variant="caption" className="text-[10px] font-black opacity-40">{differential.team} • {differential.position}</Typography>
                    <Typography weight="black" className="text-sm text-[color:var(--accent)] mt-1">£{differential.cost.toFixed(1)}m</Typography>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3">
                <MetricBox label="EXP. PTS" value={differential.expectedPoints.toFixed(1)} />
                <MetricBox label="FORM" value={differential.form.toFixed(1)} />
                <MetricBox label="UPSIDE" value={differential.upsideScore.toFixed(1)} />
            </div>

            {/* Next Fixture Highlight */}
            {differential.fixture && (
                <div className={`p-4 rounded-2xl text-center border ${getDiffBorder(differential.fixture.difficulty)}`}>
                    <Typography variant="caption" weight="black" className="text-[9px] opacity-60 mb-1">UPCOMING BATTLE</Typography>
                    <Typography weight="black" className="text-sm uppercase">{differential.fixture.isHome ? 'HOME' : 'AWAY'} vs {differential.fixture.opponentShort}</Typography>
                </div>
            )}

            {/* Scouting Logic */}
            <div className="flex-1">
                <div className="p-4 rounded-xl bg-white/5 border-l-4 border-l-yellow-500">
                    <Typography className="text-xs italic leading-relaxed text-white/70">
                        &quot;{differential.reasoning}&quot;
                    </Typography>
                </div>
            </div>
       </div>
    </Card>
  );
}

function MetricBox({ label, value }: { label: string, value: string }) {
    return (
        <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5 shadow-inner">
            <Typography variant="caption" weight="black" className="text-[8px] opacity-40 mb-1">{label}</Typography>
            <Typography weight="black" className="text-sm">{value}</Typography>
        </div>
    )
}

function getDiffBorder(diff: number) {
    if (diff <= 2) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    if (diff === 3) return "border-white/10 bg-white/5 text-white/60";
    if (diff === 4) return "border-amber-500/30 bg-amber-500/10 text-amber-400";
    return "border-red-500/30 bg-red-500/10 text-red-400";
}
