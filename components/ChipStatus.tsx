"use client";

import { Sparkles, Zap, Users, Repeat } from "lucide-react";
import { Skeleton } from "./ui/Skeleton";

type ChipType = "wildcard" | "bboost" | "3xc" | "freehit";

type ChipStatusProps = {
  usedChips?: ChipType[];
  compact?: boolean;
  isLoading?: boolean;
};

const CHIP_CONFIG = {
  wildcard: {
    name: "Wildcard",
    shortName: "WC",
    icon: Repeat,
    description: "Unlimited transfers",
  },
  bboost: {
    name: "Bench Boost",
    shortName: "BB",
    icon: Users,
    description: "Bench players score",
  },
  "3xc": {
    name: "Triple Captain",
    shortName: "TC",
    icon: Sparkles,
    description: "Captain gets 3x points",
  },
  freehit: {
    name: "Free Hit",
    shortName: "FH",
    icon: Zap,
    description: "One-week team change",
  },
} as const;

export function ChipStatus({ usedChips = [], compact = false, isLoading = false }: ChipStatusProps) {
  const chips: ChipType[] = ["wildcard", "bboost", "3xc", "freehit"];

  if (isLoading) {
    if (compact) {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          {chips.map((chip) => (
            <Skeleton key={chip} variant="rectangular" width="60px" height="32px" className="rounded-lg" />
          ))}
        </div>
      );
    }

    return (
      <div className="tc-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <Skeleton variant="text" width="40%" height="16px" />
          <Skeleton variant="text" width="30%" height="14px" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {chips.map((chip) => (
            <div key={chip} className="rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] p-4">
              <div className="flex items-center justify-between mb-2">
                <Skeleton variant="circular" width="20px" height="20px" />
              </div>
              <Skeleton variant="text" width="50%" height="14px" className="mb-2" />
              <Skeleton variant="text" width="80%" height="12px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {chips.map((chipKey) => {
          const chip = CHIP_CONFIG[chipKey];
          const isUsed = usedChips.includes(chipKey);
          const Icon = chip.icon;

          return (
            <div
              key={chipKey}
              className={`relative inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-all ${
                isUsed 
                  ? "bg-[color:var(--surface-hover)] border-[color:var(--surface-border)] text-[color:var(--text-tertiary)]" 
                  : "bg-[color:var(--accent-light)] border-[color:var(--accent)]/30 text-[color:var(--success-text)]"
              }`}
              title={`${chip.name}${isUsed ? " (Used)" : " (Available)"}`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">{chip.shortName}</span>
              {isUsed && (
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[color:var(--text-tertiary)] flex items-center justify-center">
                  <span className="text-[8px] text-[color:var(--text-primary)] font-black">✓</span>
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
        <h3 className="text-sm font-bold uppercase tracking-wide tc-text-muted">
          Chips Status
        </h3>
        <span className="text-xs font-bold text-[color:var(--accent)]">
          {Math.max(0, 4 - new Set(usedChips).size)}/4 Available
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
                isUsed
                  ? "bg-[color:var(--surface-hover)] border-[color:var(--surface-border)] text-[color:var(--text-tertiary)]"
                  : "bg-[color:var(--accent-light)] border-[color:var(--accent)]/30 text-[color:var(--success-text)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5" />
                {isUsed && (
                  <div className="h-4 w-4 rounded-full bg-[color:var(--text-tertiary)] flex items-center justify-center">
                    <span className="text-[10px] text-[color:var(--text-primary)] font-black">✓</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-bold">{chip.shortName}</p>
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
