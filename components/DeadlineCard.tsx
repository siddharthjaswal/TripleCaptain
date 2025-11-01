/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import type { GameweekDeadlineDTO } from "@/lib/fpl/dto";

type DeadlineCardProps = {
  deadline: GameweekDeadlineDTO;
};

export function DeadlineCard({ deadline }: DeadlineCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  // Check if we're on client-side (avoids hydration mismatch)
  const [isClient, setIsClient] = useState(false);

  // Mount effect to mark client-side rendering (intentional for SSR hydration)
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const deadlineDate = new Date(deadline.deadline);
      const diff = deadlineDate.getTime() - now.getTime();

      if (diff <= 0) {
        return "Deadline passed";
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
      }
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    };

    // Initial calculation
    setTimeRemaining(calculateTimeRemaining());

    // Update every minute
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 60000);

    return () => clearInterval(interval);
  }, [deadline.deadline]);

  if (!isClient) {
    // Return placeholder during SSR
    return (
      <section className="tc-card rounded-3xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide tc-text-muted">
              Next Deadline
            </p>
            <h2 className="mt-2 text-2xl font-bold">Gameweek {deadline.nextGameweek}</h2>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[color:var(--accent)]/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-7 w-7 text-[color:var(--accent)]"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-elevated)]/90 px-4 py-4">
          <p className="tc-text-muted text-xs uppercase tracking-wide">
            Calculating...
          </p>
        </div>
      </section>
    );
  }

  const isPassed = !deadline.isBeforeDeadline;
  const deadlineDate = new Date(deadline.deadline);
  const formattedDate = deadlineDate.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <section className="tc-card rounded-3xl p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide tc-text-muted">
            {isPassed ? "Gameweek In Progress" : "Next Deadline"}
          </p>
          <h2 className="mt-2 text-2xl font-bold">Gameweek {deadline.nextGameweek}</h2>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[color:var(--accent)]/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-7 w-7 text-[color:var(--accent)]"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <div className="rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-elevated)]/90 px-4 py-4">
          <p className="tc-text-muted text-xs uppercase tracking-wide">
            {isPassed ? "Matches in progress" : "Time remaining"}
          </p>
          <p className="mt-1 text-xl font-semibold">
            {isPassed ? "🔴 Live" : timeRemaining}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm tc-text-muted">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z"
              clipRule="evenodd"
            />
          </svg>
          <span>{formattedDate}</span>
        </div>
      </div>
    </section>
  );
}
