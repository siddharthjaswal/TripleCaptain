"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ErrorBanner } from "@/components/ErrorBanner";

type EntryErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function EntryError({ error, reset }: EntryErrorProps) {
  const router = useRouter();

  useEffect(() => {
    console.error("Entry page error", error);
  }, [error]);

  return (
    <main className="min-h-dvh bg-slate-950 px-4 pb-16 pt-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <h1 className="text-3xl font-semibold text-slate-50">
          Something went awry
        </h1>
        <ErrorBanner message="We couldn't load this entry right now. Try again or return to the home screen." />
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:ring-sky-300"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-sky-400 hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            Go home
          </button>
        </div>
      </div>
    </main>
  );
}
