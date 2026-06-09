"use client";

import React from "react";
import type { ChipRecommendationDTO } from "@/lib/fpl/dto";
import { Card, Typography, Badge } from "./ui";
import { 
    Zap, 
    Trophy, 
    Rocket, 
    Target, 
    Sparkles,
    TrendingUp,
    CheckCircle2,
    ShieldAlert
} from "lucide-react";

type ChipRecommendationsCardProps = {
  recommendations: ChipRecommendationDTO[];
};

export function ChipRecommendationsCard({
  recommendations,
}: ChipRecommendationsCardProps) {
  if (recommendations.length === 0) {
    return (
      <Card className="p-20 text-center" glass hover={false}>
        <div className="p-5 w-20 h-20 rounded-3xl bg-[color:var(--accent)]/10 text-[color:var(--accent)] mx-auto mb-8 flex items-center justify-center">
             <Trophy className="w-10 h-10" />
        </div>
        <Typography variant="title" weight="black" className="mb-3 uppercase text-3xl text-[color:var(--text-primary)]">All Chips Deployed</Typography>
        <Typography className="text-[color:var(--text-secondary)] text-lg">Every tactical edge has been used. The squad is on its final voyage.</Typography>
      </Card>
    );
  }

  return (
    <section className="space-y-10 animate-fade-in pb-20">
        <div className="flex items-center gap-4 px-4">
            <div className="p-3.5 rounded-2xl bg-indigo-500 text-white shadow-xl shadow-indigo-500/20">
                <Rocket className="h-7 w-7" />
            </div>
            <div>
                <Typography variant="display" className="text-3xl md:text-5xl text-[color:var(--text-primary)]">Strategy</Typography>
                <Typography variant="caption" weight="black" className="opacity-40 tracking-[0.3em] text-[10px]">TACTICAL DEPLOYMENT CENTER</Typography>
            </div>
        </div>

      <div className="grid gap-8">
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
    "Triple Captain": <Sparkles className="w-8 h-8" />,
    "Bench Boost": <Zap className="w-8 h-8" />,
    "Free Hit": <Target className="w-8 h-8" />,
    "Wildcard": <ActivityIcon />,
  };

  const isRecommended = recommendation.recommend;

  return (
    <Card 
        className={`relative overflow-hidden flex flex-col h-full border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] transition-all duration-500 ${isRecommended ? 'ring-2 ring-cyan-500/20 border-cyan-500/30' : ''}`} 
        glass
        hover={false}
    >
      <div className="flex flex-col md:flex-row">
        {/* Left: Tactical Badge */}
        <div className={`w-full md:w-64 p-10 flex flex-col items-center justify-center text-center gap-6 border-b md:border-b-0 md:border-r border-[color:var(--surface-border)] ${isRecommended ? 'bg-cyan-500/[0.03]' : 'bg-white/[0.01]'}`}>
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl ${isRecommended ? 'bg-cyan-500 text-black animate-glow' : 'bg-[color:var(--surface-hover)] text-[color:var(--text-tertiary)]'}`}>
                {chipIcons[recommendation.chipName] || <Zap className="w-8 h-8" />}
            </div>
            <div className="space-y-2">
                <Typography variant="title" weight="black" className="text-2xl uppercase tracking-tight text-[color:var(--text-primary)]">{recommendation.chipName}</Typography>
                {recommendation.bestGameweek && (
                    <Badge variant="secondary" className="px-3 py-1 font-black text-[9px] tracking-widest bg-[color:var(--surface-hover)] border-[color:var(--surface-border)]">BEST IN GW {recommendation.bestGameweek}</Badge>
                )}
            </div>
            <div className={`px-5 py-2 rounded-full font-black text-[10px] tracking-[0.2em] shadow-lg border ${isRecommended ? 'bg-cyan-500 border-cyan-400 text-black' : 'bg-[color:var(--surface-hover)] border-[color:var(--surface-border)] text-[color:var(--text-tertiary)]'}`}>
                {isRecommended ? '✓ READY FOR BATTLE' : '⚠ HOLD CHIP'}
            </div>
        </div>

        {/* Right: Briefing */}
        <div className="flex-1 p-10 flex flex-col justify-center space-y-10">
            <div className="relative p-8 rounded-3xl bg-white/[0.02] border border-[color:var(--surface-border)] overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    {isRecommended ? <CheckCircle2 className="w-20 h-20 text-cyan-400" /> : <ShieldAlert className="w-20 h-20 text-[color:var(--text-primary)]" />}
                </div>
                <Typography variant="caption" weight="black" className="text-[10px] opacity-30 tracking-[0.2em] mb-4 block uppercase">Tactical Briefing</Typography>
                <Typography className="text-lg leading-relaxed text-[color:var(--text-secondary)] italic">
                    &quot;{recommendation.reasoning}&quot;
                </Typography>
            </div>

            {recommendation.potentialPoints !== undefined && (
                <div className="flex items-center gap-8 px-4">
                    <div className="space-y-1">
                        <Typography variant="caption" weight="black" className="text-[9px] opacity-40 tracking-widest uppercase">ESTIMATED GAIN</Typography>
                        <div className="flex items-baseline gap-2 text-cyan-400">
                            <Typography weight="black" className="text-4xl">+{recommendation.potentialPoints.toFixed(1)}</Typography>
                            <Typography weight="black" className="text-xs opacity-60">PTS</Typography>
                        </div>
                    </div>
                    <div className="h-12 w-0.5 bg-[color:var(--surface-hover)]" />
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 shadow-lg shadow-cyan-500/10 animate-pulse">
                            <TrendingUp className="w-5 h-5" />
                         </div>
                         <Typography variant="caption" className="max-w-[120px] text-[color:var(--text-tertiary)] font-bold leading-tight">High ROI forecast for this gameweek.</Typography>
                    </div>
                </div>
            )}
        </div>
      </div>
    </Card>
  );
}

function ActivityIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
    )
}
