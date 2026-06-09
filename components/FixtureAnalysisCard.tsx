"use client";

import type { FixtureAnalysisDTO, TeamFixtureRunDTO } from "@/lib/fpl/dto";
import { Card, Typography, Badge } from "./ui";
import { Skeleton } from "./ui/Skeleton";
import { BarChart3, CheckCircle2, XCircle, Info } from "lucide-react";
import Image from "next/image";

type FixtureAnalysisCardProps = {
  analysis: FixtureAnalysisDTO;
  isLoading?: boolean;
};

export function FixtureAnalysisCard({ analysis, isLoading = false }: FixtureAnalysisCardProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <section className="space-y-12 animate-fade-in pb-20">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
          <div className="flex items-center gap-4">
            <Skeleton variant="rectangular" width="56px" height="56px" className="rounded-2xl" />
            <div>
              <Skeleton variant="text" width="250px" height="40px" className="mb-2" />
              <Skeleton variant="text" width="200px" height="12px" />
            </div>
          </div>
          <Card className="px-8 py-4 border-blue-500/20 bg-blue-500/5" glass hover={false}>
            <Skeleton variant="text" width="120px" height="40px" />
          </Card>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          {[1, 2].map((section) => (
            <div key={section} className="space-y-8">
              <div className="flex items-center gap-3 px-4">
                <Skeleton variant="rectangular" width="48px" height="48px" className="rounded-2xl" />
                <div>
                  <Skeleton variant="text" width="150px" height="20px" className="mb-1" />
                  <Skeleton variant="text" width="200px" height="12px" />
                </div>
              </div>
              <div className="grid gap-6">
                {[1, 2, 3].map((team) => (
                  <Card key={team} className="border-[color:var(--surface-border)] bg-[color:var(--surface-hover)]" glass hover={false}>
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <Skeleton variant="circular" width="48px" height="48px" />
                        <div className="flex-1">
                          <Skeleton variant="text" width="60%" height="20px" className="mb-1" />
                          <Skeleton variant="text" width="40%" height="14px" />
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map((fix) => (
                          <Skeleton key={fix} variant="rectangular" height="64px" className="rounded-xl" />
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-12 animate-fade-in pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-blue-500 text-white shadow-xl shadow-blue-500/30">
                <BarChart3 className="h-7 w-7" />
            </div>
            <div>
                <Typography variant="display" className="text-3xl md:text-5xl text-[color:var(--text-primary)]">Fixture Analysis</Typography>
                <Typography variant="caption" weight="black" className="opacity-40 tracking-[0.3em] text-[10px]">UPCOMING BATTLEGROUNDS</Typography>
            </div>
        </div>

        <Card className="px-8 py-4 border-blue-500/20 bg-blue-500/5 flex items-center gap-4" glass hover={false}>
            <Info className="w-5 h-5 text-blue-400 opacity-50" />
            <Typography variant="caption" weight="black" className="text-[10px] opacity-60 leading-tight">
                ANALYZING THE NEXT<br/>
                <span className="text-[color:var(--text-primary)] text-base">{analysis.gameweeksAnalyzed} GAMEWEEKS</span>
            </Typography>
        </Card>
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Best Fixtures */}
        <div className="space-y-8">
            <div className="flex items-center gap-3 px-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500 text-black flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                    <Typography variant="title" weight="black" className="uppercase">Prime Targets</Typography>
                    <Typography variant="caption" className="text-[10px] font-bold opacity-40">Easiest voyages for max plundering</Typography>
                </div>
            </div>

            <div className="grid gap-6">
                {analysis.bestFixtureRuns.map((team) => (
                    <TeamFixtureRun key={team.teamId} team={team} type="best" />
                ))}
            </div>
        </div>

        {/* Worst Fixtures */}
        <div className="space-y-8">
             <div className="flex items-center gap-3 px-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/20">
                    <XCircle className="w-7 h-7" />
                </div>
                <div>
                    <Typography variant="title" weight="black" className="uppercase">Fixture Traps</Typography>
                    <Typography variant="caption" className="text-[10px] font-bold opacity-40">Rough seas ahead - consider selling</Typography>
                </div>
            </div>

            <div className="grid gap-6">
                {analysis.worstFixtureRuns.map((team) => (
                    <TeamFixtureRun key={team.teamId} team={team} type="worst" />
                ))}
            </div>
        </div>
      </div>
    </section>
  );
}

function TeamFixtureRun({ team, type }: { team: TeamFixtureRunDTO; type: "best" | "worst" }) {
  // Group fixtures by gameweek to detect DGW
  const groupedFixtures = team.fixtures.reduce((acc, f) => {
      if (!acc[f.gameweek]) acc[f.gameweek] = [];
      acc[f.gameweek].push(f);
      return acc;
  }, {} as Record<number, TeamFixtureRunDTO['fixtures']>);

  // Get range of gameweeks
  const gws = Object.keys(groupedFixtures).map(Number).sort((a,b) => a-b);
  const minGw = gws[0];
  const gwRange = Array.from({ length: 5 }, (_, i) => minGw + i);

  return (
    <Card className="relative overflow-hidden group border-[color:var(--surface-border)]" glass hover={false}>
      {/* Dynamic Background Accent */}
      <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-[60px] opacity-10 ${type === 'best' ? 'bg-cyan-500' : 'bg-red-500'}`} />
      
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
                <div className="w-16 h-16 relative flex items-center justify-center rounded-2xl bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)] shadow-2xl shrink-0 p-3">
                    <Image 
                        src={`https://resources.premierleague.com/premierleague/badges/t${team.teamCode}.png`} 
                        alt={team.teamShort}
                        fill
                        className="object-contain p-2"
                        unoptimized
                    />
                </div>
                <div>
                    <Typography variant="title" weight="black" className="text-2xl uppercase leading-none mb-2 text-[color:var(--text-primary)]">{team.teamName}</Typography>
                    <div className="flex items-center gap-3">
                         <Badge variant={type === 'best' ? 'success' : 'error'} className="font-black text-[9px] px-3 py-1 tracking-widest">
                            {type === 'best' ? 'TARGET' : 'AVOID'}
                         </Badge>
                         <Typography variant="caption" className="text-[10px] font-black opacity-30 uppercase tracking-tighter">AVG DIFF: {team.averageDifficulty.toFixed(2)}</Typography>
                    </div>
                </div>
            </div>
            
            <DifficultyIndicator difficulty={team.averageDifficulty} type={type} />
        </div>

        {/* Fixture Timeline */}
        <div className="space-y-4">
             <div className="flex items-center justify-between px-1">
                <Typography variant="caption" weight="black" className="text-[9px] opacity-30 tracking-[0.3em] uppercase">Tactical Timeline</Typography>
                <div className="h-px flex-1 mx-4 bg-[color:var(--surface-hover)]" />
             </div>

             <div className="grid grid-cols-5 gap-4">
                {gwRange.map(gw => {
                    const fixtures = groupedFixtures[gw] || [];
                    const isBlank = fixtures.length === 0;
                    const isDouble = fixtures.length >= 2;
                    
                    return (
                        <div key={gw} className="space-y-3 group/fix relative">
                            <div className={`p-4 rounded-2xl border-2 transition-all duration-300 group-hover/fix:scale-105 text-center shadow-xl flex flex-col items-center justify-center min-h-[85px] ${isBlank ? 'bg-red-950/20 border-red-500/20' : getDiffStyle(fixtures[0].difficulty)} ${isDouble ? 'ring-2 ring-cyan-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : ''}`}>
                                {isBlank ? (
                                    <div className="space-y-1">
                                        <Typography weight="black" className="text-xs text-red-500 uppercase">BLANK</Typography>
                                        <Typography variant="caption" className="text-[8px] font-black text-red-500/40">NO GAME</Typography>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {fixtures.map((f, i) => (
                                            <div key={i} className={i > 0 ? "pt-1 border-t border-[color:var(--surface-border)] mt-1" : ""}>
                                                <Typography weight="black" className="text-xs uppercase tracking-tighter leading-none text-[color:var(--text-primary)]">{f.opponentShort}</Typography>
                                                <Typography variant="caption" className="text-[8px] font-black opacity-50 uppercase leading-none">{f.isHome ? 'H' : 'A'}</Typography>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {isDouble && (
                                    <div className="absolute -top-2 -right-2 bg-cyan-500 text-black text-[7px] font-black px-1.5 py-0.5 rounded shadow-lg z-20">DOUBLE</div>
                                )}
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <Typography variant="caption" className={`text-[8px] font-black uppercase ${isBlank ? 'text-red-500/40' : 'opacity-20'}`}>GW{gw}</Typography>
                                {!isBlank && (
                                    <div className={`h-1 w-full rounded-full ${getDiffStyleLine(fixtures[0].difficulty)}`} />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </Card>
  );
}

function DifficultyIndicator({ difficulty, type }: { difficulty: number, type: "best" | "worst" }) {
    const percent = ((difficulty - 1) / 4) * 100;
    
    return (
        <div className="w-24 space-y-2 hidden sm:block">
            <div className="flex justify-between items-center text-[8px] font-black opacity-30 uppercase tracking-widest">
                <span>Safe</span>
                <span>Trap</span>
            </div>
            <div className="h-1.5 w-full bg-[color:var(--surface-hover)] rounded-full overflow-hidden border border-[color:var(--surface-border)] p-[1px]">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${type === 'best' ? 'bg-cyan-500' : 'bg-red-500'}`} 
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    )
}

function getDiffStyle(diff: number) {
    if (diff <= 2) return "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-cyan-500/10";
    if (diff === 3) return "border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] text-[color:var(--text-secondary)] shadow-white/5";
    if (diff === 4) return "border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-amber-500/10";
    return "border-red-500/30 bg-red-500/10 text-red-400 shadow-red-500/10";
}

function getDiffStyleLine(diff: number) {
    if (diff <= 2) return "bg-cyan-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]";
    if (diff === 3) return "bg-[color:var(--surface-hover)]";
    if (diff === 4) return "bg-amber-500";
    return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]";
}
