"use client";

import type { FixtureAnalysisDTO, TeamFixtureRunDTO } from "@/lib/fpl/dto";

type FixtureAnalysisCardProps = {
  analysis: FixtureAnalysisDTO;
};

export function FixtureAnalysisCard({ analysis }: FixtureAnalysisCardProps) {
  return (
    <section className="tc-card rounded-3xl p-6 shadow-lg">
      <header className="mb-8">
        <h2 className="text-xl font-semibold">Fixture Analysis 📊</h2>
        <p className="tc-text-muted text-sm mt-1">
          Next {analysis.gameweeksAnalyzed} gameweeks fixture difficulty for all teams
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Best Fixtures */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20">
              <span className="text-xl">✓</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-[color:var(--text-primary)]">
                Best Fixture Runs
              </h3>
              <p className="text-xs tc-text-muted">Target these teams for transfers</p>
            </div>
          </div>

          <div className="space-y-4">
            {analysis.bestFixtureRuns.map((team) => (
              <TeamFixtureRun key={team.teamId} team={team} type="best" />
            ))}
          </div>
        </div>

        {/* Worst Fixtures */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20">
              <span className="text-xl">✗</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-[color:var(--text-primary)]">
                Worst Fixture Runs
              </h3>
              <p className="text-xs tc-text-muted">Consider transferring out</p>
            </div>
          </div>

          <div className="space-y-4">
            {analysis.worstFixtureRuns.map((team) => (
              <TeamFixtureRun key={team.teamId} team={team} type="worst" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

type TeamFixtureRunProps = {
  team: TeamFixtureRunDTO;
  type: "best" | "worst";
};

function TeamFixtureRun({ team, type }: TeamFixtureRunProps) {
  return (
    <div className="tc-card rounded-2xl p-4 border border-[color:var(--surface-border)] hover:border-[color:var(--accent)] transition">
      {/* Team Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-bold text-base text-[color:var(--text-primary)]">
            {team.teamName}
          </h4>
          <p className="text-xs tc-text-muted mt-0.5">
            Avg. Difficulty: {team.averageDifficulty.toFixed(2)}
          </p>
        </div>
        <div
          className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
            type === "best"
              ? "bg-green-500/20 text-green-700 dark:text-green-300"
              : "bg-red-500/20 text-red-700 dark:text-red-300"
          }`}
        >
          {type === "best" ? "TARGET" : "AVOID"}
        </div>
      </div>

      {/* Fixtures Grid */}
      <div className="grid grid-cols-5 gap-2">
        {team.fixtures.map((fixture, i) => (
          <div
            key={i}
            className={`rounded-lg p-2 text-center border ${
              fixture.difficulty <= 2
                ? "bg-green-500/20 border-green-500/40"
                : fixture.difficulty === 3
                  ? "bg-yellow-500/20 border-yellow-500/40"
                  : "bg-red-500/20 border-red-500/40"
            }`}
          >
            <p className="text-xs font-bold tc-text-muted mb-1">
              GW{fixture.gameweek}
            </p>
            <div className="flex items-center justify-center gap-0.5 mb-1">
              {fixture.isHome ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`w-2.5 h-2.5 ${
                    fixture.difficulty <= 2
                      ? "text-green-700 dark:text-green-300"
                      : fixture.difficulty === 3
                        ? "text-yellow-700 dark:text-yellow-300"
                        : "text-red-700 dark:text-red-300"
                  }`}
                >
                  <path
                    fillRule="evenodd"
                    d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`w-2.5 h-2.5 ${
                    fixture.difficulty <= 2
                      ? "text-green-700 dark:text-green-300"
                      : fixture.difficulty === 3
                        ? "text-yellow-700 dark:text-yellow-300"
                        : "text-red-700 dark:text-red-300"
                  }`}
                >
                  <path
                    fillRule="evenodd"
                    d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <p
                className={`text-[10px] font-bold leading-none ${
                  fixture.difficulty <= 2
                    ? "text-green-700 dark:text-green-300"
                    : fixture.difficulty === 3
                      ? "text-yellow-700 dark:text-yellow-300"
                      : "text-red-700 dark:text-red-300"
                }`}
              >
                {fixture.isHome ? "H" : "A"}
              </p>
            </div>
            <p
              className={`text-xs font-semibold ${
                fixture.difficulty <= 2
                  ? "text-green-700 dark:text-green-300"
                  : fixture.difficulty === 3
                    ? "text-yellow-700 dark:text-yellow-300"
                    : "text-red-700 dark:text-red-300"
              }`}
            >
              {fixture.opponentShort}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
