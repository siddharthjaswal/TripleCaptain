"use client";

import { useState } from "react";
import { Swords, Loader2 } from "lucide-react";

type Team = { teamCode: number; name: string; shortName: string };
type Forecast = {
  xHome: number;
  xAway: number;
  pHome: number;
  pDraw: number;
  pAway: number;
  bttsPct: number;
  homeCsPct: number;
  awayCsPct: number;
  topScores: Array<{ score: string; pct: number }>;
};

/** Interactive team-vs-team predictor powered by the offline Poisson engine. */
export function HeadToHead({ teams }: { teams: Team[] }) {
  const sorted = [...teams].sort((a, b) => a.name.localeCompare(b.name));
  const [home, setHome] = useState(sorted[0]?.teamCode ?? 0);
  const [away, setAway] = useState(sorted[1]?.teamCode ?? 0);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (home === away) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/predict?home=${home}&away=${away}`);
      const data = await res.json();
      setForecast(res.ok ? data.forecast : null);
    } finally {
      setBusy(false);
    }
  };

  const name = (code: number) => teams.find((t) => t.teamCode === code)?.shortName ?? "?";

  return (
    <div className="tc-card tc-card-feature p-6">
      <div className="mb-5 flex items-center gap-2">
        <Swords className="h-5 w-5 text-[color:var(--accent)]" />
        <h2 className="font-display text-xl font-black uppercase tracking-tight">
          Match Predictor
        </h2>
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <TeamSelect label="Home" value={home} onChange={setHome} teams={sorted} />
        <span className="text-center text-xs font-black uppercase tracking-widest text-[color:var(--text-tertiary)]">
          vs
        </span>
        <TeamSelect label="Away" value={away} onChange={setAway} teams={sorted} />
        <button
          type="button"
          onClick={run}
          disabled={busy || home === away}
          className="tc-button tc-button-primary shrink-0 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Predict"}
        </button>
      </div>

      {forecast && (
        <div className="mt-6 space-y-5 animate-fade-in">
          {/* Win/draw/loss bar */}
          <div>
            <div className="mb-1.5 flex justify-between text-[11px] font-black uppercase tracking-wider">
              <span className="text-[color:var(--brand-secondary)]">{name(home)} {forecast.pHome}%</span>
              <span className="text-[color:var(--text-tertiary)]">Draw {forecast.pDraw}%</span>
              <span className="text-[color:var(--accent)]">{name(away)} {forecast.pAway}%</span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full">
              <div style={{ width: `${forecast.pHome}%` }} className="bg-[color:var(--brand-secondary)]" />
              <div style={{ width: `${forecast.pDraw}%` }} className="bg-[color:var(--surface-hover)]" />
              <div style={{ width: `${forecast.pAway}%` }} className="bg-[color:var(--accent)]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Expected goals" value={`${forecast.xHome} – ${forecast.xAway}`} />
            <Stat label="Likely score" value={`${forecast.topScores[0].score} (${forecast.topScores[0].pct}%)`} />
            <Stat label="Both to score" value={`${forecast.bttsPct}%`} />
            <Stat label="Clean sheet" value={`${name(home)} ${forecast.homeCsPct}%`} />
          </div>

          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[color:var(--text-tertiary)]">
              Most likely scorelines
            </p>
            <div className="flex flex-wrap gap-2">
              {forecast.topScores.map((s) => (
                <span
                  key={s.score}
                  className="tc-numeric rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-hover)] px-3 py-1.5 text-sm font-black"
                >
                  {s.score} <span className="text-[color:var(--text-tertiary)]">{s.pct}%</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TeamSelect({
  label,
  value,
  onChange,
  teams,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  teams: Team[];
}) {
  return (
    <label className="flex-1">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="tc-input w-full font-bold"
      >
        {teams.map((t) => (
          <option key={t.teamCode} value={t.teamCode}>
            {t.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-elevated)] p-3 text-center">
      <p className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-tertiary)]">
        {label}
      </p>
      <p className="tc-numeric mt-1 text-sm font-black">{value}</p>
    </div>
  );
}
