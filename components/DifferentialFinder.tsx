"use client";

import Image from "next/image";
import { Gem, TrendingUp, Users, DollarSign } from "lucide-react";

type DifferentialPlayer = {
  elementId: number;
  playerName: string;
  teamName: string;
  teamBadge: string;
  position: string;
  photo: string | null;
  price: number;
  ownership: number;
  form: number;
  pointsPerGame: number;
  expectedPoints: number;
  upcomingFixtureDifficulty: number;
  differentialScore: number;
};

type DifferentialFinderProps = {
  differentials: DifferentialPlayer[];
  maxOwnership?: number;
};

export function DifferentialFinder({ differentials, maxOwnership = 10 }: DifferentialFinderProps) {
  const formatPrice = (price: number) => `£${(price / 10).toFixed(1)}m`;

  const topDifferentials = differentials
    .filter(p => p.ownership <= maxOwnership)
    .sort((a, b) => b.differentialScore - a.differentialScore)
    .slice(0, 6);

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return "text-cyan-500";
    if (difficulty <= 3) return "text-amber-500";
    return "text-rose-500";
  };

  const getOwnershipTier = (ownership: number) => {
    if (ownership < 2) return { label: "Ultra Rare", color: "purple" };
    if (ownership < 5) return { label: "Rare", color: "blue" };
    return { label: "Low Owned", color: "emerald" };
  };

  const getReasonText = (player: DifferentialPlayer): string => {
    const reasons = [];
    if (player.form >= 5) reasons.push("excellent form");
    if (player.pointsPerGame >= 5) reasons.push("high points per game");
    if (player.upcomingFixtureDifficulty <= 2) reasons.push("easy fixtures ahead");
    if (player.ownership < 2) reasons.push("ultra low ownership");
    if (player.price <= 60) reasons.push("budget-friendly");
    if (reasons.length === 0) return "Hidden gem with potential";
    return reasons.slice(0, 2).join(" + ");
  };

  return (
    <div className="tc-card overflow-hidden">
      <div className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-rose-500/10 p-4 border-b border-[color:var(--surface-border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gem className="h-5 w-5 text-purple-500" />
            <h3 className="text-sm font-black uppercase tracking-wider">Differential Gems</h3>
          </div>
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
            Under {maxOwnership}% Owned
          </span>
        </div>
      </div>

      <div className="p-4">
        {topDifferentials.length > 0 ? (
          <div className="grid gap-3">
            {topDifferentials.map((player) => {
              const ownershipTier = getOwnershipTier(player.ownership);
              return (
                <div key={player.elementId} className="rounded-xl border bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20 hover:border-purple-500/40 p-4 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      {player.photo ? (
                        <Image src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.photo.replace('.jpg', '')}.png`} alt={player.playerName} width={48} height={60} className="h-14 w-auto object-contain drop-shadow-md" />
                      ) : (
                        <div className="h-14 w-12 rounded-lg bg-[color:var(--surface-root)] flex items-center justify-center">
                          <Users className="h-6 w-6 tc-text-muted" />
                        </div>
                      )}
                      <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-purple-500 flex items-center justify-center">
                        <Gem className="h-3 w-3 text-[color:var(--text-primary)]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Image src={player.teamBadge} alt={player.teamName} width={16} height={16} className="h-4 w-4 object-contain" />
                        <p className="font-black text-base truncate">{player.playerName}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-xs font-bold tc-text-muted">{player.position}</span>
                        <span className="text-xs tc-text-muted">•</span>
                        <span className="text-xs font-bold">{formatPrice(player.price)}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${ownershipTier.color === 'purple' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30' : ownershipTier.color === 'blue' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30' : 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'}`}>
                          <Users className="h-2.5 w-2.5" />{player.ownership.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1"><span className="tc-text-muted">Form:</span><span className="font-black text-blue-500">{player.form}</span></div>
                        <span className="tc-text-muted">•</span>
                        <div className="flex items-center gap-1"><span className="tc-text-muted">Pts/Game:</span><span className="font-black">{player.pointsPerGame.toFixed(1)}</span></div>
                        <span className="tc-text-muted">•</span>
                        <div className="flex items-center gap-1"><span className="tc-text-muted">FDR:</span><span className={`font-black ${getDifficultyColor(player.upcomingFixtureDifficulty)}`}>{player.upcomingFixtureDifficulty}</span></div>
                      </div>
                    </div>
                    <div className="shrink-0 text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/30 flex items-center justify-center">
                        <div><p className="text-xl font-black text-purple-600 dark:text-purple-400 leading-none">{player.differentialScore}</p><p className="text-[8px] font-bold tc-text-muted uppercase">Score</p></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[color:var(--surface-border)] flex items-start gap-2">
                    <TrendingUp className="h-3 w-3 text-purple-500 mt-0.5 shrink-0" />
                    <p className="text-xs tc-text-muted"><span className="font-bold">Why pick?</span> {getReasonText(player)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Gem className="h-12 w-12 mx-auto mb-3 tc-text-muted opacity-30" />
            <p className="text-sm font-bold tc-text-muted">No differentials found</p>
          </div>
        )}
      </div>
      <div className="border-t border-[color:var(--surface-border)] p-3 bg-[color:var(--surface-root)]">
        <p className="text-xs tc-text-muted text-center">💎 Differentials can give you an edge in mini-leagues • Risk vs Reward</p>
      </div>
    </div>
  );
}
