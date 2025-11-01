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

type LeagueRaceChartProps = {
  race: LeagueRaceDTO;
};

// Generate distinct colors for the lines
const CHART_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
  "#6366f1", // indigo
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
  if (!active || !payload || !payload.length) {
    return null;
  }

  // Sort payload by value (points) in descending order
  const sortedPayload = [...payload].sort((a, b) => {
    const aValue = typeof a.value === "number" ? a.value : 0;
    const bValue = typeof b.value === "number" ? b.value : 0;
    return bValue - aValue;
  });

  return (
    <div
      className="rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-elevated)] p-3 shadow-lg"
      style={{
        backgroundColor: "var(--surface-elevated)",
      }}
    >
      <p className="mb-2 font-bold text-[color:var(--text-primary)]">
        GW{label}
      </p>
      <div className="space-y-1">
        {sortedPayload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor: entryColors.get(String(entry.name)) || entry.color,
              }}
            />
            <span className="flex-1 text-[color:var(--text-primary)]">
              {entry.name}
            </span>
            <span className="font-mono font-semibold text-[color:var(--text-primary)]">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeagueRaceChart({ race }: LeagueRaceChartProps) {
  const [visibleEntries, setVisibleEntries] = useState<Set<string>>(() => {
    return new Set(race.entries.map((entry) => entry.entryName));
  });

  const chartData = useMemo(() => {
    // Find all unique gameweeks
    const allEvents = new Set<number>();
    race.entries.forEach((entry) => {
      entry.history.forEach((h) => allEvents.add(h.event));
    });

    const sortedEvents = Array.from(allEvents).sort((a, b) => a - b);

    // Build chart data structure
    return sortedEvents.map((event) => {
      const dataPoint: Record<string, number> = { event };
      race.entries.forEach((entry) => {
        const historyItem = entry.history.find((h) => h.event === event);
        if (historyItem) {
          dataPoint[entry.entryName] = historyItem.totalPoints;
        }
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

  if (!race.entries.length || !chartData.length) {
    return null;
  }

  return (
    <section className="tc-card rounded-3xl p-6 shadow-lg">
      <header className="mb-6">
        <h2 className="text-xl font-semibold">Top 5 Race</h2>
        <p className="tc-text-muted text-sm mt-1">
          Points progression over gameweeks
        </p>
      </header>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--surface-border)"
            opacity={0.3}
          />
          <XAxis
            dataKey="event"
            label={{ value: "Gameweek", position: "insideBottom", offset: -5, fill: "var(--text-primary)" }}
            stroke="var(--text-primary)"
            tick={{ fill: "var(--text-primary)", fontSize: 12 }}
          />
          <YAxis
            label={{ value: "Total Points", angle: -90, position: "insideLeft", fill: "var(--text-primary)" }}
            stroke="var(--text-primary)"
            tick={{ fill: "var(--text-primary)", fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip entryColors={entryColors} />} />
          {race.entries.map((entry, index) => (
            <Line
              key={entry.entryId}
              type="monotone"
              dataKey={entry.entryName}
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              hide={!visibleEntries.has(entry.entryName)}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 flex flex-wrap gap-2 justify-center border-t border-[color:var(--surface-border)] pt-4">
        {race.entries.map((entry, index) => {
          const color = CHART_COLORS[index % CHART_COLORS.length];
          const isVisible = visibleEntries.has(entry.entryName);
          return (
            <button
              key={entry.entryId}
              type="button"
              onClick={() => toggleEntry(entry.entryName)}
              className={`tc-focus-visible inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                isVisible
                  ? "bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] hover:border-[color:var(--accent)]"
                  : "bg-[color:var(--surface-elevated)]/50 border border-[color:var(--surface-border)]/50 opacity-50"
              }`}
            >
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: isVisible ? color : "var(--text-muted)" }}
              />
              <span className={isVisible ? "text-[color:var(--text-primary)]" : "text-[color:var(--text-muted)] line-through"}>
                {entry.entryName}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
