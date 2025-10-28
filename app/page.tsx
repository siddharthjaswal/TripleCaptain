import { EntryIdForm } from "@/components/EntryIdForm";
import { RecentEntryCard } from "@/components/RecentEntryCard";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-12 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 px-6 py-16 text-sky-50">
      <div className="flex max-w-2xl flex-col items-center text-center">
        <span className="rounded-full border border-sky-500/40 px-4 py-1 text-sm uppercase tracking-widest text-sky-200/90">
          Fantasy Premier League Companion
        </span>
        <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight">
          Triple Captain
        </h1>
        <p className="mt-4 text-pretty text-lg text-sky-100/80">
          Track your FPL entry, monitor live gameweek totals, and follow league
          standings in a fast, server-rendered dashboard. Bootstrapping is in
          progress—check back soon for the full experience.
        </p>
      </div>
      <EntryIdForm />
      <RecentEntryCard />
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-sky-100/80">
        <span className="rounded-full border border-sky-500/40 px-3 py-1">
          App Router + RSC
        </span>
        <span className="rounded-full border border-sky-500/40 px-3 py-1">
          Tailwind CSS
        </span>
        <span className="rounded-full border border-sky-500/40 px-3 py-1">
          Zod validation
        </span>
        <span className="rounded-full border border-sky-500/40 px-3 py-1">
          Vitest &amp; Playwright
        </span>
      </div>
    </main>
  );
}
