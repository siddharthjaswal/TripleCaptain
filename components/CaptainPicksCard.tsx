import Image from "next/image";
import type { CaptainPickDTO } from "@/lib/fpl/dto";
import { getPlayerPhotoUrl } from "@/lib/fpl/images";

type CaptainPicksCardProps = {
  picks: CaptainPickDTO[];
};

export function CaptainPicksCard({ picks }: CaptainPicksCardProps) {
  if (picks.length === 0) {
    return null;
  }

  return (
    <section className="tc-card rounded-3xl p-6 shadow-lg">
      <header className="mb-6">
        <h2 className="text-xl font-semibold">Captain Picks 👑</h2>
        <p className="tc-text-muted text-sm mt-1">
          Top 3 captain recommendations from your squad
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {picks.map((pick, index) => (
          <CaptainPickItem key={pick.playerId} pick={pick} rank={index + 1} />
        ))}
      </div>
    </section>
  );
}

type CaptainPickItemProps = {
  pick: CaptainPickDTO;
  rank: number;
};

function CaptainPickItem({ pick, rank }: CaptainPickItemProps) {
  const photoUrl = getPlayerPhotoUrl(pick.playerPhoto);
  const hasInjury =
    pick.chanceOfPlaying !== null && pick.chanceOfPlaying < 100;

  // Determine badge color based on rank
  const rankBadgeColor =
    rank === 1 ? "bg-yellow-500" : rank === 2 ? "bg-gray-400" : "bg-orange-600";

  return (
    <div className="tc-card rounded-2xl p-4 border border-[color:var(--surface-border)] hover:border-[color:var(--accent)] transition">
      <div className="flex items-start gap-3">
        {/* Rank Badge */}
        <div
          className={`flex-shrink-0 w-8 h-8 ${rankBadgeColor} rounded-full flex items-center justify-center text-white font-bold text-sm`}
        >
          {rank}
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt={pick.playerName}
                width={40}
                height={40}
                className="rounded-lg object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-800">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5 text-slate-400"
                >
                  <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {pick.playerName}
              </p>
              <p className="tc-text-muted text-xs">
                {pick.position} • {pick.team}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <p className="tc-text-muted text-xs">Expected Points</p>
              <p className="font-bold text-[color:var(--accent)]">
                {pick.expectedPoints.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="tc-text-muted text-xs">Form</p>
              <p className="font-bold">
                {pick.form >= 6 ? (
                  <span className="text-green-500">🔥 {pick.form.toFixed(1)}</span>
                ) : pick.form >= 4 ? (
                  <span>{pick.form.toFixed(1)}</span>
                ) : (
                  <span className="text-orange-500">❄️ {pick.form.toFixed(1)}</span>
                )}
              </p>
            </div>
          </div>

          {/* Fixture */}
          {pick.fixture && (
            <div className="mb-3 rounded-lg bg-[color:var(--surface-elevated)] p-2">
              <p className="tc-text-muted text-xs mb-1">Next Fixture</p>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">
                  {pick.fixture.isHome ? "vs" : "@"} {pick.fixture.opponentShort}
                </p>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full ${
                        i < pick.fixture!.difficulty
                          ? pick.fixture!.difficulty <= 2
                            ? "bg-green-500"
                            : pick.fixture!.difficulty === 3
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          : "bg-gray-300 dark:bg-gray-700"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Injury Warning */}
          {hasInjury && (
            <div className="mb-3 rounded-lg bg-orange-500/10 border border-orange-500/30 p-2">
              <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                ⚠️ {pick.chanceOfPlaying}% chance to play
              </p>
            </div>
          )}

          {/* Reasoning */}
          <div className="rounded-lg bg-[color:var(--surface-elevated)] p-2">
            <p className="text-xs tc-text-muted">{pick.reasoning}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
