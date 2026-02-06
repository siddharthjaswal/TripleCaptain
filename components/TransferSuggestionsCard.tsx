"use client";

import React from "react";
import Image from "next/image";
import type { TransferSuggestionDTO } from "@/lib/fpl/dto";
import { getPlayerPhotoUrl } from "@/lib/fpl/images";
import { Card, Typography } from "./ui";
import { ArrowRightLeft, TrendingUp, ArrowDownRight, ArrowUpRight } from "lucide-react";

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
      <Card className="p-12 text-center" glass>
        <div className="p-3 w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto mb-6 flex items-center justify-center">
             <TrendingUp className="w-8 h-8" />
        </div>
        <Typography variant="title" weight="black" className="mb-2 uppercase">Squad Optimized</Typography>
        <Typography className="text-[color:var(--text-secondary)]">No urgent transfers suggested by the tactical engine.</Typography>
      </Card>
    );
  }

  return (
    <section className="space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-[color:var(--accent)] text-white shadow-xl shadow-[color:var(--accent)]/20">
                    <ArrowRightLeft className="h-7 w-7" />
                </div>
                <div>
                    <Typography variant="title" weight="black" className="uppercase tracking-tight text-3xl">Transfer Market</Typography>
                    <Typography variant="caption" weight="black" className="opacity-40 text-[11px] tracking-[0.2em]">TOP 3 STRATEGIC MOVES</Typography>
                </div>
            </div>
            
            <Card className="px-8 py-4 flex items-center gap-4 border-[color:var(--accent)]/30 bg-white/5" glass hover={false}>
                <Typography variant="caption" weight="black" className="text-[11px] opacity-40 uppercase tracking-widest">Available Budget</Typography>
                <Typography variant="title" weight="black" className="text-3xl text-[color:var(--brand-secondary)]">£{budgetAvailable.toFixed(1)}m</Typography>
            </Card>
        </div>

      <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-3">
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
  const rankColors = ["from-yellow-400 to-amber-600", "from-slate-300 to-slate-500", "from-orange-400 to-orange-600"];

  return (
    <Card className="relative overflow-hidden flex flex-col h-full border-white/5 shadow-2xl transition-all duration-500 hover:scale-[1.02]" glass>
      {/* Rank Indicator */}
      <div className={`absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b ${rank === 1 ? 'from-yellow-500' : 'from-[color:var(--accent)]'} to-transparent opacity-30`} />
      
      <div className="p-8 space-y-10 flex-1 flex flex-col">
        <div className="flex justify-between items-center">
            <div className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-xl bg-gradient-to-br ${rankColors[rank-1] || rankColors[2]} text-black`}>
                Option #{rank}
            </div>
            <div className="flex flex-col items-end">
                <Typography variant="caption" weight="black" className="text-[9px] opacity-40 uppercase tracking-widest mb-1">Net Cost</Typography>
                <Typography weight="black" className={`text-lg leading-none ${suggestion.netCost > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {suggestion.netCost > 0 ? '-' : ''}£{Math.abs(suggestion.netCost).toFixed(1)}m
                </Typography>
            </div>
        </div>

        {/* The Trade */}
        <div className="space-y-8 flex-1 flex flex-col justify-center">
            {/* Player OUT */}
            <div className="relative">
                <div className="flex items-center gap-5 p-5 rounded-3xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all duration-300">
                    <div className="relative w-16 h-16 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-white/5">
                        <Image src={getPlayerPhotoUrl(suggestion.playerOut.playerPhoto) || ''} alt="Out" fill className="object-contain" unoptimized />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                         <div className="flex items-center gap-1.5">
                            <ArrowDownRight className="w-3 h-3 text-red-500" />
                            <Typography variant="caption" weight="black" className="text-[9px] text-red-500 tracking-widest uppercase">Sell Analysis</Typography>
                         </div>
                         <Typography weight="black" className="text-base uppercase truncate leading-none text-white">{suggestion.playerOut.playerName}</Typography>
                         <Typography className="text-[11px] text-white/40 italic leading-snug line-clamp-2">&quot;{suggestion.playerOut.reasoning}&quot;</Typography>
                    </div>
                    <div className="text-right">
                         <Typography weight="black" className="text-sm text-red-400 font-mono">£{suggestion.playerOut.cost.toFixed(1)}m</Typography>
                    </div>
                </div>
                {/* Arrow Connector */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-20">
                     <div className="w-12 h-12 rounded-full bg-[color:var(--accent)] flex items-center justify-center border-[6px] border-[#0a0f1e] shadow-2xl scale-110">
                        <ArrowRightLeft className="w-4 h-4 text-white" />
                     </div>
                </div>
            </div>

            {/* Player IN */}
            <div className="pt-2">
                <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-all duration-300 space-y-6">
                    <div className="flex items-center gap-5">
                        <div className="relative w-20 h-20 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-emerald-500/20">
                            <Image src={getPlayerPhotoUrl(suggestion.playerIn.playerPhoto) || ''} alt="In" fill className="object-contain" unoptimized />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex items-center gap-1.5">
                                <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                                <Typography variant="caption" weight="black" className="text-[9px] text-emerald-500 tracking-widest uppercase">Chief Scout Verdict</Typography>
                            </div>
                            <Typography weight="black" className="text-xl uppercase truncate leading-none text-white">{suggestion.playerIn.playerName}</Typography>
                            <Typography className="text-[11px] text-white/50 font-bold">{suggestion.playerIn.team?.shortName || 'UNK'} • £{suggestion.playerIn.cost.toFixed(1)}m</Typography>
                        </div>
                        <div className="text-right">
                             <Typography variant="title" weight="black" className="text-3xl text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">{suggestion.playerIn.expectedPoints.toFixed(1)}</Typography>
                             <Typography variant="caption" weight="black" className="text-[9px] opacity-40">EXP PTS</Typography>
                        </div>
                    </div>

                    {/* Next Fixtures */}
                    <div className="grid grid-cols-3 gap-3 pt-2">
                        {suggestion.playerIn.upcomingFixtures.map((f, i) => (
                            <div key={i} className={`p-2.5 rounded-xl border-2 transition-transform hover:scale-105 text-center ${getDiffBorder(f.difficulty)}`}>
                                <Typography weight="black" className="text-[10px] uppercase leading-none mb-1">{f.opponentShort}</Typography>
                                <Typography variant="caption" weight="black" className="text-[8px] opacity-60 font-bold">{f.isHome ? 'HOME' : 'AWAY'}</Typography>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border-l-4 border-l-emerald-500">
                        <Typography className="text-xs text-white/70 italic leading-relaxed">
                            &quot;{suggestion.playerIn.reasoning}&quot;
                        </Typography>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </Card>
  );
}

function getDiffBorder(diff: number) {
    if (diff <= 2) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/10";
    if (diff === 3) return "border-white/10 bg-white/5 text-white/60";
    if (diff === 4) return "border-amber-500/30 bg-amber-500/10 text-amber-400";
    return "border-red-500/30 bg-red-500/10 text-red-400 shadow-lg shadow-red-500/10";
}
