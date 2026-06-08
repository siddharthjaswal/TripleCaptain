import Image from "next/image";
import type { CaptainPickDTO } from "@/lib/fpl/dto";
import { getPlayerPhotoUrl } from "@/lib/fpl/images";
import { Card, Typography, Badge } from "./ui";
import { Skeleton } from "./ui/Skeleton";
import { Crown } from "lucide-react";

type CaptainPicksCardProps = {
  picks: CaptainPickDTO[];
  isLoading?: boolean;
};

export function CaptainPicksCard({ picks, isLoading = false }: CaptainPicksCardProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <section className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Skeleton variant="rectangular" width="56px" height="56px" className="rounded-2xl" />
          <div className="flex-1">
            <Skeleton variant="text" width="40%" height="24px" className="mb-2" />
            <Skeleton variant="text" width="60%" height="14px" />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="relative overflow-hidden border-white/5" glass>
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <Skeleton variant="circular" width="40px" height="40px" />
                  <Skeleton variant="rectangular" width="80px" height="20px" className="rounded" />
                </div>
                <div className="flex items-center gap-4 pb-4 border-b border-white/5">
                  <Skeleton variant="rectangular" width="64px" height="64px" className="rounded-2xl" />
                  <div className="flex-1">
                    <Skeleton variant="text" width="80%" height="20px" className="mb-2" />
                    <Skeleton variant="text" width="50%" height="12px" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton variant="rectangular" height="80px" className="rounded-2xl" />
                  <Skeleton variant="rectangular" height="80px" className="rounded-2xl" />
                </div>
                <Skeleton variant="rectangular" height="60px" className="rounded-2xl" />
                <Skeleton variant="rectangular" height="80px" className="rounded-xl" />
              </div>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (picks.length === 0) {
    return (
      <Card className="p-12 text-center" glass>
        <Typography variant="title" weight="black" className="mb-2">Captain Picks Unavailable</Typography>
        <Typography className="text-[color:var(--text-secondary)]">No captain recommendations found for the next voyage.</Typography>
      </Card>
    );
  }

  return (
    <section className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-yellow-500 text-black shadow-lg shadow-yellow-500/20">
          <Crown className="h-6 w-6" />
        </div>
        <div>
          <Typography variant="title" weight="black">Captain Picks</Typography>
          <Typography variant="caption">Top Recommendations from your squad</Typography>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {picks.map((pick, index) => (
          <CaptainPickItem key={pick.playerId} pick={pick} rank={index + 1} />
        ))}
      </div>
    </section>
  );
}

function CaptainPickItem({ pick, rank }: { pick: CaptainPickDTO; rank: number }) {
  const photoUrl = getPlayerPhotoUrl(pick.playerPhoto);
  const hasInjury = pick.chanceOfPlaying !== null && pick.chanceOfPlaying < 100;
  const rankColors = [
    "bg-yellow-500 text-black shadow-yellow-500/30",
    "bg-slate-300 text-black shadow-slate-300/30",
    "bg-orange-600 text-white shadow-orange-600/30"
  ];

  return (
    <Card className="relative overflow-hidden group border-white/5" glass>
      {/* Rank Header */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 overflow-hidden">
         <div className={`h-full ${rank === 1 ? 'bg-yellow-500' : 'bg-white/20'}`} style={{ width: rank === 1 ? '100%' : '50%' }} />
      </div>

      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xl shadow-lg ${rankColors[rank-1]}`}>
                {rank}
            </div>
            {hasInjury && (
                <Badge variant="error" className="animate-pulse tracking-tighter text-[8px]">Fitness Alert</Badge>
            )}
        </div>

        {/* Player Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-white/5">
            <div className="relative w-16 h-16 shrink-0 bg-slate-800 rounded-2xl overflow-hidden shadow-inner">
                 <Image 
                    src={photoUrl || '/player-placeholder.png'} 
                    alt={pick.playerName} 
                    fill 
                    className="object-contain" 
                    unoptimized 
                />
            </div>
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <Typography weight="black" className="text-xl uppercase truncate leading-none mb-1">{pick.playerName}</Typography>
                    {pick.reasoning.includes('DOUBLE') && (
                        <div className="bg-cyan-500 text-black text-[8px] font-black px-1 rounded animate-glow">DGW</div>
                    )}
                    {pick.reasoning.includes('BLANK') && (
                         <div className="bg-red-500 text-white text-[8px] font-black px-1 rounded">BGW</div>
                    )}
                </div>
                <Typography variant="caption" className="text-[10px] font-black opacity-40">{pick.team} • {pick.position}</Typography>
            </div>
        </div>

        {/* Tactical Metrics */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5 shadow-inner group-hover:bg-white/10 transition-colors">
                <Typography variant="caption" weight="black" className="text-[8px] opacity-40 mb-1">EXPECTED PTS</Typography>
                <Typography variant="title" weight="black" className="text-2xl text-[color:var(--accent)]">{pick.expectedPoints.toFixed(1)}</Typography>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5 shadow-inner group-hover:bg-white/10 transition-colors">
                <Typography variant="caption" weight="black" className="text-[8px] opacity-40 mb-1">RECENT FORM</Typography>
                <Typography variant="title" weight="black" className={`text-2xl ${pick.form >= 6 ? 'text-cyan-500' : 'text-white'}`}>
                    {pick.form.toFixed(1)}
                </Typography>
            </div>
        </div>

        {/* Fixture Analysis */}
        {pick.fixture && (
            <div className="bg-gradient-to-r from-white/5 to-transparent rounded-2xl p-4 border border-white/5 space-y-3">
                 <div className="flex justify-between items-center">
                    <Typography variant="caption" weight="black" className="text-[8px] opacity-40">NEXT FIXTURE</Typography>
                    <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className={`h-1 w-3 rounded-full ${i < pick.fixture!.difficulty ? getDiffColor(pick.fixture!.difficulty) : 'bg-white/10'}`} />
                        ))}
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <Typography weight="black" className="text-sm uppercase">{pick.fixture.isHome ? 'HOME' : 'AWAY'} VS {pick.fixture.opponentShort}</Typography>
                 </div>
            </div>
        )}

        {/* The Verdict */}
        <div className="relative p-4 rounded-xl bg-white/5 border-l-4 border-l-[color:var(--accent)]">
            <Typography className="text-xs italic leading-relaxed text-white/70">
                &quot;{pick.reasoning}&quot;
            </Typography>
        </div>
      </div>
    </Card>
  );
}

function getDiffColor(diff: number) {
    if (diff <= 2) return "bg-cyan-500";
    if (diff === 3) return "bg-slate-400";
    if (diff === 4) return "bg-amber-500";
    return "bg-red-500";
}
