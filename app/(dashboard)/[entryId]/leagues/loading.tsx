export default function LeaguesLoading() {
  return (
    <main className="tc-surface min-h-dvh px-4 pb-16 pt-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="space-y-3">
          <div className="h-3 w-24 animate-pulse rounded-full bg-[color:var(--surface-border)]/60" />
          <div className="h-9 w-64 animate-pulse rounded-full bg-[color:var(--surface-border)]/60" />
          <div className="h-4 w-48 animate-pulse rounded-full bg-[color:var(--surface-border)]/60" />
        </header>
        <section className="space-y-4">
          <div className="h-4 w-28 animate-pulse rounded-full bg-[color:var(--surface-border)]/60" />
          <div className="flex flex-wrap gap-3">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="h-10 w-32 animate-pulse rounded-full border border-[color:var(--surface-border)] bg-[color:var(--surface-elevated)]/80"
              />
            ))}
          </div>
        </section>
        <section className="rounded-3xl border border-[color:var(--surface-border)] bg-[color:var(--surface-elevated)]/80 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="h-5 w-48 animate-pulse rounded-full bg-[color:var(--surface-border)]/60" />
            <div className="h-4 w-32 animate-pulse rounded-full bg-[color:var(--surface-border)]/60" />
          </div>
          <div className="mt-6 space-y-3">
            {[...Array(6)].map((_, row) => (
              <div
                key={row}
                className="flex items-center justify-between rounded-2xl border border-[color:var(--surface-border)]/60 bg-[color:var(--surface-elevated)]/60 px-4 py-3"
              >
                <div className="h-4 w-20 animate-pulse rounded-full bg-[color:var(--surface-border)]/60" />
                <div className="h-4 w-32 animate-pulse rounded-full bg-[color:var(--surface-border)]/60" />
                <div className="h-4 w-16 animate-pulse rounded-full bg-[color:var(--surface-border)]/60" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
