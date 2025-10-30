"use client";

import type { ChipRecommendationDTO } from "@/lib/fpl/dto";

type ChipRecommendationsCardProps = {
  recommendations: ChipRecommendationDTO[];
  nextGameweek: number;
};

export function ChipRecommendationsCard({
  recommendations,
  nextGameweek,
}: ChipRecommendationsCardProps) {
  if (recommendations.length === 0) {
    return null;
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
            nextGameweek={nextGameweek}
          />
        ))}
      </div>
    </section>
  );
}

type ChipRecommendationItemProps = {
  recommendation: ChipRecommendationDTO;
  nextGameweek: number;
};

function ChipRecommendationItem({
  recommendation,
  nextGameweek,
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
