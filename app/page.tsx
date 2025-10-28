import { EntryIdForm } from "@/components/EntryIdForm";
import { RecentEntryCard } from "@/components/RecentEntryCard";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <main className="tc-hero flex min-h-dvh flex-col items-center gap-12 px-6 py-16 text-[color:var(--text-primary)]">
      <div className="flex w-full max-w-4xl justify-end">
        <ThemeToggle />
      </div>
      <div className="flex max-w-2xl flex-col items-center text-center">
        <span className="tc-chip">Fantasy Premier League Companion</span>
        <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight">
          Triple Captain
        </h1>
        <p className="mt-4 text-pretty text-lg tc-text-muted">
          Track your FPL entry, monitor live gameweek totals, and follow league
          standings in a fast, server-rendered dashboard. Bootstrapping is in
          progress—check back soon for the full experience.
        </p>
      </div>
      <EntryIdForm />
      <RecentEntryCard />
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm tc-text-muted">
        <span className="tc-chip">App Router + RSC</span>
        <span className="tc-chip">Tailwind CSS</span>
        <span className="tc-chip">Zod validation</span>
        <span className="tc-chip">Vitest &amp; Playwright</span>
      </div>
    </main>
  );
}
