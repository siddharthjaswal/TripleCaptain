"use client";

import { useState } from "react";
import Image from "next/image";
import { Sparkles, TrendingUp, Users, Home, Plane } from "lucide-react";

type CaptainSuggestion = {
  elementId: number;
  name: string;
  teamName: string;
  position: string;
  photo: string | null;
  teamCode: number | null;
  expectedPoints: number;
  ownership: number;
  form: number;
  difficulty: number; // 1-5, lower is easier
  isHome: boolean;
  opponent: string;
  reasons: string[];
};

type CaptainPickerProps = {
  suggestions: CaptainSuggestion[];
  currentCaptain?: number;
  compact?: boolean;
};

export function CaptainPicker({ suggestions, currentCaptain, compact = false }: CaptainPickerProps) {
  const [expanded, setExpanded] = useState(!compact);

  const topPick = suggestions[0];
  const alternatives = suggestions.slice(1, 3);

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return "text-cyan-500 bg-cyan-500/10";
    if (difficulty <= 3) return "text-amber-500 bg-amber-500/10";
    return "text-rose-500 bg-rose-500/10";
  };

  const getOwnershipColor = (ownership: number) => {
    if (ownership < 20) return "text-purple-500"; // Differential
    if (ownership < 50) return "text-blue-500"; // Popular
    return "text-slate-400"; // Template
  };

  if (compact && !expanded) {
    return (
      <div 
        className="tc-card p-4 cursor-pointer hover:shadow-lg transition-all"
        onClick={() => setExpanded(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-black">Captain Pick</p>
              <p className="text-xs tc-text-muted">AI suggests: {topPick.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-[color:var(--accent)]">
              {topPick.expectedPoints.toFixed(1)}
            </p>
            <p className="text-[10px] font-bold tc-text-muted">xP</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tc-card overflow-hidden">
      <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10 p-4 border-b border-[color:var(--surface-border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-black uppercase tracking-wider">
              Captain Suggestion
            </h3>
          </div>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
            AI Powered
          </span>
        </div>
      </div>

      <div className="p-4">
        {/* Top Pick */}
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-wider tc-text-muted mb-3">
            🎯 Top Pick
          </p>
          <CaptainCard player={topPick} isTopPick getDifficultyColor={getDifficultyColor} getOwnershipColor={getOwnershipColor} />
        </div>

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider tc-text-muted mb-3">
              Alternatives
            </p>
            <div className="space-y-2">
              {alternatives.map((player) => (
                <CaptainCard 
                  key={player.elementId} 
                  player={player} 
                  getDifficultyColor={getDifficultyColor}
                  getOwnershipColor={getOwnershipColor}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CaptainCard({ 
  player, 
  isTopPick = false,
  getDifficultyColor,
  getOwnershipColor 
}: { 
  player: CaptainSuggestion; 
  isTopPick?: boolean;
  getDifficultyColor: (d: number) => string;
  getOwnershipColor: (o: number) => string;
}) {
  return (
    <div className={`relative rounded-xl border p-4 transition-all ${
      isTopPick 
        ? "bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20" 
        : "bg-[color:var(--surface-elevated)] border-[color:var(--surface-border)] hover:border-[color:var(--accent)]/30"
    }`}>
      <div className="flex items-center gap-4">
        {/* Player Photo */}
        <div className="relative shrink-0">
          {player.photo && player.teamCode ? (
            <Image
              src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.photo.replace('.jpg', '')}.png`}
              alt={player.name}
              width={48}
              height={60}
              className="h-14 w-auto object-contain drop-shadow-md"
            />
          ) : (
            <div className="h-14 w-12 rounded-lg bg-[color:var(--surface-root)] flex items-center justify-center">
              <Users className="h-6 w-6 tc-text-muted" />
            </div>
          )}
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-black text-base truncate">{player.name}</p>
            {isTopPick && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-black text-amber-600 dark:text-amber-400">
                <Sparkles className="h-3 w-3" />
                BEST
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold tc-text-muted">{player.teamName}</span>
            <span className="text-xs tc-text-muted">•</span>
            <span className="text-xs font-bold">{player.position}</span>
          </div>

          {/* Fixture */}
          <div className="flex items-center gap-2 mt-2">
            {player.isHome ? (
              <Home className="h-3 w-3 text-cyan-500" />
            ) : (
              <Plane className="h-3 w-3 text-slate-400" />
            )}
            <span className="text-xs font-bold">vs {player.opponent}</span>
            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-black ${getDifficultyColor(player.difficulty)}`}>
              FDR {player.difficulty}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="shrink-0 text-right">
          <p className="text-3xl font-black text-[color:var(--accent)] leading-none">
            {player.expectedPoints.toFixed(1)}
          </p>
          <p className="text-[10px] font-bold tc-text-muted mb-2">xPoints</p>
          
          <div className="flex flex-col gap-1">
            <div className="text-xs">
              <span className={`font-black ${getOwnershipColor(player.ownership)}`}>
                {player.ownership.toFixed(1)}%
              </span>
              <span className="tc-text-muted text-[10px] ml-1">own</span>
            </div>
            <div className="text-xs">
              <span className="font-black text-blue-500">{player.form}</span>
              <span className="tc-text-muted text-[10px] ml-1">form</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reasons */}
      {player.reasons.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[color:var(--surface-border)]">
          <ul className="space-y-1">
            {player.reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs">
                <span className="text-[color:var(--accent)] mt-0.5">•</span>
                <span className="tc-text-muted">{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
