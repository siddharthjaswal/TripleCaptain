export default function PredictionsLoading() {
  return (
    <main className="tc-surface min-h-dvh px-4 pb-16 pt-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        {/* Header Skeleton */}
        <header className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="h-10 w-32 animate-pulse rounded-lg bg-[color:var(--surface-border)]/60" />
            <div className="h-10 w-10 animate-pulse rounded-lg bg-[color:var(--surface-border)]/60" />
          </div>
          <div className="flex flex-col gap-5">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 animate-pulse rounded-xl bg-[color:var(--surface-border)]/60" />
                <div>
                  <div className="h-8 w-64 animate-pulse rounded-full bg-[color:var(--surface-border)]/60" />
                  <div className="mt-2 h-4 w-48 animate-pulse rounded-full bg-[color:var(--surface-border)]/60" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Disclaimer Skeleton */}
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
          <div className="h-4 w-full animate-pulse rounded-full bg-blue-500/20" />
        </div>

        {/* Captain Picks Skeleton */}
        <section className="tc-card rounded-3xl p-6 shadow-lg">
          <div className="mb-6">
            <div className="h-6 w-40 animate-pulse rounded-full bg-[color:var(--surface-border)]/60" />
            <div className="mt-1 h-4 w-64 animate-pulse rounded-full bg-[color:var(--surface-border)]/60" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="tc-card rounded-2xl border border-[color:var(--surface-border)] p-4"
              >
                <div className="space-y-3">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-[color:var(--surface-border)]/60" />
                  <div className="h-4 w-32 animate-pulse rounded-full bg-[color:var(--surface-border)]/60" />
                  <div className="h-12 w-full animate-pulse rounded-lg bg-[color:var(--surface-border)]/60" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Predicted XI Skeleton */}
        <section className="tc-card rounded-3xl p-6 shadow-lg">
          <div className="mb-6">
            <div className="h-6 w-48 animate-pulse rounded-full bg-[color:var(--surface-border)]/60" />
            <div className="mt-1 h-4 w-56 animate-pulse rounded-full bg-[color:var(--surface-border)]/60" />
          </div>
          <div className="space-y-4">
            <div className="h-32 w-full animate-pulse rounded-2xl bg-[color:var(--surface-border)]/60" />
            <div className="h-32 w-full animate-pulse rounded-2xl bg-[color:var(--surface-border)]/60" />
            <div className="h-32 w-full animate-pulse rounded-2xl bg-[color:var(--surface-border)]/60" />
          </div>
        </section>

        {/* Transfer Suggestions Skeleton */}
        <section className="tc-card rounded-3xl p-6 shadow-lg">
          <div className="mb-8">
            <div className="h-6 w-52 animate-pulse rounded-full bg-[color:var(--surface-border)]/60" />
            <div className="mt-1 h-4 w-64 animate-pulse rounded-full bg-[color:var(--surface-border)]/60" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="tc-card rounded-3xl border border-[color:var(--surface-border)] p-6"
              >
                <div className="h-64 w-full animate-pulse rounded-2xl bg-[color:var(--surface-border)]/60" />
              </div>
            ))}
          </div>
        </section>

        {/* Chip Recommendations Skeleton */}
        <section className="tc-card rounded-3xl p-6 shadow-lg">
          <div className="mb-8">
            <div className="h-6 w-40 animate-pulse rounded-full bg-[color:var(--surface-border)]/60" />
            <div className="mt-1 h-4 w-56 animate-pulse rounded-full bg-[color:var(--surface-border)]/60" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="tc-card rounded-3xl border border-[color:var(--surface-border)] p-6"
              >
                <div className="h-48 w-full animate-pulse rounded-2xl bg-[color:var(--surface-border)]/60" />
              </div>
            ))}
          </div>
        </section>

        {/* Differentials Skeleton */}
        <section className="tc-card rounded-3xl p-6 shadow-lg">
          <div className="mb-8">
            <div className="h-6 w-44 animate-pulse rounded-full bg-[color:var(--surface-border)]/60" />
            <div className="mt-1 h-4 w-72 animate-pulse rounded-full bg-[color:var(--surface-border)]/60" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="tc-card rounded-3xl border border-[color:var(--surface-border)] p-6"
              >
                <div className="h-72 w-full animate-pulse rounded-2xl bg-[color:var(--surface-border)]/60" />
              </div>
            ))}
          </div>
        </section>

        {/* Fixture Analysis Skeleton */}
        <section className="tc-card rounded-3xl p-6 shadow-lg">
          <div className="mb-8">
            <div className="h-6 w-44 animate-pulse rounded-full bg-[color:var(--surface-border)]/60" />
            <div className="mt-1 h-4 w-64 animate-pulse rounded-full bg-[color:var(--surface-border)]/60" />
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-32 w-full animate-pulse rounded-2xl bg-[color:var(--surface-border)]/60" />
                <div className="h-32 w-full animate-pulse rounded-2xl bg-[color:var(--surface-border)]/60" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
