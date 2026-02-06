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
    <Card className="relative overflow-hidden border-white/5 animate-fade-in" glass hover={false}>
      {/* Table Header */}
      <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
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
            <tr className="bg-white/5">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Rank</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Trend</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Squad & Manager</th>
              {enrichedEntries.length < 20 && (
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Captain</th>
              )}
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">GW Pts</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Total</th>
              {enrichedEntries.length < 20 && (
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Tactics</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {enrichedEntries.map((entry) => {
              const delta = formatRankDelta(entry.rank, entry.lastRank);
              const isCurrentUser = entry.entryId === currentEntryId;
              return (
                <tr
                  key={entry.entryId}
                  className={`group transition-colors ${
                    isCurrentUser
                      ? "bg-[color:var(--accent)]/10 hover:bg-[color:var(--accent)]/20"
                      : "hover:bg-white/5"
                  }`}
                >
                  <td className="px-6 py-5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${entry.rank === 1 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'bg-white/10 text-white/60'}`}>
                        {entry.rank}
                    </div>
                  </td>
                  <td className="px-4 py-5 text-center">
                    <div className={`inline-flex items-center justify-center font-black text-[10px] ${delta.className}`}>
                        {delta.label}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                        <Typography weight="black" className={`text-sm uppercase ${isCurrentUser ? 'text-[color:var(--accent)]' : 'text-white'}`}>
                            {entry.entryName}
                        </Typography>
                        <Typography variant="caption" className="text-[9px] opacity-40 font-bold">{entry.playerName} {isCurrentUser && '• YOU'}</Typography>
                    </div>
                  </td>
                  
                  {enrichedEntries.length < 20 && (
                    <td className="px-6 py-5 text-center">
                      {entry.isLoading ? (
                        <div className="w-4 h-4 rounded-full border-2 border-white/10 border-t-white/30 animate-spin mx-auto" />
                      ) : entry.captain ? (
                         <Badge variant="secondary" className="bg-white/5 text-white/70 border-white/10 text-[9px] font-black uppercase tracking-tighter">
                            {entry.captain.playerName}
                         </Badge>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </td>
                  )}

                  <td className="px-6 py-5 text-right">
                    <Typography weight="black" className="text-sm font-mono text-emerald-400">+{formatNumber(entry.points)}</Typography>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Typography weight="black" className="text-sm font-mono text-white">{formatNumber(entry.totalPoints)}</Typography>
                  </td>

                  {enrichedEntries.length < 20 && (
                    <td className="px-6 py-5 text-center">
                      {entry.teamPicks ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setSelectedTeam({
                              teamName: entry.entryName,
                              teamPicks: entry.teamPicks!,
                            })
                          }
                          className="h-8 w-8 opacity-40 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="w-4 h-4 text-[color:var(--accent)]" />
                        </Button>
                      ) : (
                        <span className="text-white/20">—</span>
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
        <div className="p-8 border-t border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-sm">
            <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(league.page - 1)}
                disabled={league.page === 1 || isPending}
                className="gap-2"
            >
                <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            
            <Typography variant="caption" weight="black" className="opacity-40">Page {league.page}</Typography>

            <Button
                variant="outline"
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
): { label: string; className: string } {
  if (!current || !previous) return { label: "—", className: "opacity-20" };
  const delta = previous - current;
  if (delta === 0) return { label: "↔", className: "opacity-20" };
  if (delta > 0) return { label: `↑${delta}`, className: "text-emerald-500" };
  return { label: `↓${Math.abs(delta)}`, className: "text-red-500" };
}
