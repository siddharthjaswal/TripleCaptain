"use client";

import { useState } from "react";
import Image from "next/image";
import type { DifferentialPickDTO } from "@/lib/fpl/dto";
import { getPlayerPhotoUrl, getTeamShirtUrl } from "@/lib/fpl/images";
import { Card, Typography, Badge } from "./ui";
import { Gem, TrendingUp } from "lucide-react";

type DifferentialPicksCardProps = {
  differentials: DifferentialPickDTO[];
};

export function DifferentialPicksCard({
  differentials,
}: DifferentialPicksCardProps) {
  if (differentials.length === 0) {
    return (
      <Card className="p-20 text-center" glass hover={false}>
        <Typography variant="title" weight="black" className="mb-2 uppercase text-white text-3xl">Hidden Gems Depleted</Typography>
        <Typography className="text-[color:var(--text-secondary)] text-lg">No affordable differential picks found for your budget.</Typography>
      </Card>
    );
  }

  return (
    <section className="space-y-10 animate-fade-in pb-20">
        <div className="flex items-center gap-4 px-4">
            <div className="p-3.5 rounded-2xl bg-yellow-500 text-black shadow-xl shadow-yellow-500/20">
                <Gem className="h-7 w-7" />
            </div>
            <div>
                <Typography variant="display" className="text-3xl md:text-5xl text-white">Differentials</Typography>
                <Typography variant="caption" weight="black" className="opacity-40 tracking-[0.3em] text-[10px]">SCOUTING THE HIDDEN TREASURES</Typography>
            </div>
        </div>

      <div className="grid gap-8">
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
  const [imgUrl, setImgUrl] = useState(photoUrl);
  const rankColors = ["bg-yellow-500 text-black", "bg-slate-300 text-black", "bg-orange-600 text-white"];

  return (
    <Card className="relative overflow-hidden border-white/10 bg-slate-950/40" glass hover={false}>
       <div className="absolute top-0 right-0 bottom-0 w-32 bg-white/5 flex items-center justify-center -z-10 overflow-hidden">
            <Gem className="h-40 w-40 opacity-5 rotate-[15deg]" />
       </div>

       <div className="flex flex-col md:flex-row">
            {/* Left: Scout Profile */}
            <div className="flex-1 p-8 flex flex-col md:flex-row items-center gap-8 border-b md:border-b-0 md:border-r border-white/5">
                <div className="relative group shrink-0">
                    <div className="relative w-24 h-24 bg-slate-900 rounded-full overflow-hidden border-4 border-yellow-500/40 group-hover:border-yellow-500 transition-all shadow-2xl">
                        <Image 
                            src={imgUrl || getTeamShirtUrl(differential.teamCode)!} 
                            alt={differential.playerName} 
                            fill 
                            className={`object-contain ${!imgUrl ? 'p-5 opacity-60' : ''}`} 
                            unoptimized 
                            onError={() => setImgUrl(null)} 
                        />
                        <div className="absolute inset-0 bg-yellow-500/5 mix-blend-overlay" />
                    </div>
                    <div className={`absolute -top-1 -right-1 w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shadow-2xl ${rankColors[rank-1] || 'bg-white/10'}`}>
                        {rank}
                    </div>
                </div>
                <div className="text-center md:text-left">
                    <Typography weight="black" className="text-3xl uppercase text-white leading-tight mb-2">{differential.playerName}</Typography>
                    <div className="flex items-center justify-center md:justify-start gap-3">
                        <Typography variant="caption" className="text-xs font-black text-yellow-500/60 uppercase tracking-[0.2em]">{differential.team} • {differential.position} • £{differential.cost.toFixed(1)}m</Typography>
                        {differential.reasoning.includes('DOUBLE') && (
                             <Badge variant="primary" className="bg-emerald-500 text-black text-[8px] font-black animate-glow">DOUBLE GW</Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Technical Breakdown */}
            <div className="flex-[1.5] p-8 space-y-8 bg-white/[0.01]">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <MetricBox label="OWNERSHIP" value={`${differential.ownership.toFixed(1)}%`} color="text-[color:var(--accent)]" />
                    <MetricBox label="EXPECTED" value={differential.expectedPoints.toFixed(1)} color="text-emerald-400" />
                    <MetricBox label="FORM" value={differential.form.toFixed(1)} color="text-white" />
                    <MetricBox label="UPSIDE" value={differential.upsideScore.toFixed(1)} color="text-yellow-500" />
                </div>

                {/* Fixture Timeline */}
                <div className="space-y-3">
                    <Typography variant="caption" weight="black" className="text-[9px] opacity-30 tracking-[0.3em] uppercase">Upcoming Campaign</Typography>
                    <div className="grid grid-cols-5 gap-2">
                        {differential.upcomingFixtures.map((f, i) => (
                            <div key={i} className={`p-2 rounded-xl border text-center transition-all hover:scale-105 ${getDiffBorder(f.difficulty)}`}>
                                <Typography weight="black" className="text-[9px] uppercase leading-none mb-1">{f.opponentShort}</Typography>
                                <Typography variant="caption" className="text-[8px] font-black opacity-60">{f.isHome ? 'H' : 'A'}</Typography>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <TrendingUp className="w-16 h-16 text-emerald-400" />
                    </div>
                    <Typography variant="caption" weight="black" className="text-[9px] text-emerald-400 mb-3 block uppercase tracking-[0.2em]">Scout Verdict</Typography>
                    <div className="flex items-start gap-4">
                        <div className="shrink-0 pt-1">
                            <div className="w-1 h-12 rounded-full bg-emerald-500/30" />
                        </div>
                        <Typography className="text-sm leading-relaxed text-white/80 italic">
                            &quot;{differential.reasoning}&quot;
                        </Typography>
                    </div>
                </div>
            </div>
       </div>
    </Card>
  );
}

function MetricBox({ label, value, color }: { label: string, value: string, color: string }) {
    return (
        <div className="space-y-1">
            <Typography variant="caption" weight="black" className="text-[9px] opacity-30 tracking-widest">{label}</Typography>
            <Typography weight="black" className={`text-2xl ${color}`}>{value}</Typography>
        </div>
    )
}

function getDiffBorder(diff: number) {
    if (diff <= 2) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    if (diff === 3) return "border-white/10 bg-white/5 text-white/60";
    if (diff === 4) return "border-amber-500/30 bg-amber-500/10 text-amber-400";
    return "border-red-500/30 bg-red-500/10 text-red-400";
}
