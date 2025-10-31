"use client";

import type { ChipRecommendationDTO } from "@/lib/fpl/dto";

type ChipRecommendationsCardProps = {
  recommendations: ChipRecommendationDTO[];
};

export function ChipRecommendationsCard({
  recommendations,
}: ChipRecommendationsCardProps) {
  if (recommendations.length === 0) {
    return (
      <section className="tc-card rounded-3xl p-6 shadow-lg">
        <header className="mb-6">
          <h2 className="text-xl font-semibold">Chip Strategy 🎯</h2>
          <p className="tc-text-muted text-sm mt-1">
            Timing recommendations for using your chips effectively
          </p>
        </header>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--surface-elevated)]">
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
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">All Chips Used!</h3>
          <p className="tc-text-muted max-w-md">
            You've already used all your chips this season. Great job strategizing!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="tc-card rounded-3xl p-6 shadow-lg">
      <header className="mb-8">
        <h2 className="text-xl font-semibold">Chip Strategy 🎯</h2>
        <p className="tc-text-muted text-sm mt-1">
          Timing recommendations for using your chips effectively
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {recommendations.map((rec) => (
          <ChipRecommendationItem
            key={rec.chipName}
            recommendation={rec}
          />
        ))}
      </div>
    </section>
  );
}

type ChipRecommendationItemProps = {
  recommendation: ChipRecommendationDTO;
};

function ChipRecommendationItem({
  recommendation,
}: ChipRecommendationItemProps) {
  const chipEmojis: Record<string, string> = {
    "Triple Captain": "3️⃣",
    "Bench Boost": "💪",
    "Free Hit": "🎯",
    "Wildcard": "🃏",
  };

  const isRecommended = recommendation.recommend;

  return (
    <div
      className={`flex flex-col tc-card rounded-3xl p-6 border-2 transition shadow-sm hover:shadow-md ${
        isRecommended
          ? "border-green-500/50 bg-green-500/5"
          : "border-[color:var(--surface-border)] hover:border-[color:var(--accent)]"
      }`}
    >
      {/* Chip Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${
              isRecommended
                ? "bg-green-500/20"
                : "bg-[color:var(--surface-elevated)]"
            }`}
          >
            {chipEmojis[recommendation.chipName] || "🎮"}
          </div>
          <div>
            <h3 className="font-bold text-lg text-[color:var(--text-primary)]">
              {recommendation.chipName}
            </h3>
            {recommendation.bestGameweek && (
              <p className="text-sm tc-text-muted">
                Use in GW {recommendation.bestGameweek}
              </p>
            )}
          </div>
        </div>

        <div
          className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-bold ${
            isRecommended
              ? "bg-green-500/20 text-green-700 dark:text-green-300"
              : "bg-orange-500/20 text-orange-700 dark:text-orange-300"
          }`}
        >
          {isRecommended ? "✓ Use Now" : "✗ Wait"}
        </div>
      </div>

      {/* Reasoning */}
      <div className="mb-5 rounded-2xl bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] p-4">
        <p className="text-sm tc-text-muted leading-relaxed">
          {recommendation.reasoning}
        </p>
      </div>

      {/* Potential Points */}
      {recommendation.potentialPoints !== undefined && (
        <div className="mt-auto rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-green-700 dark:text-green-300">
              Potential Points
            </span>
            <span className="text-2xl font-bold text-green-700 dark:text-green-300">
              {recommendation.potentialPoints.toFixed(1)} pts
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
