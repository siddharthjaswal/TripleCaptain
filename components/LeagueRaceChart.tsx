"use client";

import { useMemo, useState } from "react";
import type { LeagueRaceDTO } from "@/lib/fpl/dto";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ValueType } from "recharts/types/component/DefaultTooltipContent";
import { Card, Typography, Badge } from "./ui";
import { TrendingUp } from "lucide-react";

type LeagueRaceChartProps = {
  race: LeagueRaceDTO;
};

// Chart colors - on-brand "Aubergine Nights" categorical palette (green-free)
const CHART_COLORS = [
  "#ff2d78", // Magenta (brand)
  "#04f5ff", // Cyan (brand)
  "#f5b932", // Gold
  "#a06cff", // Violet
  "#ff8a3d", // Amber-orange
];

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: ValueType;
    color?: string;
  }>;
  label?: string | number;
  entryColors: Map<string, string>;
};

function CustomTooltip({ active, payload, label, entryColors }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const sortedPayload = [...payload].sort((a, b) => {
    const aValue = typeof a.value === "number" ? a.value : 0;
    const bValue = typeof b.value === "number" ? b.value : 0;
    return bValue - aValue;
  });

  return (
    <Card className="p-4 border-[color:var(--surface-border)] shadow-2xl min-w-[180px]" glass hover={false}>
      <Typography variant="caption" weight="black" className="mb-3 opacity-40">Gameweek {label}</Typography>
      <div className="space-y-2">
        {sortedPayload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
                <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: entryColors.get(String(entry.name)) || entry.color }}
                />
                <Typography weight="black" className="text-[10px] uppercase truncate opacity-80">{entry.name}</Typography>
            </div>
            <Typography weight="black" className="text-xs font-mono">{entry.value}</Typography>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function LeagueRaceChart({ race }: LeagueRaceChartProps) {
  const [visibleEntries, setVisibleEntries] = useState<Set<string>>(() => {
    return new Set(race.entries.map((entry) => entry.entryName));
  });

  const chartData = useMemo(() => {
    const allEvents = new Set<number>();
    race.entries.forEach((entry) => entry.history.forEach((h) => allEvents.add(h.event)));
    const sortedEvents = Array.from(allEvents).sort((a, b) => a - b);

    return sortedEvents.map((event) => {
      const dataPoint: Record<string, number> = { event };
      race.entries.forEach((entry) => {
        const historyItem = entry.history.find((h) => h.event === event);
        if (historyItem) dataPoint[entry.entryName] = historyItem.totalPoints;
      });
      return dataPoint;
    });
  }, [race]);

  const entryColors = useMemo(() => {
    const colorMap = new Map<string, string>();
    race.entries.forEach((entry, index) => {
      colorMap.set(entry.entryName, CHART_COLORS[index % CHART_COLORS.length]);
    });
    return colorMap;
  }, [race]);

  const toggleEntry = (entryName: string) => {
    setVisibleEntries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(entryName)) {
          newSet.delete(entryName);
      } else {
          newSet.add(entryName);
      }
      return newSet;
    });
  };

  if (!race.entries.length || !chartData.length) return null;

  return (
    <Card className="p-8 space-y-8 animate-fade-in border-[color:var(--surface-border)]" glass hover={false}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[color:var(--accent)] text-white">
                <TrendingUp className="w-6 h-6" />
            </div>
            <div>
                <Typography variant="title" weight="black" className="uppercase">Title Race</Typography>
                <Typography variant="caption">Points progression of the top 5 managers</Typography>
            </div>
        </div>
        <Badge variant="secondary" className="font-black">Active Battle</Badge>
      </div>

      <div className="h-[400px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
                dataKey="event"
                stroke="rgba(255,255,255,0.2)"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 900 }}
                axisLine={false}
                tickLine={false}
                dy={10}
            />
            <YAxis
                stroke="rgba(255,255,255,0.2)"
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 900 }}
                axisLine={false}
                tickLine={false}
                dx={-10}
                domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip entryColors={entryColors} />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
            {race.entries.map((entry, index) => (
                <Line
                key={entry.entryId}
                type="monotone"
                dataKey={entry.entryName}
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
                hide={!visibleEntries.has(entry.entryName)}
                animationDuration={1500}
                />
            ))}
            </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-3 justify-center pt-6 border-t border-[color:var(--surface-border)]">
        {race.entries.map((entry, index) => {
          const color = CHART_COLORS[index % CHART_COLORS.length];
          const isVisible = visibleEntries.has(entry.entryName);
          return (
            <button
              key={entry.entryId}
              onClick={() => toggleEntry(entry.entryName)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                isVisible
                  ? "bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)] shadow-lg"
                  : "opacity-30 border border-transparent grayscale"
              }`}
              style={{ color: isVisible ? color : 'inherit' }}
            >
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              <span>{entry.entryName}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
