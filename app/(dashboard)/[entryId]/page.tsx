import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardNav } from "@/components/DashboardNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PersistLastEntry } from "@/components/PersistLastEntry";
import { GameweekPitchCard } from "@/components/GameweekPitchCard";
import { loadEntrySummary, parseEntryId } from "@/lib/fpl/service";
import { ProfileCard } from "@/components/cards/ProfileCard";
import { TotalsCard } from "@/components/cards/TotalsCard";
import { LatestGwCard } from "@/components/cards/LatestGwCard";

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
      description: `Summary dashboard for FPL entry ${entryId}`,
    };
  } catch {
    return {
      title: `Entry ${entryIdRaw} | Triple Captain`,
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

  return (
    <main className="tc-surface min-h-dvh px-4 pb-16 pt-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide tc-text-muted">
              Entry Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              {summary.profile.teamName}
            </h1>
            <p className="text-sm tc-text-muted">
              Managed by {summary.profile.managerName}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ThemeToggle />
            <DashboardNav entryId={summary.profile.entryId} active="summary" />
            <Link
              href="/"
              className="tc-focus-visible inline-flex items-center rounded-full border border-[color:var(--surface-border)] px-4 py-2 text-sm font-medium transition hover:border-[color:var(--accent)] hover:text-[var(--accent)]"
            >
              Search another entry
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <ProfileCard profile={summary.profile} />
          <TotalsCard totals={summary.totals} />
        </div>
        <LatestGwCard latest={summary.latest} />
        <GameweekPitchCard latest={summary.latest} />
        <PersistLastEntry
          entryId={summary.profile.entryId}
          teamName={summary.profile.teamName}
          managerName={summary.profile.managerName}
        />
      </div>
    </main>
  );
}
