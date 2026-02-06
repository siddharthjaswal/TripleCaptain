"use client";

import React from "react";
import Image from "next/image";
import type { TransferSuggestionDTO } from "@/lib/fpl/dto";
import { getPlayerPhotoUrl } from "@/lib/fpl/images";
import { Card, Typography, Badge } from "./ui";
import { 
    ArrowRightLeft, 
    TrendingUp, 
    ArrowDownRight, 
    ArrowUpRight, 
    ShieldAlert, 
    Search,
    ChevronDown,
    ChevronUp
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
        <Typography variant="title" weight="black" className="mb-2 uppercase text-3xl text-white">Squad Optimized</Typography>
        <Typography className="text-[color:var(--text-secondary)] text-lg">Your crew is in peak condition for the coming matches.</Typography>
      </Card>
    );
  }

  return (
    <section className="space-y-12 animate-fade-in pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-2">
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-[color:var(--accent)] text-white shadow-2xl shadow-[color:var(--accent)]/30">
                        <ArrowRightLeft className="h-8 w-8" />
                    </div>
                    <div>
                        <Typography variant="display" className="text-4xl leading-none mb-2">Transfer Market</Typography>
                        <Typography variant="caption" weight="black" className="opacity-40 tracking-[0.3em] text-xs">TACTICAL RECRUITMENT HUB</Typography>
                    </div>
                </div>
            </div>
            
            <Card className="px-10 py-5 flex items-center gap-6 border-[color:var(--accent)]/20 bg-white/5 relative overflow-hidden" glass hover={false}>
                <div className="absolute top-0 right-0 p-2 opacity-5">
                    <TrendingUp className="w-12 h-12" />
                </div>
                <div>
                    <Typography variant="caption" weight="black" className="text-[11px] opacity-40 uppercase tracking-widest mb-1">Total Budget</Typography>
                    <Typography variant="title" weight="black" className="text-4xl text-[color:var(--brand-secondary)]">£{budgetAvailable.toFixed(1)}m</Typography>
                </div>
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
  
  const handleImgError = (url: string | null, setter: (val: string | null) => void) => {
    if (!url) return;
    if (url.includes('250x250')) {
        setter(url.replace('250x250', '110x140'));
        return;
    }
    setter(null);
  };

  return (
    <div className="flex flex-col h-full group relative">
        {/* Connection Link (Visual only) */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-y-1/2 -z-10" />

        <Card className="relative overflow-hidden flex flex-col h-full border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] transition-all duration-500 group-hover:border-[color:var(--accent)]/30 group-hover:-translate-y-2" glass hover={false}>
            {/* Net Cost Floating Header */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${suggestion.netCost > 0 ? 'from-red-500/50 to-red-600' : 'from-emerald-500/50 to-emerald-600'} opacity-80`} />
            
            <div className="p-8 space-y-10 flex-1 flex flex-col">
                {/* Header: Option & Cost */}
                <div className="flex justify-between items-center">
                    <Badge variant="primary" className="px-5 py-1.5 font-black italic tracking-widest shadow-xl">#{rank}</Badge>
                    <div className="flex items-center gap-3">
                        <Typography variant="caption" weight="black" className="text-[10px] opacity-30">NET COST</Typography>
                        <div className={`px-3 py-1 rounded-lg border font-black text-sm ${suggestion.netCost > 0 ? 'border-red-500/30 text-red-400 bg-red-500/5' : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'}`}>
                            {suggestion.netCost > 0 ? '-' : '+'}£{Math.abs(suggestion.netCost).toFixed(1)}m
                        </div>
                    </div>
                </div>

                <div className="space-y-12">
                    {/* --- PLAYER OUT SECTION --- */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 px-2">
                             <ArrowDownRight className="w-4 h-4 text-red-500 animate-bounce" />
                             <Typography variant="caption" weight="black" className="text-red-500 tracking-[0.2em]">THROW OVERBOARD</Typography>
                        </div>
                        
                        <div className="p-6 rounded-3xl bg-red-500/[0.03] border border-red-500/10 flex items-center gap-6">
                            <div className="relative w-20 h-20 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-white/5">
                                {imgOut ? (
                                    <Image src={imgOut} alt="Out" fill className="object-contain" unoptimized onError={() => handleImgError(imgOut, setImgOut)} />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full text-red-500/20"><ShieldAlert className="w-8 h-8" /></div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <Typography weight="black" className="text-xl uppercase truncate text-white mb-1">{suggestion.playerOut.playerName}</Typography>
                                <Typography variant="caption" className="text-[10px] font-bold text-white/30 uppercase mb-3">{suggestion.playerOut.position} • £{suggestion.playerOut.cost.toFixed(1)}m</Typography>
                                <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                                    <Typography className="text-[10px] text-red-400/80 italic leading-relaxed">&quot;{suggestion.playerOut.reasoning}&quot;</Typography>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- CENTRAL TRANSITION --- */}
                    <div className="flex justify-center -my-8 relative z-20">
                         <div className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] rotate-45 group-hover:rotate-[135deg] transition-all duration-700">
                            <ArrowRightLeft className="w-6 h-6 -rotate-45" />
                         </div>
                    </div>

                    {/* --- PLAYER IN SECTION --- */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 px-2">
                             <ArrowUpRight className="w-4 h-4 text-emerald-500 animate-pulse" />
                             <Typography variant="caption" weight="black" className="text-emerald-500 tracking-[0.2em]">NEW SIGNING</Typography>
                        </div>
                        
                        <div className="p-8 rounded-[2rem] bg-emerald-500/[0.04] border border-emerald-500/20 space-y-8 relative group-hover:bg-emerald-500/[0.08] transition-colors">
                            <div className="flex items-start gap-6">
                                <div className="relative w-24 h-24 bg-slate-900 rounded-3xl overflow-hidden shadow-2xl shrink-0 border border-emerald-500/30">
                                    {imgIn ? (
                                        <Image src={imgIn} alt="In" fill className="object-contain" unoptimized onError={() => handleImgError(imgIn, setImgIn)} />
                                    ) : (
                                        <div className="flex items-center justify-center w-full h-full text-emerald-500/20"><Search className="w-10 h-10" /></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 space-y-4 pt-1">
                                    <div className="min-w-0">
                                        <Typography weight="black" className="text-2xl uppercase leading-[0.9] text-white break-words mb-2">{suggestion.playerIn.playerName}</Typography>
                                        <Typography variant="caption" className="text-xs font-black text-emerald-500/60 uppercase tracking-widest">{suggestion.playerIn.team?.shortName || 'UNK'} • £{suggestion.playerIn.cost.toFixed(1)}m</Typography>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                                            <Typography weight="black" className="text-2xl text-emerald-400 leading-none">{suggestion.playerIn.expectedPoints.toFixed(1)}</Typography>
                                            <Typography variant="caption" className="text-[8px] font-black opacity-40 uppercase tracking-tighter">Exp Pts</Typography>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Fixtures */}
                            <div className="space-y-3">
                                <Typography variant="caption" weight="black" className="text-[9px] opacity-30 tracking-[0.3em]">UPCOMING FIXTURES</Typography>
                                <div className="grid grid-cols-3 gap-3">
                                    {suggestion.playerIn.upcomingFixtures.map((f, i) => (
                                        <div key={i} className={`p-3 rounded-2xl border transition-all hover:scale-105 text-center shadow-lg ${getDiffStyle(f.difficulty)}`}>
                                            <Typography weight="black" className="text-xs mb-1 uppercase tracking-tighter">{f.opponentShort}</Typography>
                                            <Typography variant="caption" className="text-[9px] font-bold opacity-60 uppercase">{f.isHome ? 'Home' : 'Away'}</Typography>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Final Scout Verdict */}
                            <div className="p-5 rounded-2xl bg-white/5 border border-white/5 shadow-inner">
                                <div className="flex items-center gap-2 mb-2">
                                    <Search className="w-3 h-3 text-emerald-500" />
                                    <Typography variant="caption" weight="black" className="text-[9px] opacity-40 uppercase tracking-widest">Chief Scout Verdict</Typography>
                                </div>
                                <Typography className="text-xs text-white/80 italic leading-relaxed">
                                    &quot;{suggestion.playerIn.reasoning}&quot;
                                </Typography>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    </div>
  );
}

function getDiffStyle(diff: number) {
    if (diff <= 2) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-emerald-500/10";
    if (diff === 3) return "border-white/10 bg-white/5 text-white/60 shadow-white/5";
    if (diff === 4) return "border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-amber-500/10";
    return "border-red-500/30 bg-red-500/10 text-red-400 shadow-red-500/10";
}
