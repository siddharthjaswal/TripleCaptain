import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardNav } from "@/components/DashboardNav";
import { FixturesCard } from "@/components/FixturesCard";
import { PersistLastEntry } from "@/components/PersistLastEntry";
import { ThemeToggle } from "@/components/ThemeToggle";
import { loadFixtures, parseEntryId } from "@/lib/fpl/service";

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
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="tc-focus-visible inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-[color:var(--surface-elevated)] tc-text-muted hover:text-[color:var(--text-primary)]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
                  clipRule="evenodd"
                />
              </svg>
              Change Manager
            </Link>
            <ThemeToggle />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--accent)] text-[color:var(--accent-contrast)]">
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
                  <h1 className="text-2xl font-bold sm:text-3xl">
                    {fixturesView.teamName}
                  </h1>
                  <p className="text-sm tc-text-muted">
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
          entryId={fixturesView.entryId}
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
