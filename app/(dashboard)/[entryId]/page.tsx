import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
    <main className="min-h-dvh bg-slate-950 px-4 pb-16 pt-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-400">
              Entry Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-50">
              {summary.profile.teamName}
            </h1>
            <p className="text-sm text-slate-300">
              Managed by {summary.profile.managerName}
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-slate-700/60 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-sky-400/60 hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
          >
            Search another entry
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <ProfileCard profile={summary.profile} />
          <TotalsCard totals={summary.totals} />
        </div>
        <LatestGwCard latest={summary.latest} />
      </div>
    </main>
  );
}
