"use client";

import { Wallet, TrendingUp, TrendingDown, Minus, Banknote } from "lucide-react";

type TeamValueProps = {
  teamValue: number; // Current team value
  bankBalance: number; // Money in the bank
  totalValue: number; // teamValue + bankBalance
  valueChange?: number; // Change this season
  valueHistory?: { gameweek: number; value: number }[]; // Historical data
};

export function TeamValueTracker({ 
  teamValue, 
  bankBalance, 
  totalValue,
  valueChange = 0,
  valueHistory = []
}: TeamValueProps) {
  const formatValue = (value: number) => `£${(value / 10).toFixed(1)}m`;
  
  const hasGained = valueChange > 0;
  const hasLost = valueChange < 0;
  const isUnchanged = valueChange === 0;

  // Calculate trend from history
  const trend = valueHistory.length >= 2
    ? valueHistory[valueHistory.length - 1].value - valueHistory[0].value
    : valueChange;

  const getTrendStatus = () => {
    if (totalValue >= 1050) return { label: "Elite", color: "emerald", icon: TrendingUp };
    if (totalValue >= 1020) return { label: "Great", color: "blue", icon: TrendingUp };
    if (totalValue >= 1000) return { label: "Good", color: "amber", icon: Minus };
    return { label: "Building", color: "slate", icon: TrendingDown };
  };

  const status = getTrendStatus();
  const Icon = status.icon;

  const colorClasses: Record<string, string> = {
    emerald: "from-emerald-500/20 to-green-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
    blue: "from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-600 dark:text-blue-400",
    amber: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-600 dark:text-amber-400",
    slate: "from-slate-500/20 to-slate-400/20 border-slate-500/30 text-slate-600 dark:text-slate-400",
  };

  return (
    <div className={`tc-card bg-gradient-to-br ${colorClasses[status.color]}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            <h3 className="text-sm font-black uppercase tracking-wider">
              Team Value
            </h3>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black border ${colorClasses[status.color]}`}>
            <Icon className="h-3 w-3" />
            {status.label}
          </span>
        </div>

        {/* Main Values */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Team Value */}
          <div className="rounded-lg bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Banknote className="h-3.5 w-3.5 tc-text-muted" />
              <p className="text-[10px] font-bold uppercase tracking-wider tc-text-muted">
                Squad
              </p>
            </div>
            <p className="text-2xl font-black tabular-nums">
              {formatValue(teamValue)}
            </p>
          </div>

          {/* Bank Balance */}
          <div className="rounded-lg bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Wallet className="h-3.5 w-3.5 tc-text-muted" />
              <p className="text-[10px] font-bold uppercase tracking-wider tc-text-muted">
                Bank
              </p>
            </div>
            <p className="text-2xl font-black tabular-nums">
              {formatValue(bankBalance)}
            </p>
          </div>
        </div>

        {/* Total Value */}
        <div className="rounded-lg bg-gradient-to-br from-[color:var(--accent)]/10 to-[color:var(--accent)]/5 border border-[color:var(--accent)]/20 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1">
                Total Value
              </p>
              <p className="text-3xl font-black tabular-nums text-[color:var(--accent)]">
                {formatValue(totalValue)}
              </p>
            </div>
            
            {/* Season Change */}
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider tc-text-muted mb-1">
                This Season
              </p>
              {isUnchanged ? (
                <div className="inline-flex items-center gap-1 text-slate-400">
                  <Minus className="h-4 w-4" />
                  <span className="text-sm font-black">—</span>
                </div>
              ) : (
                <div className={`inline-flex items-center gap-1 ${
                  hasGained ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {hasGained ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="text-sm font-black tabular-nums">
                    {hasGained ? '+' : ''}{formatValue(valueChange)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mini Chart */}
        {valueHistory.length > 0 && (
          <div className="rounded-lg bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider tc-text-muted mb-2">
              Value Trend
            </p>
            <div className="flex items-end justify-between gap-1 h-16">
              {valueHistory.slice(-10).map((point, idx) => {
                const maxValue = Math.max(...valueHistory.map(h => h.value));
                const minValue = Math.min(...valueHistory.map(h => h.value));
                const range = maxValue - minValue || 1;
                const height = ((point.value - minValue) / range) * 100;
                
                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-1"
                    title={`GW${point.gameweek}: ${formatValue(point.value)}`}
                  >
                    <div className="w-full bg-[color:var(--surface-root)] rounded-t-sm relative overflow-hidden">
                      <div 
                        className="w-full bg-gradient-to-t from-[color:var(--accent)] to-[color:var(--accent)]/70 rounded-t-sm transition-all"
                        style={{ height: `${Math.max(height, 10)}%` }}
                      />
                    </div>
                    <span className="text-[8px] font-bold tc-text-muted">
                      {point.gameweek}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-4 p-3 rounded-lg bg-[color:var(--surface-root)] border border-[color:var(--surface-border)]">
          <p className="text-xs tc-text-muted">
            💡 <span className="font-bold">Pro tip:</span> Aim for £105m+ total value by mid-season for optimal flexibility
          </p>
        </div>
      </div>
    </div>
  );
}
