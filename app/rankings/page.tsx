import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HeadToHead } from "@/components/HeadToHead";
import { PowerPicks } from "@/components/PowerPicks";
import { AccuracyBadge } from "@/components/AccuracyBadge";

export const metadata: Metadata = {
  title: "Power Rankings & Match Predictor | Triple Captain",
  description: "Deterministic Premier League team ratings and match forecasts from 7 seasons of data.",
};

// Rendered at request time (reads the DB); ratings are memoized + the query is
// a single indexed read, so this stays fast without build-time prerender.
export const dynamic = "force-dynamic";

export default async function RankingsPage() {
  const ratings = await prisma.teamRating
    .findMany({ orderBy: { elo: "desc" } })
    .catch(() => []);
  const teams = ratings.map((r) => ({ teamCode: r.teamCode, name: r.name, shortName: r.shortName }));
  const maxElo = ratings[0]?.elo ?? 1800;
  const minElo = ratings[ratings.length - 1]?.elo ?? 1300;

  return (
    <main className="tc-surface min-h-dvh px-4 pb-16 pt-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="tc-focus-visible inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition hover:bg-[color:var(--surface-hover)] tc-text-muted hover:text-[color:var(--text-primary)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <ThemeToggle />
          </div>
          <div>
            <h1 className="font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">
              Power Rankings
            </h1>
            <p className="mt-1 text-sm tc-text-muted">
              Our own Elo + attack/defence model from 7 seasons of results —
              no AI, pure data.
            </p>
          </div>
        </header>

        <AccuracyBadge />

        <HeadToHead teams={teams} />

        <PowerPicks />

        {ratings.length > 0 ? (
          <div className="tc-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[color:var(--surface-border)] text-[10px] font-black uppercase tracking-widest text-[color:var(--text-tertiary)]">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3 text-right">Elo</th>
                  <th className="hidden px-4 py-3 text-right sm:table-cell">Attack</th>
                  <th className="hidden px-4 py-3 text-right sm:table-cell">Defence</th>
                  <th className="px-4 py-3">Strength</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--surface-border)]">
                {ratings.map((t, i) => (
                  <tr key={t.teamCode} className="transition-colors hover:bg-[color:var(--surface-hover)]">
                    <td className="px-4 py-3 font-black text-[color:var(--text-tertiary)]">{i + 1}</td>
                    <td className="px-4 py-3 font-bold">{t.name}</td>
                    <td className="tc-numeric px-4 py-3 text-right font-black">{Math.round(t.elo)}</td>
                    <td className="tc-numeric hidden px-4 py-3 text-right text-[color:var(--brand-secondary)] sm:table-cell">
                      {t.attackStrength.toFixed(2)}
                    </td>
                    <td className="tc-numeric hidden px-4 py-3 text-right text-[color:var(--accent)] sm:table-cell">
                      {t.defenceStrength.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-2 w-full max-w-[120px] overflow-hidden rounded-full bg-[color:var(--surface-hover)]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(6, ((t.elo - minElo) / (maxElo - minElo || 1)) * 100)}%`,
                            background: "var(--gradient-brand)",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="tc-card p-10 text-center">
            <p className="tc-text-muted">Rankings are being computed — run the data ingest.</p>
          </div>
        )}
      </div>
    </main>
  );
}
