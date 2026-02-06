"use client";

import { useState } from "react";
import Image from "next/image";
import type { TransferSuggestionDTO } from "@/lib/fpl/dto";
import { getPlayerPhotoUrl } from "@/lib/fpl/images";
import { Card, Typography, Badge, Button } from "./ui";
import { ArrowRightLeft, TrendingUp, Coins, Calendar, ArrowDownRight, ArrowUpRight } from "lucide-react";

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
    <section className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[color:var(--accent)] text-white shadow-lg shadow-[color:var(--accent)]/20">
                <ArrowRightLeft className="h-6 w-6" />
                </div>
                <div>
                    <Typography variant="title" weight="black">Transfer Market</Typography>
                    <Typography variant="caption">Top {suggestions.length} Strategic Moves</Typography>
                </div>
            </div>
            
            <Card className="px-6 py-3 flex items-center gap-3 border-[color:var(--accent)]/20 bg-[color:var(--accent)]/5" glass hover={false}>
                <Typography variant="caption" weight="black" className="text-[10px] opacity-40">TRANSFER BUDGET</Typography>
                <Typography variant="title" weight="black" className="text-2xl text-[color:var(--accent)]">£{budgetAvailable.toFixed(1)}m</Typography>
            </Card>
        </div>

      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
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
  const rankColors = ["from-yellow-500 to-yellow-600", "from-slate-300 to-slate-400", "from-orange-500 to-orange-600"];

  return (
    <Card className="relative overflow-hidden flex flex-col h-full border-white/5" glass>
      {/* Rank Indicator */}
      <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-[color:var(--accent)] to-transparent opacity-20" />
      
      <div className="p-8 space-y-8 flex-1 flex flex-col">
        <div className="flex justify-between items-center">
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg bg-gradient-to-br ${rankColors[rank-1] || rankColors[2]} text-black`}>
                Option #{rank}
            </div>
            <div className="flex items-center gap-2">
                <Typography variant="caption" weight="black" className="text-[10px] opacity-40">NET COST</Typography>
                <Typography weight="black" className={`text-sm ${suggestion.netCost > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {suggestion.netCost > 0 ? '-' : ''}£{Math.abs(suggestion.netCost).toFixed(1)}m
                </Typography>
            </div>
        </div>

        {/* The Trade */}
        <div className="space-y-6 flex-1">
            {/* Player OUT */}
            <div className="relative group">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-colors">
                    <div className="relative w-12 h-12 bg-slate-800 rounded-xl overflow-hidden shadow-inner shrink-0">
                        <Image src={getPlayerPhotoUrl(suggestion.playerOut.playerPhoto) || ''} alt="Out" fill className="object-contain" unoptimized />
                    </div>
                    <div className="min-w-0 flex-1">
                         <Typography variant="caption" weight="black" className="text-[8px] text-red-500 mb-1 flex items-center gap-1">
                            <ArrowDownRight className="w-2 h-2" /> SELL REASON
                         </Typography>
                         <Typography weight="black" className="text-sm uppercase truncate leading-none mb-1">{suggestion.playerOut.playerName}</Typography>
                         <Typography className="text-[10px] text-white/40 italic truncate">&quot;{suggestion.playerOut.reasoning}&quot;</Typography>
                    </div>
                    <div className="text-right">
                         <Typography weight="black" className="text-xs text-red-400">£{suggestion.playerOut.cost.toFixed(1)}m</Typography>
                    </div>
                </div>
                {/* Arrow Connector */}
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 z-20">
                     <div className="w-8 h-8 rounded-full bg-[color:var(--accent)] flex items-center justify-center border-4 border-[#0f172a] shadow-lg">
                        <ArrowRightLeft className="w-3 h-3 text-white" />
                     </div>
                </div>
            </div>

            {/* Player IN */}
            <div className="pt-2">
                <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-colors space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="relative w-14 h-14 bg-slate-800 rounded-xl overflow-hidden shadow-inner shrink-0">
                            <Image src={getPlayerPhotoUrl(suggestion.playerIn.playerPhoto) || ''} alt="In" fill className="object-contain" unoptimized />
                        </div>
                        <div className="min-w-0 flex-1">
                            <Typography variant="caption" weight="black" className="text-[8px] text-emerald-500 mb-1 flex items-center gap-1">
                                <ArrowUpRight className="w-2 h-2" /> SCOUT VERDICT
                            </Typography>
                            <Typography weight="black" className="text-lg uppercase truncate leading-none mb-1">{suggestion.playerIn.playerName}</Typography>
                            <Typography className="text-[10px] text-white/50">{suggestion.playerIn.team.shortName} • £{suggestion.playerIn.cost.toFixed(1)}m</Typography>
                        </div>
                        <div className="text-right">
                             <Typography variant="title" weight="black" className="text-emerald-500">{suggestion.playerIn.expectedPoints.toFixed(1)}</Typography>
                             <Typography variant="caption" className="text-[8px] opacity-40">EXP PTS</Typography>
                        </div>
                    </div>

                    {/* Next Fixtures */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                        {suggestion.playerIn.upcomingFixtures.map((f, i) => (
                            <div key={i} className={`p-2 rounded-lg text-center border ${getDiffBorder(f.difficulty)}`}>
                                <Typography weight="black" className="text-[9px] uppercase leading-none mb-1">{f.opponentShort}</Typography>
                                <Typography variant="caption" className="text-[8px] opacity-50">{f.isHome ? 'H' : 'A'}</Typography>
                            </div>
                        ))}
                    </div>

                    <Typography className="text-[10px] text-white/60 italic leading-relaxed pt-2 border-t border-white/5">
                        &quot;{suggestion.playerIn.reasoning}&quot;
                    </Typography>
                </div>
            </div>
        </div>
      </div>
    </Card>
  );
}

function getDiffBorder(diff: number) {
    if (diff <= 2) return "border-emerald-500/30 bg-emerald-500/5 text-emerald-400";
    if (diff === 3) return "border-white/10 bg-white/5 text-white/60";
    if (diff === 4) return "border-amber-500/30 bg-amber-500/5 text-amber-400";
    return "border-red-500/30 bg-red-500/5 text-red-400";
}
