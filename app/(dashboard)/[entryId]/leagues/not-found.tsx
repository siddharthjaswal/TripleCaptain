import Link from "next/link";
import { ErrorBanner } from "@/components/ErrorBanner";

export default function LeaguesNotFound() {
  return (
    <main className="min-h-dvh bg-slate-950 px-4 pb-16 pt-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <h1 className="text-3xl font-semibold text-slate-50">
          Entry not found
        </h1>
        <ErrorBanner message="We couldn't find an FPL entry with that ID. Double-check the number and try again." />
        <Link
          href="/"
          className="inline-flex w-fit items-center rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:ring-sky-300"
        >
          Back to search
        </Link>
      </div>
    </main>
  );
}
