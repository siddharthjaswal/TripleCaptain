"use client";

import type { FixtureAnalysisDTO, TeamFixtureRunDTO } from "@/lib/fpl/dto";
import { Card, Typography, Badge } from "./ui";
import { BarChart3, CheckCircle2, XCircle } from "lucide-react";

type FixtureAnalysisCardProps = {
  analysis: FixtureAnalysisDTO;
};

export function FixtureAnalysisCard({ analysis }: FixtureAnalysisCardProps) {
  return (
    <section className="space-y-12 animate-fade-in pb-20">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/20">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <Typography variant="title" weight="black">Fixture Analysis</Typography>
          <Typography variant="caption">Next {analysis.gameweeksAnalyzed} GWs difficulty ratings</Typography>
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Best Fixtures */}
        <div className="space-y-8">
            <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                    <Typography weight="black" className="uppercase tracking-tight">Prime Targets</Typography>
                    <Typography variant="caption" className="text-[10px]">Teams with the easiest voyages ahead</Typography>
                </div>
            </div>

            <div className="grid gap-4">
                {analysis.bestFixtureRuns.map((team) => (
                    <TeamFixtureRun key={team.teamId} team={team} type="best" />
                ))}
            </div>
        </div>

        {/* Worst Fixtures */}
        <div className="space-y-8">
             <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                    <XCircle className="w-6 h-6" />
                </div>
                <div>
                    <Typography weight="black" className="uppercase tracking-tight">Fixture Traps</Typography>
                    <Typography variant="caption" className="text-[10px]">Teams facing rough seas and heavy weather</Typography>
                </div>
            </div>

            <div className="grid gap-4">
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
  return (
    <Card className="p-6 relative overflow-hidden group border-white/5" glass>
      <div className={`absolute top-0 left-0 bottom-0 w-1 ${type === 'best' ? 'bg-emerald-500' : 'bg-red-500'} opacity-20`} />
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 relative flex items-center justify-center rounded-xl bg-white/5 border border-white/5 shadow-inner">
                 <img 
                    src={`https://resources.premierleague.com/premierleague/badges/t${team.teamId}.png`} 
                    alt={team.teamShort}
                    className="w-8 h-8 object-contain"
                />
            </div>
            <div>
                <Typography weight="black" className="text-lg uppercase leading-none mb-1">{team.teamName}</Typography>
                <Typography variant="caption" className="text-[9px] font-black opacity-40">AVG DIFFICULTY: {team.averageDifficulty.toFixed(2)}</Typography>
            </div>
        </div>
        <Badge variant={type === 'best' ? 'success' : 'error'} className="font-black text-[9px] px-3">{type === 'best' ? 'TARGET' : 'AVOID'}</Badge>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {team.fixtures.map((f, i) => (
          <div key={i} className="space-y-2">
             <div className={`p-3 rounded-xl border text-center transition-transform group-hover:scale-105 ${getDiffStyle(f.difficulty)}`}>
                <Typography weight="black" className="text-[10px] mb-0.5">{f.opponentShort}</Typography>
                <Typography variant="caption" className="text-[8px] font-black opacity-60">{f.isHome ? 'H' : 'A'}</Typography>
             </div>
             <Typography variant="caption" className="text-center block font-black opacity-20">GW{f.gameweek}</Typography>
          </div>
        ))}
      </div>
    </Card>
  );
}

function getDiffStyle(diff: number) {
    if (diff <= 2) return "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
    if (diff === 3) return "bg-white/5 border-white/10 text-white/50";
    if (diff === 4) return "bg-amber-500/20 border-amber-500/40 text-amber-400";
    return "bg-red-500/20 border-red-500/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]";
}
