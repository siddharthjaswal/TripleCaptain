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
      className="tc-card tc-focus-visible flex w-full max-w-md flex-col gap-3 rounded-2xl p-6 shadow-lg"
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
        className="rounded-xl border border-[color:var(--surface-border-strong)] bg-[color:var(--surface-input)] px-4 py-3 text-base text-[color:var(--text-primary)] outline-none transition focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]"
        aria-invalid={formError ? "true" : "false"}
        aria-describedby={formError ? "entryId-error" : undefined}
        disabled={isPending}
      />
      {formError ? (
        <p
          id="entryId-error"
          className="text-sm tc-danger"
          role="alert"
          aria-live="polite"
        >
          {formError}
        </p>
      ) : null}
      <button
        type="submit"
        className="mt-2 inline-flex items-center justify-center rounded-xl bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-[color:var(--accent-contrast)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface-root)] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending}
      >
        {isPending ? "Loading…" : "View Dashboard"}
      </button>
      <p className="text-xs tc-text-muted">
        You can find your entry ID in the URL when viewing your team on the FPL
        website (e.g. <code>.../entry/1234567/event/</code>).
      </p>
    </form>
  );
}
