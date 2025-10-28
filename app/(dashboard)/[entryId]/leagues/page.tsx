import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FplError } from "@/lib/fpl/client";
import { DashboardNav } from "@/components/DashboardNav";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LeagueSwitcher } from "@/components/LeagueSwitcher";
import { LeagueTable } from "@/components/LeagueTable";
import { PersistLastEntry } from "@/components/PersistLastEntry";
import { ThemeToggle } from "@/components/ThemeToggle";
import { loadEntryLeagues, parseEntryId } from "@/lib/fpl/service";

type LeaguesPageParams = {
  entryId: string;
};

type LeaguesSearchParams = {
  leagueId?: string;
  page?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<LeaguesPageParams>;
}): Promise<Metadata> {
  const { entryId } = await params;
  try {
    const parsedEntryId = parseEntryId(entryId);
    const leagues = await loadEntryLeagues(parsedEntryId);
    return {
      title: `${leagues.teamName} | League Standings | Triple Captain`,
    };
  } catch {
    return {
      title: `Entry ${entryId} | League Standings | Triple Captain`,
    };
  }
}

export default async function EntryLeaguesPage({
  params,
  searchParams,
}: {
  params: Promise<LeaguesPageParams>;
  searchParams?: Promise<LeaguesSearchParams>;
}) {
  const { entryId } = await params;
  const resolvedSearch = (await searchParams) ?? {};

  let parsedEntryId: number;
  try {
    parsedEntryId = parseEntryId(entryId);
  } catch {
    notFound();
  }

  let leaguesView;
  try {
    leaguesView = await loadEntryLeagues(parsedEntryId, {
      leagueId: resolvedSearch.leagueId ?? null,
      page: resolvedSearch.page ?? null,
    });
  } catch (error) {
    if (error instanceof FplError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <main className="tc-surface min-h-dvh px-4 pb-16 pt-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide tc-text-muted">
              Entry Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              {leaguesView.teamName}
            </h1>
            <p className="text-sm tc-text-muted">
              Managed by {leaguesView.managerName}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ThemeToggle />
            <DashboardNav entryId={leaguesView.entryId} active="leagues" />
            <Link
              href="/"
              className="tc-focus-visible inline-flex items-center rounded-full border border-[color:var(--surface-border)] px-4 py-2 text-sm font-medium transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
            >
              Search another entry
            </Link>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-base font-semibold">Classic Leagues</h2>
          {leaguesView.currentEvent ? (
            <p className="text-xs tc-text-muted">
              Showing standings for gameweek {leaguesView.currentEvent}
            </p>
          ) : null}
          <LeagueSwitcher
            entryId={leaguesView.entryId}
            leagues={leaguesView.leagues}
            selectedLeagueId={leaguesView.selectedLeagueId}
          />
        </section>

        {leaguesView.selectedLeague ? (
          <LeagueTable league={leaguesView.selectedLeague} />
        ) : leaguesView.leagues.length > 0 ? (
          <ErrorBanner message="We couldn't load standings for this league right now. Try another league or refresh." />
        ) : null}
        <PersistLastEntry
          entryId={leaguesView.entryId}
          teamName={leaguesView.teamName}
          managerName={leaguesView.managerName}
        />
      </div>
    </main>
  );
}
