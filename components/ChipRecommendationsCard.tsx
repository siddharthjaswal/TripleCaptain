"use client";

import React from "react";
import type { ChipRecommendationDTO } from "@/lib/fpl/dto";
import { Card, Typography, Badge } from "./ui";
import { 
    Zap, 
    Trophy, 
    Rocket, 
    Target, 
    Clock,
    Sparkles,
    TrendingUp
} from "lucide-react";

type ChipRecommendationsCardProps = {
  recommendations: ChipRecommendationDTO[];
};

export function ChipRecommendationsCard({
  recommendations,
}: ChipRecommendationsCardProps) {
  if (recommendations.length === 0) {
    return (
      <Card className="p-20 text-center" glass>
        <div className="p-5 w-20 h-20 rounded-3xl bg-[color:var(--accent)]/10 text-[color:var(--accent)] mx-auto mb-8 flex items-center justify-center">
             <Trophy className="w-10 h-10" />
        </div>
        <Typography variant="title" weight="black" className="mb-3 uppercase text-3xl">All Chips Deployed</Typography>
        <Typography className="text-[color:var(--text-secondary)] text-lg">Every tactical chip has been spent. Your season strategy is complete!</Typography>
      </Card>
    );
  }

  return (
    <section className="space-y-8 animate-fade-in">
        <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-indigo-500 text-white shadow-xl shadow-indigo-500/20">
                <Rocket className="h-7 w-7" />
            </div>
            <div>
                <Typography variant="title" weight="black" className="uppercase tracking-tight text-3xl">Chip Strategy</Typography>
                <Typography variant="caption" weight="black" className="opacity-40 text-[11px] tracking-[0.2em]">TACTICAL DEPLOYMENT TIMING</Typography>
            </div>
        </div>

      <div className="grid gap-8 md:grid-cols-2">
        {recommendations.map((rec) => (
          <ChipRecommendationItem
            key={rec.chipName}
            recommendation={rec}
          />
        ))}
      </div>
    </section>
  );
}

function ChipRecommendationItem({
  recommendation,
}: {
  recommendation: ChipRecommendationDTO;
}) {
  const chipIcons: Record<string, React.ReactNode> = {
    "Triple Captain": <Sparkles className="w-6 h-6" />,
    "Bench Boost": <Zap className="w-6 h-6" />,
    "Free Hit": <Target className="w-6 h-6" />,
    "Wildcard": <ActivityIcon />,
  };

  const isRecommended = recommendation.recommend;

  return (
    <Card 
        className={`relative overflow-hidden flex flex-col h-full border-white/5 transition-all duration-500 hover:scale-[1.01] ${isRecommended ? 'ring-2 ring-emerald-500/30' : ''}`} 
        glass
    >
      {/* Visual Accent */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${isRecommended ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-white/5'}`} />
      
      <div className="p-10 space-y-8 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl ${isRecommended ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white/40'}`}>
                    {chipIcons[recommendation.chipName] || <Zap className="w-6 h-6" />}
                </div>
                <div>
                    <Typography variant="title" weight="black" className="text-2xl uppercase leading-none mb-1">{recommendation.chipName}</Typography>
                    {recommendation.bestGameweek && (
                        <div className="flex items-center gap-1.5 opacity-40">
                            <Clock className="w-3 h-3" />
                            <Typography variant="caption" weight="black" className="text-[10px]">OPTIMAL IN GW {recommendation.bestGameweek}</Typography>
                        </div>
                    )}
                </div>
            </div>

            <Badge variant={isRecommended ? 'success' : 'warning'} className="px-4 py-1.5 font-black text-[10px]">
                {isRecommended ? '✓ DEPLOY NOW' : '⚠ HOLD CHIP'}
            </Badge>
        </div>

        {/* Tactical Reasoning */}
        <div className="flex-1">
             <div className={`p-6 rounded-3xl border ${isRecommended ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/5'}`}>
                <Typography className="text-base leading-relaxed text-white/80 italic">
                    &quot;{recommendation.reasoning}&quot;
                </Typography>
            </div>
        </div>

        {/* Upside Metrics */}
        {recommendation.potentialPoints !== undefined && (
            <div className="grid grid-cols-1 gap-4">
                 <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 flex items-center justify-between shadow-inner">
                    <div>
                        <Typography variant="caption" weight="black" className="text-[10px] text-emerald-500/60 uppercase tracking-widest mb-1">Estimated Return</Typography>
                        <Typography variant="title" weight="black" className="text-3xl text-emerald-400 leading-none">+{recommendation.potentialPoints.toFixed(1)} <span className="text-sm font-black opacity-60">PTS</span></Typography>
                    </div>
                    <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-500 animate-pulse">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                 </div>
            </div>
        )}
      </div>
    </Card>
  );
}

function ActivityIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
    )
}
