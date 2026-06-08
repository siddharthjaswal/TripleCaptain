"use client";

import { TrendingUp, Target, Award } from "lucide-react";
import { Skeleton } from "./ui/Skeleton";

type PointsPaceProps = {
  currentPoints: number;
  currentGameweek: number;
  totalGameweeks?: number;
  isLoading?: boolean;
};

export function PointsPace({ currentPoints, currentGameweek, totalGameweeks = 38, isLoading = false }: PointsPaceProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="tc-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton variant="circular" width="20px" height="20px" />
          <Skeleton variant="text" width="40%" height="14px" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] p-3">
            <Skeleton variant="text" width="50%" height="10px" className="mb-2" />
            <Skeleton variant="text" width="70%" height="28px" />
          </div>
          <div className="rounded-lg bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] p-3">
            <Skeleton variant="text" width="60%" height="10px" className="mb-2" />
            <Skeleton variant="text" width="70%" height="28px" />
          </div>
        </div>
        <div className="mt-3 rounded-lg bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] p-2">
          <Skeleton variant="text" width="60%" height="12px" className="mb-2" />
          <Skeleton variant="rectangular" height="8px" />
        </div>
      </div>
    );
  }

  if (currentGameweek === 0) {
    return null;
  }

  const averagePerGameweek = currentPoints / currentGameweek;
  const projectedTotal = Math.round(averagePerGameweek * totalGameweeks);
  const remainingGameweeks = totalGameweeks - currentGameweek;
  const pointsNeededFor2000 = Math.max(0, 2000 - currentPoints);
  const avgNeededFor2000 = remainingGameweeks > 0 
    ? Math.round(pointsNeededFor2000 / remainingGameweeks) 
    : 0;

  // Determine status
  const getStatus = () => {
    if (projectedTotal >= 2200) return { label: "Elite Pace", color: "emerald", icon: Award };
    if (projectedTotal >= 2000) return { label: "Great Pace", color: "blue", icon: TrendingUp };
    if (projectedTotal >= 1800) return { label: "Good Pace", color: "amber", icon: Target };
    return { label: "Building", color: "slate", icon: Target };
  };

  const status = getStatus();
  const Icon = status.icon;

  const colorClasses: Record<string, string> = {
    emerald: "from-cyan-500/20 to-cyan-500/20 border-cyan-500/30 text-cyan-600 dark:text-cyan-400",
    blue: "from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-600 dark:text-blue-400",
    amber: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-600 dark:text-amber-400",
    slate: "from-slate-500/20 to-slate-400/20 border-slate-500/30 text-slate-600 dark:text-slate-400",
  };

  return (
    <div className={`tc-card bg-gradient-to-br ${colorClasses[status.color]}`}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="h-5 w-5" />
          <h3 className="text-sm font-black uppercase tracking-wider">
            Season Pace
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Current Avg */}
          <div className="rounded-lg bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider tc-text-muted mb-1">
              Avg/GW
            </p>
            <p className="text-2xl font-black tabular-nums">
              {averagePerGameweek.toFixed(1)}
            </p>
          </div>

          {/* Projected Total */}
          <div className="rounded-lg bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider tc-text-muted mb-1">
              Projected
            </p>
            <p className="text-2xl font-black tabular-nums">
              {projectedTotal.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-3 p-2 rounded-lg bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold">Progress to 2,000</span>
            <span className="text-xs font-black tabular-nums">
              {((currentPoints / 2000) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-[color:var(--surface-root)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent)]/70 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((currentPoints / 2000) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Target Info */}
        {remainingGameweeks > 0 && pointsNeededFor2000 > 0 && (
          <div className="mt-3 p-2 rounded-lg bg-[color:var(--accent)]/10 border border-[color:var(--accent)]/20">
            <p className="text-xs font-bold text-center">
              Need <span className="font-black">{avgNeededFor2000} pts/GW</span> to reach 2,000
            </p>
          </div>
        )}

        {projectedTotal >= 2000 && (
          <div className="mt-3 p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <p className="text-xs font-bold text-cyan-600 dark:text-cyan-400 text-center">
              🎯 On track for {projectedTotal.toLocaleString()} points!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
