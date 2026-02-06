"use client";

import React from "react";
import Image from "next/image";
import type { TransferSuggestionDTO } from "@/lib/fpl/dto";
import { getPlayerPhotoUrl, getTeamShirtUrl } from "@/lib/fpl/images";
import { Card, Typography, Badge } from "./ui";
import { 
    ArrowRight, 
    TrendingUp, 
    Zap, 
    Target,
    BarChart2,
    ChevronRight,
    Plus
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
      <Card className="p-20 text-center" glass>
        <div className="p-5 w-20 h-20 rounded-3xl bg-emerald-500/10 text-emerald-500 mx-auto mb-8 flex items-center justify-center">
             <TrendingUp className="w-10 h-10" />
        </div>
        <Typography variant="title" weight="black" className="mb-2 uppercase text-white">Squad Optimized</Typography>
        <Typography className="text-[color:var(--text-secondary)] text-lg">No transfer suggestions required at this time.</Typography>
      </Card>
    );
  }

  return (
    <section className="space-y-10 animate-fade-in pb-20">
        <div className="flex items-center justify-between px-4">
            <div className="space-y-1">
                <Typography variant="display" className="text-3xl md:text-5xl text-white">Transfer Market</Typography>
                <Typography variant="caption" weight="black" className="opacity-40 tracking-[0.3em] text-[10px]">SCIENTIFIC RECRUITMENT ENGINE</Typography>
            </div>
            
            <Card className="px-8 py-4 border-white/5 bg-white/5" glass hover={false}>
                <Typography variant="caption" weight="black" className="text-[10px] opacity-40 uppercase tracking-widest mb-1">Bank Balance</Typography>
                <Typography variant="title" weight="black" className="text-3xl text-emerald-400">£{budgetAvailable.toFixed(1)}m</Typography>
            </Card>
        </div>

      <div className="grid gap-12 xl:grid-cols-3">
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
    setter(null); // Force fallback to shirt
  };

  const pointsGain = (suggestion.playerIn.expectedPoints - (suggestion.playerOut.expectedPoints || 0)).toFixed(1);

  return (
    <Card className="relative overflow-hidden flex flex-col h-full border-white/10 bg-slate-950/40" glass hover={false}>
      {/* High-Impact Top Bar */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${rank === 1 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30' : 'bg-white/10 text-white/60'}`}>
                    {rank}
                </div>
                <Typography weight="black" className="text-xs uppercase tracking-widest opacity-60">Recommendation</Typography>
            </div>
            <div className="text-right">
                <Typography variant="caption" weight="black" className="text-[9px] opacity-40 uppercase mb-1">Gain over 3 GWs</Typography>
                <div className="flex items-center gap-2 text-emerald-400">
                    <TrendingUp className="w-3 h-3" />
                    <Typography weight="black" className="text-lg">+{pointsGain} pts</Typography>
                </div>
            </div>
      </div>
      
      <div className="p-8 space-y-12 flex-1">
        {/* THE EXCHANGE: OUT -> IN */}
        <div className="flex items-center justify-between gap-4 relative">
             {/* Center Arrow */}
             <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                    <ArrowRight className="w-6 h-6 text-white/10" />
                </div>
             </div>

             {/* Player OUT */}
             <div className="flex flex-col items-center gap-4 flex-1 z-10">
                <div className="relative group">
                    <div className="relative w-20 h-20 bg-slate-900 rounded-full overflow-hidden border-2 border-red-500/20 group-hover:border-red-500/40 transition-colors shadow-2xl">
                         <Image 
                            src={imgOut || getTeamShirtUrl(suggestion.playerOut.teamId)!} 
                            alt="Out" 
                            fill 
                            className={`object-contain ${!imgOut ? 'p-3 opacity-50' : ''}`} 
                            unoptimized 
                            onError={() => handleImgError(setImgOut)} 
                        />
                        <div className="absolute inset-0 bg-red-500/10 mix-blend-overlay" />
                    </div>
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-lg">
                        <X className="w-3 h-3" />
                    </div>
                </div>
                <div className="text-center space-y-1">
                    <Typography weight="black" className="text-sm uppercase truncate w-28 text-white/80">{suggestion.playerOut.playerName}</Typography>
                    <Typography variant="caption" weight="black" className="text-[10px] text-white/30">£{suggestion.playerOut.cost.toFixed(1)}m</Typography>
                </div>
             </div>

             {/* Player IN */}
             <div className="flex flex-col items-center gap-4 flex-1 z-10">
                <div className="relative group">
                    <div className="relative w-24 h-24 bg-slate-900 rounded-full overflow-hidden border-4 border-emerald-500 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all">
                        <Image 
                            src={imgIn || getTeamShirtUrl(suggestion.playerIn.teamId)!} 
                            alt="In" 
                            fill 
                            className={`object-contain ${!imgIn ? 'p-4 opacity-70' : ''}`} 
                            unoptimized 
                            onError={() => handleImgError(setImgIn)} 
                        />
                        <div className="absolute inset-0 bg-emerald-500/5 mix-blend-overlay" />
                    </div>
                    <div className="absolute -top-1 -right-1 bg-emerald-500 text-black rounded-full p-1.5 shadow-lg">
                        <Plus className="w-4 h-4 font-black" />
                    </div>
                </div>
                <div className="text-center space-y-1">
                    <Typography weight="black" className="text-base uppercase text-white leading-none">{suggestion.playerIn.playerName}</Typography>
                    <Typography variant="caption" weight="black" className="text-[10px] text-emerald-500/60 uppercase">{suggestion.playerIn.team?.shortName || 'UNK'} • £{suggestion.playerIn.cost.toFixed(1)}m</Typography>
                </div>
             </div>
        </div>

        {/* METRICS & VERDICT */}
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                    <Typography variant="caption" weight="black" className="text-[8px] opacity-40 uppercase">Scout Score</Typography>
                    <div className="flex items-center gap-2">
                        <BarChart2 className="w-3 h-3 text-emerald-400" />
                        <Typography weight="black" className="text-xl text-white">{suggestion.playerIn.expectedPoints.toFixed(1)}</Typography>
                    </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                    <Typography variant="caption" weight="black" className="text-[8px] opacity-40 uppercase">Net Cost</Typography>
                    <div className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-blue-400" />
                        <Typography weight="black" className={`text-xl ${suggestion.netCost > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {suggestion.netCost > 0 ? '-' : ''}£{Math.abs(suggestion.netCost).toFixed(1)}m
                        </Typography>
                    </div>
                </div>
            </div>

            {/* Upcoming Fixtures */}
            <div className="space-y-3">
                 <div className="flex items-center justify-between px-1">
                    <Typography variant="caption" weight="black" className="text-[9px] opacity-40 uppercase tracking-widest">Upcoming Battleground</Typography>
                    <Badge variant="secondary" className="text-[8px] opacity-50 px-2 py-0">Next 3 GWs</Badge>
                 </div>
                 <div className="grid grid-cols-3 gap-3">
                    {suggestion.playerIn.upcomingFixtures.map((f, i) => (
                        <div key={i} className={`p-2.5 rounded-xl border transition-all text-center ${getDiffStyle(f.difficulty)}`}>
                            <Typography weight="black" className="text-[10px] uppercase leading-none mb-1">{f.opponentShort}</Typography>
                            <Typography variant="caption" className="text-[8px] font-bold opacity-60">{f.isHome ? 'HOME' : 'AWAY'}</Typography>
                        </div>
                    ))}
                 </div>
            </div>

            {/* Tactical Reasoning */}
            <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 relative group">
                <div className="absolute top-4 right-4 opacity-10">
                    <Target className="w-8 h-8 text-indigo-400" />
                </div>
                <Typography variant="caption" weight="black" className="text-[9px] text-indigo-400 mb-2 block uppercase tracking-widest">Gaffer&apos;s Strategic Rationale</Typography>
                <Typography className="text-sm leading-relaxed text-white/80 italic">
                    &quot;{suggestion.playerIn.reasoning}&quot;
                </Typography>
            </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-8 py-5 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
            <Typography variant="caption" weight="black" className="text-[9px] opacity-30">SUGGESTED RECRUITMENT</Typography>
            <div className="flex items-center gap-1 text-emerald-500">
                <Typography weight="black" className="text-[10px] uppercase tracking-tighter">View Tactics</Typography>
                <ChevronRight className="w-3 h-3" />
            </div>
      </div>
    </Card>
  );
}

const X = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
)

function getDiffStyle(diff: number) {
    if (diff <= 2) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    if (diff === 3) return "border-white/10 bg-white/5 text-white/50";
    if (diff === 4) return "border-amber-500/30 bg-amber-500/10 text-amber-400";
    return "border-red-500/30 bg-red-500/10 text-red-400";
}
