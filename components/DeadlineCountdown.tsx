"use client";

import { useEffect, useState } from "react";
import { Clock, AlertCircle } from "lucide-react";

type DeadlineCountdownProps = {
  deadline: string; // ISO timestamp
  gameweek: number;
  compact?: boolean;
};

export function DeadlineCountdown({ deadline, gameweek, compact = false }: DeadlineCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isUrgent: boolean;
    isPassed: boolean;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const diff = deadlineTime - now;

      if (diff <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isUrgent: false,
          isPassed: true,
        };
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return {
        days,
        hours,
        minutes,
        seconds,
        isUrgent: diff < 24 * 60 * 60 * 1000, // Less than 24 hours
        isPassed: false,
      };
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  if (!timeLeft) {
    return null;
  }

  if (timeLeft.isPassed) {
    return (
      <div className="tc-card bg-slate-500/10 border-slate-500/20 p-4">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-slate-400" />
          <div>
            <p className="text-sm font-black">Gameweek {gameweek}</p>
            <p className="text-xs font-medium text-slate-400">Deadline passed</p>
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition-all ${
          timeLeft.isUrgent
            ? "bg-gradient-to-r from-rose-500/20 to-orange-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 animate-pulse"
            : "bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400"
        }`}
      >
        <Clock className="h-4 w-4" />
        {timeLeft.days > 0 ? (
          <span>{timeLeft.days}d {timeLeft.hours}h</span>
        ) : (
          <span className="tabular-nums">
            {String(timeLeft.hours).padStart(2, "0")}:
            {String(timeLeft.minutes).padStart(2, "0")}:
            {String(timeLeft.seconds).padStart(2, "0")}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`tc-card overflow-hidden transition-all ${
        timeLeft.isUrgent
          ? "bg-gradient-to-br from-rose-500/10 via-orange-500/10 to-amber-500/10 border-rose-500/30"
          : "bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20"
      }`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {timeLeft.isUrgent ? (
              <AlertCircle className="h-5 w-5 text-rose-500 animate-pulse" />
            ) : (
              <Clock className="h-5 w-5 text-blue-500" />
            )}
            <h3 className="text-sm font-black uppercase tracking-wider">
              {timeLeft.isUrgent ? "Deadline Alert!" : `GW${gameweek} Deadline`}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Days", value: timeLeft.days },
            { label: "Hours", value: timeLeft.hours },
            { label: "Mins", value: timeLeft.minutes },
            { label: "Secs", value: timeLeft.seconds },
          ].map((unit) => (
            <div
              key={unit.label}
              className="flex flex-col items-center gap-1 rounded-lg bg-[color:var(--surface-elevated)] p-2 border border-[color:var(--surface-border)]"
            >
              <span className="text-2xl font-black tabular-nums">
                {String(unit.value).padStart(2, "0")}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider tc-text-muted">
                {unit.label}
              </span>
            </div>
          ))}
        </div>

        {timeLeft.isUrgent && (
          <div className="mt-3 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400 text-center">
              ⚠️ Less than 24 hours remaining!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
