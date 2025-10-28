import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FplError } from "@/lib/fpl/client";
import { DashboardNav } from "@/components/DashboardNav";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LeagueSwitcher } from "@/components/LeagueSwitcher";
import { LeagueTable } from "@/components/LeagueTable";
import { PersistLastEntry } from "@/components/PersistLastEntry";
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
    <main className="min-h-dvh bg-slate-950 px-4 pb-16 pt-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-400">
              Entry Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-50">
              {leaguesView.teamName}
            </h1>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <DashboardNav entryId={leaguesView.entryId} active="leagues" />
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-slate-700/60 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-sky-400/60 hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
            >
              Search another entry
            </Link>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-base font-semibold text-slate-200">
            Classic Leagues
          </h2>
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
