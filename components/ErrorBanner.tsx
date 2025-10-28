type ErrorBannerProps = {
  message: string;
};

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-[color:var(--text-danger)]/40 bg-[color:var(--text-danger)]/10 px-4 py-3 text-sm shadow-md"
    >
      <p className="tc-danger font-medium uppercase tracking-wide">Error</p>
      <p className="mt-1 tc-text-muted">{message}</p>
    </div>
  );
}
