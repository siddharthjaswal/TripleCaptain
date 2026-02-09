"use client";

import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";

type RankChangeIndicatorProps = {
  currentRank: number | null;
  previousRank: number | null;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
};

export function RankChangeIndicator({ 
  currentRank, 
  previousRank, 
  size = "md",
  showValue = true 
}: RankChangeIndicatorProps) {
  if (!currentRank || !previousRank) {
    return null;
  }

  const change = previousRank - currentRank; // Positive = improved (rank went down)
  const isImproved = change > 0;
  const isWorsened = change < 0;
  const isUnchanged = change === 0;

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  if (isUnchanged) {
    return showValue ? (
      <div className={`inline-flex items-center gap-1 ${textSizes[size]} font-semibold text-slate-400`}>
        <Minus className={sizeClasses[size]} />
        <span>—</span>
      </div>
    ) : (
      <Minus className={`${sizeClasses[size]} text-slate-400`} />
    );
  }

  if (isImproved) {
    return (
      <div className={`inline-flex items-center gap-1 ${textSizes[size]} font-bold text-emerald-500`}>
        <TrendingUp className={sizeClasses[size]} />
        {showValue && <span>↑ {Math.abs(change).toLocaleString()}</span>}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 ${textSizes[size]} font-bold text-rose-500`}>
      <TrendingDown className={sizeClasses[size]} />
      {showValue && <span>↓ {Math.abs(change).toLocaleString()}</span>}
    </div>
  );
}

type RankBadgeProps = {
  rank: number | null;
  previousRank?: number | null;
  label?: string;
};

export function RankBadge({ rank, previousRank, label = "Rank" }: RankBadgeProps) {
  if (!rank) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 px-4 py-2">
      <Trophy className="h-4 w-4 text-amber-500" />
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            {label}
          </span>
          <span className="text-lg font-black tabular-nums">
            {rank.toLocaleString()}
          </span>
        </div>
        {previousRank && (
          <RankChangeIndicator 
            currentRank={rank} 
            previousRank={previousRank} 
            size="sm"
            showValue={false}
          />
        )}
      </div>
    </div>
  );
}
