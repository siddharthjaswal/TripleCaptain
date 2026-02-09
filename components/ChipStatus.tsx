"use client";

import { Sparkles, Zap, Users, Repeat } from "lucide-react";

type ChipType = "wildcard" | "bboost" | "3xc" | "freehit";

type ChipStatusProps = {
  usedChips?: ChipType[];
  compact?: boolean;
};

const CHIP_CONFIG = {
  wildcard: {
    name: "Wildcard",
    shortName: "WC",
    icon: Repeat,
    color: "purple",
    description: "Unlimited transfers",
  },
  bboost: {
    name: "Bench Boost",
    shortName: "BB",
    icon: Users,
    color: "blue",
    description: "Bench players score",
  },
  "3xc": {
    name: "Triple Captain",
    shortName: "TC",
    icon: Sparkles,
    color: "amber",
    description: "Captain gets 3x points",
  },
  freehit: {
    name: "Free Hit",
    shortName: "FH",
    icon: Zap,
    color: "green",
    description: "One-week team change",
  },
} as const;

const colorClasses = {
  purple: "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400",
  blue: "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
  amber: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
  green: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
};

const usedClasses = {
  purple: "bg-slate-500/5 border-slate-500/20 text-slate-400",
  blue: "bg-slate-500/5 border-slate-500/20 text-slate-400",
  amber: "bg-slate-500/5 border-slate-500/20 text-slate-400",
  green: "bg-slate-500/5 border-slate-500/20 text-slate-400",
};

export function ChipStatus({ usedChips = [], compact = false }: ChipStatusProps) {
  const chips: ChipType[] = ["wildcard", "bboost", "3xc", "freehit"];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {chips.map((chipKey) => {
          const chip = CHIP_CONFIG[chipKey];
          const isUsed = usedChips.includes(chipKey);
          const Icon = chip.icon;

          return (
            <div
              key={chipKey}
              className={`relative inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-all ${
                isUsed ? usedClasses[chip.color] : colorClasses[chip.color]
              }`}
              title={`${chip.name}${isUsed ? " (Used)" : " (Available)"}`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="text-xs font-black">{chip.shortName}</span>
              {isUsed && (
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-slate-400 flex items-center justify-center">
                  <span className="text-[8px] text-white font-black">✓</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="tc-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black uppercase tracking-wider tc-text-muted">
          Chips Status
        </h3>
        <span className="text-xs font-bold text-[color:var(--accent)]">
          {4 - usedChips.length}/4 Available
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {chips.map((chipKey) => {
          const chip = CHIP_CONFIG[chipKey];
          const isUsed = usedChips.includes(chipKey);
          const Icon = chip.icon;

          return (
            <div
              key={chipKey}
              className={`relative flex flex-col gap-2 rounded-xl border p-3 transition-all ${
                isUsed ? usedClasses[chip.color] : colorClasses[chip.color]
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5" />
                {isUsed && (
                  <div className="h-4 w-4 rounded-full bg-slate-400 flex items-center justify-center">
                    <span className="text-[10px] text-white font-black">✓</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-black">{chip.shortName}</p>
                <p className="text-[10px] font-medium opacity-70">
                  {chip.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
