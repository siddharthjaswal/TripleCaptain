import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardNav } from "@/components/DashboardNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoutButton } from "@/components/LogoutButton";
import { PersistLastEntry } from "@/components/PersistLastEntry";
import { GameweekPitchCard } from "@/components/GameweekPitchCard";
import { DeadlineCountdown } from "@/components/DeadlineCountdown";
import { ChipStatus } from "@/components/ChipStatus";
import { PointsPace } from "@/components/PointsPace";
import { StatBar } from "@/components/StatBar";
import { loadEntrySummary, parseEntryId } from "@/lib/fpl/service";
import { ProfileCard } from "@/components/cards/ProfileCard";
import { TeamAuditor } from "@/components/TeamAuditor";
import { AccountStatus } from "@/components/AccountStatus";
import { UserMenu } from "@/components/UserMenu";
import { LinkEntryButton } from "@/components/LinkEntryButton";

type EntryPageParams = {
  entryId: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<EntryPageParams>;
}): Promise<Metadata> {
  const { entryId: entryIdRaw } = await params;

  try {
    const entryId = parseEntryId(entryIdRaw);
    const summary = await loadEntrySummary(entryId);
    return {
      title: `${summary.profile.teamName} | Triple Captain`,
      description: `Manager dashboard for ${summary.profile.managerName}'s FPL team`,
    };
  } catch {
    return {
      title: `Manager ${entryIdRaw} | Triple Captain`,
    };
  }
}

export default async function EntryPage({
  params,
}: {
  params: Promise<EntryPageParams>;
}) {
  const { entryId: entryIdRaw } = await params;
  const entryId = (() => {
    try {
      return parseEntryId(entryIdRaw);
    } catch {
      notFound();
    }
  })();

  const summary = await loadEntrySummary(entryId);
  const phase = summary.phase;

  return (
    <main className="tc-surface min-h-dvh px-4 pb-16 pt-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <LogoutButton />
            <div className="flex items-center gap-3 sm:gap-4">
              <AccountStatus entryId={entryId} />
              <UserMenu />
              <ThemeToggle />
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)] text-[color:var(--accent-contrast)] shadow-lg shadow-[color:var(--accent)]/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-6 w-6"
                >
                  <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
                </svg>
              </div>
              <div>
                <h1 className="font-display text-2xl font-black uppercase tracking-tight sm:text-3xl">
                  {summary.profile.teamName}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold tc-text-muted">
                    {summary.profile.managerName}
                  </p>
                  <LinkEntryButton entryId={summary.profile.entryId} />
                </div>
              </div>
            </div>
            <DashboardNav
              entryId={summary.profile.entryId}
              active="summary"
              currentEvent={summary.totals.currentEvent}
            />
          </div>
        </header>

        {/* Scoreboard — consolidated key metrics */}
        <StatBar totals={summary.totals} latest={summary.latest} />

        {/* Main: pitch (left) + insight rail (right) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {phase === "LIVE" && (
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[color:var(--brand-secondary)]" />
                <span className="text-xs font-black uppercase tracking-widest text-[color:var(--brand-secondary)]">
                  Matchday Live
                </span>
              </div>
            )}
            <GameweekPitchCard latest={summary.latest} />
          </div>

          <div className="flex flex-col gap-6">
            <TeamAuditor entryId={summary.profile.entryId} />
            <PointsPace
              currentPoints={summary.totals.totalPoints}
              currentGameweek={summary.totals.currentEvent}
            />
            {summary.nextDeadline && (
              <DeadlineCountdown
                deadline={summary.nextDeadline.deadline}
                gameweek={summary.nextDeadline.nextGameweek}
              />
            )}
            <ProfileCard profile={summary.profile} />
          </div>
        </div>

        {/* Chips */}
        <ChipStatus
          usedChips={summary.chips.map(
            (c) => c.name as "wildcard" | "bboost" | "3xc" | "freehit",
          )}
          compact={false}
        />

        <PersistLastEntry
          entryId={summary.profile.entryId}
          teamName={summary.profile.teamName}
          managerName={summary.profile.managerName}
        />
      </div>
    </main>
  );
}
