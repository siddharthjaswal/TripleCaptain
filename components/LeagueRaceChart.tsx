"use client";

import { useMemo } from "react";
import type { LeagueRaceDTO } from "@/lib/fpl/dto";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

export function LeagueRaceChart({ race }: LeagueRaceChartProps) {
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

  if (!race.entries.length || !chartData.length) {
    return null;
  }

  return (
    <section className="tc-card rounded-3xl p-6 shadow-lg">
      <header className="mb-6">
        <h2 className="text-xl font-semibold">Top 10 Race</h2>
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
            label={{ value: "Gameweek", position: "insideBottom", offset: -5 }}
            stroke="var(--text-muted)"
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          />
          <YAxis
            label={{ value: "Total Points", angle: -90, position: "insideLeft" }}
            stroke="var(--text-muted)"
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface-elevated)",
              border: "1px solid var(--surface-border)",
              borderRadius: "0.75rem",
              color: "var(--text-primary)",
            }}
            labelStyle={{
              color: "var(--text-primary)",
              fontWeight: "bold",
              marginBottom: "0.5rem",
            }}
            itemStyle={{
              color: "var(--text-primary)",
              fontSize: "0.875rem",
            }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: "1rem",
              fontSize: "0.75rem",
            }}
          />
          {race.entries.map((entry, index) => (
            <Line
              key={entry.entryId}
              type="monotone"
              dataKey={entry.entryName}
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}
