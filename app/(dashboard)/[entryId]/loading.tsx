export default function EntryLoading() {
  return (
    <main className="min-h-dvh bg-slate-950 px-4 pb-16 pt-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="space-y-2">
          <div className="h-4 w-28 animate-pulse rounded-full bg-slate-800" />
          <div className="h-8 w-72 animate-pulse rounded-full bg-slate-800" />
          <div className="h-4 w-48 animate-pulse rounded-full bg-slate-800" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {["profile", "totals"].map((section) => (
            <div
              key={section}
              className="h-48 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/60"
            />
          ))}
        </div>
        <div className="h-52 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/60" />
      </div>
    </main>
  );
}
