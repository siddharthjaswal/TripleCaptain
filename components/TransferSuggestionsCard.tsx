"use client";

import React from "react";
import Image from "next/image";
import type { TransferSuggestionDTO } from "@/lib/fpl/dto";
import { getPlayerPhotoUrl, getTeamShirtUrl } from "@/lib/fpl/images";
import { Card, Typography, Badge } from "./ui";
import { 
    TrendingUp, 
    Target, 
    ArrowRight
} from "lucide-react";

type TransferSuggestionsCardProps = {
  suggestions: TransferSuggestionDTO[];
  budgetAvailable: number;
};

export function TransferSuggestionsCard({
  suggestions,
  budgetAvailable,
}: TransferSuggestionsCardProps) {
  if (suggestions.length === 0) {
    return (
      <Card className="p-20 text-center" glass hover={false}>
        <div className="p-5 w-20 h-20 rounded-3xl bg-emerald-500/10 text-emerald-500 mx-auto mb-8 flex items-center justify-center">
             <TrendingUp className="w-10 h-10" />
        </div>
        <Typography variant="title" weight="black" className="mb-2 uppercase text-white text-3xl">Squad Optimized</Typography>
        <Typography className="text-[color:var(--text-secondary)] text-lg">No transfer suggestions required at this time.</Typography>
      </Card>
    );
  }

  return (
    <section className="space-y-10 animate-fade-in pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-4">
            <div className="space-y-1">
                <Typography variant="display" className="text-3xl md:text-5xl text-white">Recruitment</Typography>
                <Typography variant="caption" weight="black" className="opacity-40 tracking-[0.3em] text-[10px]">SCIENTIFIC TRANSFER STRATEGY</Typography>
            </div>
            
            <Card className="px-8 py-4 border-white/5 bg-white/5" glass hover={false}>
                <Typography variant="caption" weight="black" className="text-[10px] opacity-40 uppercase tracking-widest mb-1">Available Funds</Typography>
                <Typography variant="title" weight="black" className="text-3xl text-emerald-400">£{budgetAvailable.toFixed(1)}m</Typography>
            </Card>
        </div>

      <div className="grid gap-8">
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

function TransferSuggestionItem({ suggestion, rank }: { suggestion: TransferSuggestionDTO; rank: number }) {
  const photoOut = getPlayerPhotoUrl(suggestion.playerOut.playerPhoto);
  const photoIn = getPlayerPhotoUrl(suggestion.playerIn.playerPhoto);
  
  const [imgOut, setImgOut] = React.useState(photoOut);
  const [imgIn, setImgIn] = React.useState(photoIn);
  
  const handleImgError = (setter: (val: string | null) => void) => {
    setter(null);
  };

  const pointsGain = (suggestion.playerIn.expectedPoints - (suggestion.playerOut.expectedPoints || 0)).toFixed(1);

  return (
    <Card className="relative overflow-hidden border-white/10 bg-slate-950/40" glass hover={false}>
      {/* Visual Rank Background */}
      <div className="absolute top-0 left-0 bottom-0 w-24 bg-white/5 flex items-center justify-center -z-10">
         <Typography variant="display" className="text-6xl opacity-10 rotate-[-90deg] pointer-events-none">#{rank}</Typography>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Left: The Players Trade */}
        <div className="flex-1 p-8 flex flex-col md:flex-row items-center gap-8 border-b md:border-b-0 md:border-r border-white/5">
            {/* Player OUT */}
            <div className="flex flex-col items-center gap-3 w-full md:w-40 shrink-0">
                <div className="relative group">
                    <div className="relative w-20 h-20 bg-slate-900 rounded-full overflow-hidden border-2 border-red-500/30 group-hover:border-red-500/50 transition-all shadow-xl">
                         <Image 
                            src={imgOut || getTeamShirtUrl(suggestion.playerOut.teamCode)!} 
                            alt="Out" 
                            fill 
                            className={`object-contain ${!imgOut ? 'p-3 opacity-40' : ''}`} 
                            unoptimized 
                            onError={() => handleImgError(setImgOut)} 
                        />
                        <div className="absolute inset-0 bg-red-500/5 mix-blend-overlay" />
                    </div>
                    <Badge className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[8px] font-black border-2 border-slate-950">OUT</Badge>
                </div>
                <div className="text-center">
                    <Typography weight="black" className="text-sm uppercase text-white/90 leading-tight">{suggestion.playerOut.playerName}</Typography>
                    <Typography variant="caption" className="text-[9px] opacity-40">£{suggestion.playerOut.cost.toFixed(1)}m</Typography>
                </div>
            </div>

            {/* The Arrow */}
            <div className="flex flex-col items-center justify-center">
                 <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                    <ArrowRight className="w-5 h-5 text-white/40" />
                 </div>
                 <div className={`mt-2 px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[9px] font-black ${suggestion.netCost > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {suggestion.netCost > 0 ? '-' : '+'}£{Math.abs(suggestion.netCost).toFixed(1)}m
                 </div>
            </div>

            {/* Player IN */}
            <div className="flex flex-col items-center gap-3 w-full md:w-40 shrink-0">
                <div className="relative group">
                    <div className="relative w-28 h-28 bg-slate-900 rounded-full overflow-hidden border-4 border-emerald-500/40 group-hover:border-emerald-500 group-hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all shadow-2xl">
                        <Image 
                            src={imgIn || getTeamShirtUrl(suggestion.playerIn.teamCode)!} 
                            alt="In" 
                            fill 
                            className={`object-contain ${!imgIn ? 'p-5 opacity-60' : ''}`} 
                            unoptimized 
                            onError={() => handleImgError(setImgIn)} 
                        />
                        <div className="absolute inset-0 bg-emerald-500/5 mix-blend-overlay" />
                    </div>
                    <Badge className="absolute -bottom-1 -right-1 bg-emerald-500 text-black text-[9px] font-black border-2 border-slate-950">SIGNING</Badge>
                </div>
                <div className="text-center">
                    <Typography weight="black" className="text-base uppercase text-white leading-tight">{suggestion.playerIn.playerName}</Typography>
                    <div className="flex items-center justify-center gap-2">
                        <Typography variant="caption" className="text-[10px] text-emerald-500/60 font-black tracking-widest">{suggestion.playerIn.team.shortName} • £{suggestion.playerIn.cost.toFixed(1)}m</Typography>
                        {suggestion.playerIn.reasoning.includes('DOUBLE') && (
                            <div className="bg-emerald-500 text-black text-[7px] font-black px-1 rounded animate-pulse">DGW</div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Right: Metrics & Analysis */}
        <div className="flex-[1.5] p-8 space-y-8 bg-white/[0.01]">
            <div className="grid grid-cols-3 gap-6">
                <div className="space-y-1">
                    <Typography variant="caption" weight="black" className="text-[9px] opacity-30 tracking-widest uppercase">Expected Gain</Typography>
                    <div className="flex items-baseline gap-1 text-emerald-400">
                        <Typography weight="black" className="text-3xl">+{pointsGain}</Typography>
                        <Typography weight="black" className="text-[10px] opacity-60">OVER 5GWs</Typography>
                    </div>
                </div>
                <div className="space-y-1">
                    <Typography variant="caption" weight="black" className="text-[9px] opacity-30 tracking-widest">PLAYER XP</Typography>
                    <div className="flex items-baseline gap-1 text-white">
                        <Typography weight="black" className="text-3xl">{suggestion.playerIn.expectedPoints.toFixed(1)}</Typography>
                        <Typography weight="black" className="text-[10px] opacity-40">NEXT</Typography>
                    </div>
                </div>
                <div className="space-y-1">
                    <Typography variant="caption" weight="black" className="text-[9px] opacity-30 tracking-widest uppercase">Upcoming Run</Typography>
                    <div className="flex gap-1.5 pt-1">
                        {suggestion.playerIn.upcomingFixtures.map((f, i) => (
                            <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border transition-colors hover:scale-110 ${getDiffStyle(f.difficulty)}`}>
                                {f.difficulty}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Target className="w-16 h-16 text-indigo-400" />
                </div>
                <Typography variant="caption" weight="black" className="text-[9px] text-indigo-400 mb-3 block uppercase tracking-[0.2em]">The Gaffer&apos;s Strategic Rationale</Typography>
                <div className="flex items-start gap-4">
                    <div className="shrink-0 pt-1">
                         <div className="w-1 h-12 rounded-full bg-indigo-500/30" />
                    </div>
                    <Typography className="text-sm leading-relaxed text-white/80 italic">
                        &quot;{suggestion.playerIn.reasoning}&quot;
                    </Typography>
                </div>
            </div>
        </div>
      </div>
    </Card>
  );
}

function getDiffStyle(diff: number) {
    if (diff <= 2) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]";
    if (diff === 3) return "border-white/10 bg-white/5 text-white/50";
    if (diff === 4) return "border-amber-500/30 bg-amber-500/10 text-amber-400";
    return "border-red-500/30 bg-red-500/10 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]";
}
