"use client";

import { z } from "zod";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const entrySchema = z.object({
  entryId: z
    .string()
    .trim()
    .min(1, "Entry ID is required")
    .regex(/^\d+$/, "Entry ID must be numeric"),
});

export function EntryIdForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [entryId, setEntryId] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = entrySchema.safeParse({ entryId: data.get("entryId") });

    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? "Invalid entry ID");
      return;
    }

    setFormError(null);
    const id = result.data.entryId;

    startTransition(() => {
      router.push(`/${id}`);
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-lg backdrop-blur"
    >
      <label htmlFor="entryId" className="text-left text-sm font-medium">
        Enter your FPL Entry ID
      </label>
      <input
        id="entryId"
        name="entryId"
        inputMode="numeric"
        pattern="\d*"
        value={entryId}
        onChange={(event) => setEntryId(event.target.value)}
        placeholder="e.g. 1234567"
        className="rounded-xl border border-slate-700/60 bg-slate-950/60 px-4 py-3 text-base text-sky-50 outline-none ring-0 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/60"
        aria-invalid={formError ? "true" : "false"}
        aria-describedby={formError ? "entryId-error" : undefined}
        disabled={isPending}
      />
      {formError ? (
        <p id="entryId-error" className="text-sm text-rose-300">
          {formError}
        </p>
      ) : null}
      <button
        type="submit"
        className="mt-2 inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending}
      >
        {isPending ? "Loading…" : "View Dashboard"}
      </button>
      <p className="text-xs text-sky-200/70">
        You can find your entry ID in the URL when viewing your team on the FPL
        website (e.g. <code>.../entry/1234567/event/</code>).
      </p>
    </form>
  );
}
