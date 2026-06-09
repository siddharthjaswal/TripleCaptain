"use client";

import Image from "next/image";
import { Calendar, Home, Plane } from "lucide-react";

type TeamFixture = {
  opponent: string;
  opponentBadge: string;
  difficulty: number; // 1-5
  isHome: boolean;
  gameweek: number;
};

type PlayerFixtures = {
  elementId: number;
  playerName: string;
  teamName: string;
  teamBadge: string;
  position: string;
  fixtures: TeamFixture[];
};

type FixtureDifficultyMatrixProps = {
  players: PlayerFixtures[];
  gameweeksAhead?: number;
};

export function FixtureDifficultyMatrix({ players, gameweeksAhead = 5 }: FixtureDifficultyMatrixProps) {
  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return "bg-cyan-500/80 border-cyan-600";
    if (difficulty === 3) return "bg-slate-400/80 border-slate-500";
    if (difficulty === 4) return "bg-orange-500/80 border-orange-600";
    return "bg-rose-500/80 border-rose-600";
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 2) return "Easy";
    if (difficulty === 3) return "Mid";
    if (difficulty === 4) return "Hard";
    return "V.Hard";
  };

  // Calculate average difficulty for each player
  const playersWithAvg = players.map(player => ({
    ...player,
    avgDifficulty: player.fixtures.reduce((sum, f) => sum + f.difficulty, 0) / player.fixtures.length,
  })).sort((a, b) => a.avgDifficulty - b.avgDifficulty); // Sort by easiest fixtures

  return (
    <div className="tc-card overflow-hidden">
      <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 p-4 border-b border-[color:var(--surface-border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <h3 className="text-sm font-black uppercase tracking-wider">
              Fixture Difficulty (Next {gameweeksAhead})
            </h3>
          </div>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
            FDR 1-5
          </span>
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr>
              <th className="text-left pb-3 pr-4 sticky left-0 bg-[color:var(--surface-elevated)] z-10">
                <span className="text-xs font-black uppercase tracking-wider tc-text-muted">
                  Player
                </span>
              </th>
              {Array.from({ length: gameweeksAhead }, (_, i) => (
                <th key={i} className="text-center pb-3 px-2">
                  <span className="text-xs font-black uppercase tracking-wider tc-text-muted">
                    GW{i + 1}
                  </span>
                </th>
              ))}
              <th className="text-center pb-3 pl-4">
                <span className="text-xs font-black uppercase tracking-wider tc-text-muted">
                  Avg
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {playersWithAvg.map((player) => (
              <tr key={player.elementId} className="border-t border-[color:var(--surface-border)]">
                {/* Player Name */}
                <td className="py-3 pr-4 sticky left-0 bg-[color:var(--surface-elevated)] z-10">
                  <div className="flex items-center gap-2 min-w-[160px]">
                    <Image
                      src={player.teamBadge}
                      alt={player.teamName}
                      width={20}
                      height={20}
                      className="h-5 w-5 object-contain"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{player.playerName}</p>
                      <p className="text-[10px] tc-text-muted">{player.position}</p>
                    </div>
                  </div>
                </td>

                {/* Fixtures */}
                {player.fixtures.slice(0, gameweeksAhead).map((fixture, idx) => (
                  <td key={idx} className="py-3 px-2">
                    <div className="flex flex-col items-center gap-1">
                      <div 
                        className={`relative rounded-lg border-2 ${getDifficultyColor(fixture.difficulty)} w-12 h-12 flex items-center justify-center overflow-hidden group`}
                        title={`${fixture.isHome ? 'H' : 'A'} vs ${fixture.opponent} (FDR ${fixture.difficulty})`}
                      >
                        <Image
                          src={fixture.opponentBadge}
                          alt={fixture.opponent}
                          width={24}
                          height={24}
                          className="h-6 w-6 object-contain opacity-90"
                        />
                        <div className="absolute top-0.5 right-0.5">
                          {fixture.isHome ? (
                            <Home className="h-2.5 w-2.5 text-[color:var(--text-primary)] drop-shadow-md" />
                          ) : (
                            <Plane className="h-2.5 w-2.5 text-[color:var(--text-primary)] drop-shadow-md" />
                          )}
                        </div>
                      </div>
                      <span className="text-[9px] font-black text-center">
                        {getDifficultyLabel(fixture.difficulty)}
                      </span>
                    </div>
                  </td>
                ))}

                {/* Fill empty cells if fewer than gameweeksAhead */}
                {Array.from({ length: Math.max(0, gameweeksAhead - player.fixtures.length) }).map((_, idx) => (
                  <td key={`empty-${idx}`} className="py-3 px-2">
                    <div className="w-12 h-12 rounded-lg bg-slate-500/10 border border-slate-500/20 flex items-center justify-center">
                      <span className="text-xs tc-text-muted">—</span>
                    </div>
                  </td>
                ))}

                {/* Average Difficulty */}
                <td className="py-3 pl-4">
                  <div className={`rounded-lg px-3 py-1.5 text-center border ${getDifficultyColor(Math.round(player.avgDifficulty))}`}>
                    <span className="text-sm font-black text-[color:var(--text-primary)]">
                      {player.avgDifficulty.toFixed(1)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="border-t border-[color:var(--surface-border)] p-4 bg-[color:var(--surface-root)]">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-cyan-500/80 border border-cyan-600" />
            <span className="text-xs font-bold">1-2 Easy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-slate-400/80 border border-slate-500" />
            <span className="text-xs font-bold">3 Mid</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-orange-500/80 border border-orange-600" />
            <span className="text-xs font-bold">4 Hard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-rose-500/80 border border-rose-600" />
            <span className="text-xs font-bold">5 V.Hard</span>
          </div>
          <span className="text-xs tc-text-muted">•</span>
          <div className="flex items-center gap-1">
            <Home className="h-3 w-3 text-cyan-500" />
            <span className="text-xs font-bold">Home</span>
          </div>
          <div className="flex items-center gap-1">
            <Plane className="h-3 w-3 text-[color:var(--text-secondary)]" />
            <span className="text-xs font-bold">Away</span>
          </div>
        </div>
      </div>
    </div>
  );
}
