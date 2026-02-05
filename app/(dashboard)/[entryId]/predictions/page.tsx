import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FplError } from "@/lib/fpl/client";
import { DashboardNav } from "@/components/DashboardNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CaptainPicksCard } from "@/components/CaptainPicksCard";
import { PredictedXICard } from "@/components/PredictedXICard";
import { TransferSuggestionsCard } from "@/components/TransferSuggestionsCard";
import { ChipRecommendationsCard } from "@/components/ChipRecommendationsCard";
import { DifferentialPicksCard } from "@/components/DifferentialPicksCard";
import { FixtureAnalysisCard } from "@/components/FixtureAnalysisCard";
import { DifferentialScout } from "@/components/DifferentialScout";
import { PersistLastEntry } from "@/components/PersistLastEntry";
import { loadPredictions, parseEntryId } from "@/lib/fpl/service";

type PredictionsPageParams = {
  entryId: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<PredictionsPageParams>;
}): Promise<Metadata> {
  const { entryId } = await params;
  return {
    title: `Manager ${entryId} | Predictions | Triple Captain`,
  };
}

export default async function PredictionsPage({
  params,
}: {
  params: Promise<PredictionsPageParams>;
}) {
  const { entryId } = await params;

  let parsedEntryId: number;
  try {
    parsedEntryId = parseEntryId(entryId);
  } catch {
    notFound();
  }

  let predictions;
  let errorMessage: string | null = null;

  try {
    predictions = await loadPredictions(parsedEntryId);
  } catch (error) {
    if (error instanceof FplError && error.status === 404) {
      notFound();
    }

    // Handle "no upcoming gameweek" error
    if (error instanceof Error) {
      if (error.message.includes("No upcoming gameweek")) {
        errorMessage =
          "No upcoming gameweek available. The season may have ended or predictions are only available before the next deadline.";
      } else {
        errorMessage = "Unable to load predictions. Please try again later.";
      }
    } else {
      throw error;
    }
  }

  // If we have an error, show a friendly message
  if (errorMessage || !predictions) {
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
          </header>

          <div className="tc-card rounded-3xl p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--surface-elevated)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-8 w-8 tc-text-muted"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Predictions Unavailable</h2>
            <p className="tc-text-muted max-w-md mx-auto">{errorMessage}</p>
            <Link
              href={`/${entryId}`}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-medium text-[color:var(--accent-contrast)] hover:opacity-90 transition"
            >
              View Summary
            </Link>
          </div>
        </div>
      </main>
    );
  }

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
                    <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM1.49 15.326a.78.78 0 0 1-.358-.442 3 3 0 0 1 4.308-3.516 6.484 6.484 0 0 0-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 0 1-2.07-.655ZM16.44 15.98a4.97 4.97 0 0 0 2.07-.654.78.78 0 0 0 .357-.442 3 3 0 0 0-4.308-3.517 6.484 6.484 0 0 1 1.907 3.96 2.32 2.32 0 0 1-.026.654ZM18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5.304 16.19a.844.844 0 0 1-.277-.71 5 5 0 0 1 9.947 0 .843.843 0 0 1-.277.71A6.975 6.975 0 0 1 10 18a6.974 6.974 0 0 1-4.696-1.81Z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold sm:text-3xl">
                    Gameweek {predictions.nextGameweek} Predictions
                  </h1>
                  <p className="text-sm tc-text-muted">
                    AI-powered recommendations for your squad
                  </p>
                </div>
              </div>
            </div>
            <DashboardNav
              entryId={parsedEntryId}
              active="predictions"
              currentEvent={predictions.nextGameweek}
            />
          </div>
        </header>

        {/* Disclaimer */}
        <div className="tc-card rounded-2xl p-4 border border-blue-500/30 bg-blue-500/10">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            ℹ️ {predictions.disclaimer}
          </p>
        </div>

        {/* Captain Picks */}
        <CaptainPicksCard picks={predictions.captainPicks} />

        {/* Predicted Best XI */}
        <PredictedXICard predicted={predictions.predictedXI} />

        {/* Transfer Suggestions */}
        <TransferSuggestionsCard
          suggestions={predictions.transferSuggestions}
          budgetAvailable={predictions.budgetAvailable}
        />

        {/* Chip Recommendations */}
        <ChipRecommendationsCard
          recommendations={predictions.chipRecommendations}
        />

        {/* Differential Picks */}
        <DifferentialPicksCard differentials={predictions.differentialPicks} />
        <DifferentialScout />

        {/* Fixture Analysis */}
        <FixtureAnalysisCard analysis={predictions.fixtureAnalysis} />

        <PersistLastEntry
          entryId={parsedEntryId}
          teamName={`Entry ${parsedEntryId}`}
          managerName=""
        />
      </div>
    </main>
  );
}
