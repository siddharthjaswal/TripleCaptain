"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { LeagueStandingDTO, LatestGwDTO } from "@/lib/fpl/dto";
import { formatNumber } from "@/lib/format";
import { useLeagueTeamPicks } from "@/hooks/useLeagueTeamPicks";
import { TeamPitchModal } from "./TeamPitchModal";
import { Card, Typography, Badge, Button } from "./ui";
import { Eye, Trophy, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

type LeagueTableProps = {
  league: LeagueStandingDTO;
  currentEntryId: number;
};

export function LeagueTable({ league, currentEntryId }: LeagueTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [selectedTeam, setSelectedTeam] = useState<{
    teamName: string;
    teamPicks: LatestGwDTO;
  } | null>(null);

  // Fetch team picks for small leagues (< 20 members)
  const { entries: enrichedEntries } = useLeagueTeamPicks(
    league.entries,
    league.gameweek,
    league.entries.length < 20
  );

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <Card className="relative overflow-hidden border-[color:var(--surface-border)] animate-fade-in" glass hover={false}>
      {/* Table Header */}
      <div className="p-8 border-b border-[color:var(--surface-border)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-yellow-500/10 text-yellow-500">
                <Trophy className="w-6 h-6" />
            </div>
            <div>
                <Typography variant="title" weight="black" className="uppercase truncate">{league.leagueName}</Typography>
                <Typography variant="caption" className="font-bold opacity-40 uppercase tracking-widest text-[10px]">Leaderboard • Page {league.page}</Typography>
            </div>
        </div>
        {league.gameweek && (
            <Badge variant="primary" className="bg-[color:var(--accent)] text-[color:var(--accent-contrast)] px-4 py-1.5 font-black">GW {league.gameweek} STATUS</Badge>
        )}
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[color:var(--surface-hover)]">
              <th className="px-3 sm:px-6 py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[color:var(--text-tertiary)]">Rank</th>
              <th className="hidden sm:table-cell px-4 py-4 text-[10px] font-black uppercase tracking-widest text-[color:var(--text-tertiary)] text-center">Trend</th>
              <th className="px-3 sm:px-6 py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[color:var(--text-tertiary)]">Squad & Manager</th>
              {enrichedEntries.length < 20 && (
                <th className="hidden lg:table-cell px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[color:var(--text-tertiary)] text-center">Captain</th>
              )}
              <th className="px-3 sm:px-6 py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[color:var(--text-tertiary)] text-right">Points</th>
              <th className="hidden sm:table-cell px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[color:var(--text-tertiary)] text-right">Total</th>
              {enrichedEntries.length < 20 && (
                <th className="hidden md:table-cell px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[color:var(--text-tertiary)] text-center">Tactics</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--surface-border)]">
            {enrichedEntries.map((entry, index) => {
              const delta = formatRankDelta(entry.rank, entry.lastRank);
              const isCurrentUser = entry.entryId === currentEntryId;
              const liveRank = index + 1 + (league.page - 1) * 50;
              const rankDeltaFromLive = entry.rank ? entry.rank - liveRank : 0;

              return (
                <tr
                  key={entry.entryId}
                  onClick={() => {
                      if (entry.teamPicks) {
                        setSelectedTeam({
                            teamName: entry.entryName,
                            teamPicks: entry.teamPicks!,
                          });
                      }
                  }}
                  className={`group transition-colors cursor-pointer ${
                    isCurrentUser
                      ? "bg-[color:var(--accent)]/10 hover:bg-[color:var(--accent)]/20"
                      : "hover:bg-[color:var(--surface-hover)]"
                  }`}
                >
                  <td className="px-3 sm:px-6 py-4">
                    <div className="flex flex-col items-center gap-1">
                        <div className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center font-black text-xs sm:text-sm transition-transform group-hover:scale-110 ${liveRank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-black shadow-lg shadow-yellow-500/20' : 'bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)] text-[color:var(--text-secondary)]'}`}>
                            {liveRank}
                        </div>
                        {/* Mobile-only trend indicator under rank */}
                        <div className="sm:hidden mt-1">
                            {delta.label}
                        </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-4 py-5 text-center">
                    <div className="flex flex-col items-center gap-1">
                        <div className={`inline-flex items-center justify-center font-black text-[10px] ${delta.className}`}>
                            {delta.label}
                        </div>
                        {entry.isLive && rankDeltaFromLive !== 0 && (
                            <div className={`px-1.5 py-0.5 rounded-full text-[8px] font-black border ${rankDeltaFromLive > 0 ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                                {rankDeltaFromLive > 0 ? `▲ LIVE +${rankDeltaFromLive}` : `▼ LIVE ${rankDeltaFromLive}`}
                            </div>
                        )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <Typography weight="black" className={`text-[11px] sm:text-[13px] uppercase tracking-tight truncate max-w-[120px] sm:max-w-none ${isCurrentUser ? 'text-cyan-400' : 'text-[color:var(--text-primary)]'}`}>
                            {entry.entryName}
                        </Typography>
                        <Typography variant="caption" className="text-[8px] sm:text-[10px] opacity-60 font-black uppercase tracking-wider text-[color:var(--text-secondary)] truncate max-w-[100px] sm:max-w-none">
                            {entry.playerName} {isCurrentUser && '• YOU'}
                        </Typography>
                        {/* Mobile-only sub-info: Captain and Rank Delta */}
                        <div className="flex items-center gap-2 mt-1 sm:hidden">
                            {entry.isLive && rankDeltaFromLive !== 0 && (
                                <span className={`text-[7px] font-black px-1 rounded border ${rankDeltaFromLive > 0 ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                                    {rankDeltaFromLive > 0 ? `+${rankDeltaFromLive} LIVE` : `${rankDeltaFromLive} LIVE`}
                                </span>
                            )}
                            {entry.captain && (
                                <span className="text-[7px] text-[color:var(--text-tertiary)] font-black uppercase tracking-tighter">
                                    {entry.captain.playerName} (C)
                                </span>
                            )}
                        </div>
                    </div>
                  </td>
                  
                  {enrichedEntries.length < 20 && (
                    <td className="hidden lg:table-cell px-6 py-5 text-center">
                      {entry.isLoading ? (
                        <div className="w-4 h-4 rounded-full border-2 border-[color:var(--surface-border)] border-t-white/30 animate-spin mx-auto" />
                      ) : entry.captain ? (
                         <Badge variant="secondary" className="bg-[color:var(--surface-hover)] text-[color:var(--text-secondary)] border-[color:var(--surface-border)] text-[9px] font-black uppercase tracking-tighter">
                            {entry.captain.playerName}
                         </Badge>
                      ) : (
                        <span className="text-[color:var(--text-tertiary)]">—</span>
                      )}
                    </td>
                  )}

                  <td className="px-3 sm:px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                        <Typography weight="black" className="text-xs sm:text-base font-mono text-[color:var(--text-primary)] tracking-tighter sm:tracking-normal">
                            {formatNumber(entry.totalPoints)}
                        </Typography>
                        <div className="flex items-center gap-1">
                            {entry.isLive && (
                                <span className="text-[6px] sm:text-[7px] font-black text-cyan-400 uppercase tracking-tighter bg-cyan-500/10 px-1 py-0.5 rounded border border-cyan-500/20">Live</span>
                            )}
                            <Typography weight="black" className="text-[10px] sm:text-sm font-mono text-cyan-400">+{formatNumber(entry.points)}</Typography>
                        </div>
                    </div>
                  </td>

                  <td className="hidden sm:table-cell px-6 py-5 text-right">
                    <Typography weight="black" className="text-base font-mono text-[color:var(--text-primary)] tracking-tight">{formatNumber(entry.totalPoints)}</Typography>
                  </td>

                  {enrichedEntries.length < 20 && (
                    <td className="hidden md:table-cell px-6 py-5 text-center">
                      {entry.teamPicks ? (
                        <div className="h-8 w-8 mx-auto flex items-center justify-center rounded-lg bg-[color:var(--surface-hover)] text-[color:var(--text-tertiary)] group-hover:text-cyan-400 group-hover:bg-cyan-400/10 transition-all">
                          <Eye size={16} />
                        </div>
                      ) : (
                        <span className="text-[color:var(--text-tertiary)]">—</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(league.page > 1 || league.hasNextPage) && (
        <div className="p-8 border-t border-[color:var(--surface-border)] flex items-center justify-between bg-[color:var(--surface-hover)] backdrop-blur-sm">
            <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(league.page - 1)}
                disabled={league.page === 1 || isPending}
                className="gap-2"
            >
                <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            
            <Typography variant="caption" weight="black" className="opacity-40">Page {league.page}</Typography>

            <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(league.page + 1)}
                disabled={!league.hasNextPage || isPending}
                className="gap-2"
            >
                Next <ChevronRight className="w-4 h-4" />
            </Button>
        </div>
      )}

      {isPending && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md animate-fade-in">
           <Loader2 className="w-12 h-12 animate-spin text-[color:var(--accent)]" />
        </div>
      )}

      {/* Team Pitch Modal */}
      {selectedTeam && selectedTeam.teamPicks && (
        <TeamPitchModal
          teamPicks={selectedTeam.teamPicks}
          teamName={selectedTeam.teamName}
          isOpen={true}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </Card>
  );
}

function formatRankDelta(
  current: number | null,
  previous: number | null,
): { label: React.ReactNode; className: string } {
  if (!current || !previous) return { label: "—", className: "opacity-20" };
  const delta = previous - current;
  if (delta === 0) return { label: "↔", className: "opacity-20" };
  if (delta > 0) return { 
    label: (
        <span className="flex items-center gap-0.5 bg-cyan-500/10 px-2 py-0.5 rounded-full text-cyan-400">
            <span className="text-[8px]">▲</span> {delta}
        </span>
    ), 
    className: "text-cyan-500" 
  };
  return { 
    label: (
        <span className="flex items-center gap-0.5 bg-red-500/10 px-2 py-0.5 rounded-full text-red-400">
            <span className="text-[8px]">▼</span> {Math.abs(delta)}
        </span>
    ), 
    className: "text-red-500" 
  };
}
