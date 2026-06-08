import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardNav } from "@/components/DashboardNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoutButton } from "@/components/LogoutButton";
import { PersistLastEntry } from "@/components/PersistLastEntry";
import { GameweekPitchCard } from "@/components/GameweekPitchCard";
import { DeadlineCard } from "@/components/DeadlineCard";
import { DeadlineCountdown } from "@/components/DeadlineCountdown";
import { ChipStatus } from "@/components/ChipStatus";
import { PointsPace } from "@/components/PointsPace";
import { RankBadge } from "@/components/RankChangeIndicator";
import { loadEntrySummary, parseEntryId } from "@/lib/fpl/service";
import { ProfileCard } from "@/components/cards/ProfileCard";
import { TotalsCard } from "@/components/cards/TotalsCard";
import { LatestGwCard } from "@/components/cards/LatestGwCard";
import { TeamAuditor } from "@/components/TeamAuditor";
import { AccountStatus } from "@/components/AccountStatus";
import { Card, Typography, Button } from "@/components/ui";
import { Anchor, Sparkles } from "lucide-react";

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
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <LogoutButton />
            <div className="flex items-center gap-6">
                <AccountStatus entryId={entryId} />
                <ThemeToggle />
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
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
                  <h1 className="text-2xl font-black sm:text-3xl tracking-tight uppercase">
                    {summary.profile.teamName}
                  </h1>
                  <p className="text-sm tc-text-muted font-bold">
                    {summary.profile.managerName}
                  </p>
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

        {/* Dynamic Phase-based Top Section */}
        {phase === "LIVE" && (
            <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 px-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-widest text-cyan-500">Matchday Live: Campaign In Progress</span>
                </div>
                <GameweekPitchCard latest={summary.latest} />
            </div>
        )}

        {phase === "DEBRIEF" && (
            <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 px-2 text-[color:var(--accent)]">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-black uppercase tracking-widest">Tactical Debrief: Gaffer&apos;s Review</span>
                </div>
                <TeamAuditor entryId={summary.profile.entryId} />
            </div>
        )}

        {phase === "STRATEGY" && (
             <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2 text-[color:var(--brand-gold)]">
                        <Anchor className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-widest">Strategy Mode: Plan Your Moves</span>
                    </div>
                    <Link href={`/${entryId}/planner`} className="text-[10px] font-black uppercase tracking-widest text-[color:var(--accent)] hover:underline">Open Full Planner &rarr;</Link>
                </div>
                <Card className="p-8 bg-gradient-to-br from-[color:var(--brand-gold)]/10 to-transparent border-[color:var(--brand-gold)]/20" glass>
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1 space-y-4">
                            <Typography variant="title" weight="black">Ready for Gameweek {summary.nextDeadline?.nextGameweek}?</Typography>
                            <Typography className="text-[color:var(--text-secondary)]">The deadline is approaching! Use the Transfer Planner to simulate your moves and get my verdict before you commit.</Typography>
                            <Button asChild><Link href={`/${entryId}/planner`}>Start Planning</Link></Button>
                        </div>
                        <div className="shrink-0">
                             <div className="relative h-32 w-32 bg-[color:var(--brand-gold)]/20 rounded-full flex items-center justify-center border-4 border-[color:var(--brand-gold)]/30">
                                <Sparkles className="h-12 w-12 text-[color:var(--brand-gold)]" />
                             </div>
                        </div>
                    </div>
                </Card>
             </div>
        )}

        {/* New Quick Insights Row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Deadline Countdown */}
          {summary.nextDeadline && (
            <DeadlineCountdown 
              deadline={summary.nextDeadline.deadline}
              gameweek={summary.nextDeadline.nextGameweek}
            />
          )}

          {/* Points Pace */}
          <PointsPace 
            currentPoints={summary.totals.totalPoints}
            currentGameweek={summary.totals.currentEvent}
          />

          {/* Chip Status with real data */}
          <ChipStatus 
            usedChips={summary.chips.map(c => c.name as "wildcard" | "bboost" | "3xc" | "freehit")}
            compact={false}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <ProfileCard profile={summary.profile} />
          <TotalsCard totals={summary.totals} />
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <LatestGwCard latest={summary.latest} />
          {summary.nextDeadline && (
            <DeadlineCard deadline={summary.nextDeadline} />
          )}
        </div>

        {/* If not LIVE, show pitch further down */}
        {phase !== "LIVE" && <GameweekPitchCard latest={summary.latest} />}
        
        <PersistLastEntry
          entryId={summary.profile.entryId}
          teamName={summary.profile.teamName}
          managerName={summary.profile.managerName}
        />
      </div>
    </main>
  );
}
