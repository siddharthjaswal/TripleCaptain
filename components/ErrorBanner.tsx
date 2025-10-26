type ErrorBannerProps = {
  message: string;
};

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div className="rounded-2xl border border-rose-500/40 bg-rose-950/50 px-4 py-3 text-sm text-rose-100 shadow-md">
      <p className="font-medium uppercase tracking-wide text-rose-200">Error</p>
      <p className="mt-1 text-rose-100/90">{message}</p>
    </div>
  );
}
