"use client";

import { useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { LatestGwDTO } from "@/lib/fpl/dto";
import { formatNumber } from "@/lib/format";
import { GameweekPitchCard } from "./GameweekPitchCard";

type GameweekCardProps = {
  entryId: number;
  gameweek: LatestGwDTO;
};

export function GameweekCard({ entryId: _entryId, gameweek }: GameweekCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleGameweekChange = (newEvent: number) => {
    startTransition(() => {
      router.push(`${pathname}?event=${newEvent}`);
    });
  };

  return (
    <div className="space-y-6 relative">
      <section className="tc-card rounded-3xl p-6 shadow-lg relative">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Gameweek {gameweek.event}</h2>
            <p className="tc-text-muted text-sm mt-1">
              {gameweek.isLive ? "Live" : gameweek.isFinished ? "Finished" : "Upcoming"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleGameweekChange(gameweek.event - 1)}
              disabled={gameweek.event === 1 || isPending}
              className="tc-focus-visible inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-[color:var(--surface-elevated)]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                  clipRule="evenodd"
                />
              </svg>
              Previous
            </button>
            <button
              type="button"
              onClick={() => handleGameweekChange(gameweek.event + 1)}
              disabled={gameweek.event >= 38 || isPending}
              className="tc-focus-visible inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-[color:var(--surface-elevated)]"
            >
              Next
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Metric label="GW Points" value={formatNumber(gameweek.points)} />
          <Metric
            label="GW Rank"
            value={gameweek.rank ? `#${formatNumber(gameweek.rank)}` : "—"}
          />
          <Metric
            label="Bench Points"
            value={formatNumber(gameweek.pointsOnBench)}
          />
        </div>

        {gameweek.chipUsed && (
          <div className="mt-6 text-sm tc-text-muted">
            <p>
              Chip played:{" "}
              <span className="font-semibold uppercase tracking-wide text-[var(--accent)]">
                {gameweek.chipUsed.replace(/_/g, " ")}
              </span>
            </p>
          </div>
        )}

        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-[color:var(--surface-root)]/60 backdrop-blur-sm rounded-3xl">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[color:var(--surface-border)] border-t-[color:var(--accent)]" />
              <p className="text-sm font-medium">Loading...</p>
            </div>
          </div>
        )}
      </section>

      <GameweekPitchCard latest={gameweek} />
    </div>
  );
}

type MetricProps = {
  label: string;
  value: string;
};

function Metric({ label, value }: MetricProps) {
  return (
    <div className="rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-elevated)]/90 px-4 py-5">
      <p className="tc-text-muted text-xs uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
