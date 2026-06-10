import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardNav } from "@/components/DashboardNav";
import { FixturesCard } from "@/components/FixturesCard";
import { PersistLastEntry } from "@/components/PersistLastEntry";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoutButton } from "@/components/LogoutButton";
import { loadFixtures, parseEntryId } from "@/lib/fpl/service";
import { Calendar } from "lucide-react";

type FixturesPageParams = {
  entryId: string;
};

type FixturesSearchParams = {
  event?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<FixturesPageParams>;
}): Promise<Metadata> {
  const { entryId } = await params;
  try {
    const parsedEntryId = parseEntryId(entryId);
    const fixtures = await loadFixtures(parsedEntryId);
    return {
      title: `${fixtures.teamName} | Fixtures | Triple Captain`,
    };
  } catch {
    return {
      title: `Manager ${entryId} | Fixtures | Triple Captain`,
    };
  }
}

export default async function EntryFixturesPage({
  params,
  searchParams,
}: {
  params: Promise<FixturesPageParams>;
  searchParams?: Promise<FixturesSearchParams>;
}) {
  const { entryId } = await params;
  const resolvedSearch = (await searchParams) ?? {};

  let parsedEntryId: number;
  try {
    parsedEntryId = parseEntryId(entryId);
  } catch {
    notFound();
  }

  const fixturesView = await loadFixtures(parsedEntryId, {
    event: resolvedSearch.event ?? null,
  });

  return (
    <main className="tc-surface min-h-dvh px-4 pb-16 pt-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <LogoutButton />
            <ThemeToggle />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[color:var(--accent)] to-[color:var(--accent)]/80 shadow-lg shadow-[color:var(--accent)]/20">
                  <Calendar className="h-7 w-7 text-[color:var(--accent-contrast)]" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-black uppercase tracking-tight sm:text-3xl">
                    {fixturesView.teamName}
                  </h1>
                  <p className="text-sm tc-text-muted font-medium">
                    {fixturesView.managerName}
                  </p>
                </div>
              </div>
            </div>
            <DashboardNav
              entryId={fixturesView.entryId}
              active="fixtures"
              currentEvent={fixturesView.currentEvent}
            />
          </div>
        </header>

        <FixturesCard
          event={fixturesView.event}
          fixtures={fixturesView.fixtures}
          playersByFixture={fixturesView.playersByFixture}
        />

        <PersistLastEntry
          entryId={fixturesView.entryId}
          teamName={fixturesView.teamName}
          managerName={fixturesView.managerName}
        />
      </div>
    </main>
  );
}
