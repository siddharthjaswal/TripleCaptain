"use client";

import { Trophy, Users, Target, TrendingUp, Crown } from "lucide-react";
import { RankChangeIndicator } from "./RankChangeIndicator";

type LeagueMember = {
  entryId: number;
  rank: number;
  previousRank: number | null;
  teamName: string;
  managerName: string;
  points: number;
  totalPoints: number;
  isCurrentUser: boolean;
};

type MiniLeagueInsightsProps = {
  leagueName: string;
  leagueId: number;
  members: LeagueMember[];
  currentUserRank: number;
  averagePoints: number;
  topManagerPoints: number;
};

export function MiniLeagueInsights({
  leagueName,
  members,
  currentUserRank,
  averagePoints,
  topManagerPoints,
}: MiniLeagueInsightsProps) {
  const currentUser = members.find(m => m.isCurrentUser);
  const topThree = members.slice(0, 3);
  const pointsBehindLeader = currentUser ? topManagerPoints - currentUser.totalPoints : 0;
  const vsAverage = currentUser ? currentUser.totalPoints - averagePoints : 0;

  return (
    <div className="tc-card overflow-hidden">
      <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10 p-4 border-b border-[color:var(--surface-border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-black uppercase tracking-wider">Mini League Insights</h3>
          </div>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
            {leagueName}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Your Position */}
        {currentUser && (
          <div className="rounded-xl bg-gradient-to-br from-[color:var(--accent)]/10 to-[color:var(--accent)]/5 border border-[color:var(--accent)]/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[color:var(--accent)]" />
                <p className="text-xs font-black uppercase tracking-wider">Your Position</p>
              </div>
              <RankChangeIndicator currentRank={currentUser.rank} previousRank={currentUser.previousRank} size="sm" showValue={false} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs tc-text-muted mb-1">Rank</p>
                <p className="text-2xl font-black">#{currentUser.rank}</p>
              </div>
              <div>
                <p className="text-xs tc-text-muted mb-1">Total Points</p>
                <p className="text-2xl font-black">{currentUser.totalPoints.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] p-3">
            <p className="text-xs tc-text-muted mb-1">Behind Leader</p>
            <p className={`text-xl font-black ${pointsBehindLeader === 0 ? 'text-amber-500' : 'text-rose-500'}`}>
              {pointsBehindLeader === 0 ? '🏆 Leader!' : `${pointsBehindLeader} pts`}
            </p>
          </div>
          <div className="rounded-lg bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] p-3">
            <p className="text-xs tc-text-muted mb-1">vs Average</p>
            <p className={`text-xl font-black ${vsAverage >= 0 ? 'text-cyan-500' : 'text-rose-500'}`}>
              {vsAverage >= 0 ? '+' : ''}{vsAverage} pts
            </p>
          </div>
        </div>

        {/* Top 3 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-4 w-4 text-amber-500" />
            <p className="text-xs font-black uppercase tracking-wider tc-text-muted">Top 3 Managers</p>
          </div>
          <div className="space-y-2">
            {topThree.map((member, idx) => (
              <div key={member.entryId} className={`rounded-lg border p-3 transition-all ${member.isCurrentUser ? 'bg-[color:var(--accent)]/5 border-[color:var(--accent)]/30' : 'bg-[color:var(--surface-elevated)] border-[color:var(--surface-border)]'}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-black ${idx === 0 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : idx === 1 ? 'bg-slate-400/20 text-slate-600 dark:text-slate-400' : 'bg-orange-500/20 text-orange-600 dark:text-orange-400'}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black truncate">{member.teamName}</p>
                    <p className="text-xs tc-text-muted truncate">{member.managerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black tabular-nums">{member.totalPoints.toLocaleString()}</p>
                    <p className="text-xs tc-text-muted">pts</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* League Stats */}
        <div className="rounded-lg bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] p-3">
          <p className="text-xs font-bold uppercase tracking-wider tc-text-muted mb-2">League Average</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black tabular-nums">{averagePoints.toFixed(0)}</p>
            <p className="text-xs tc-text-muted">points per manager</p>
          </div>
        </div>
      </div>
    </div>
  );
}
