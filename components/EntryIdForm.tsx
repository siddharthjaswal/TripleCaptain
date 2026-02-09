"use client";

import { z } from "zod";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Typography } from "./ui";
import { Search } from "lucide-react";

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
    const result = entrySchema.safeParse({ entryId });

    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? "Invalid entry ID");
      return;
    }

    setFormError(null);
    const id = result.data.entryId;

    startTransition(() => {
      // Use replace so back button quits app instead of returning to login
      router.replace(`/${id}`);
    });
  };

  return (
    <Card className="w-full max-w-md p-1 group overflow-visible" hover={false}>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 p-8"
      >
        <div className="space-y-2">
            <Typography variant="title" weight="black" className="text-center">Welcome Manager</Typography>
            <Typography variant="caption" className="text-center">Enter your FPL ID to begin the voyage</Typography>
        </div>

        <div className="space-y-4">
            <div className="relative group">
                {!entryId && (
                    <Search className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--text-tertiary)] opacity-60 pointer-events-none" />
                )}
                <input
                    id="entryId"
                    name="entryId"
                    inputMode="numeric"
                    pattern="\d*"
                    value={entryId}
                    onChange={(event) => setEntryId(event.target.value)}
                    placeholder="e.g. 1234567"
                    className={`tc-input h-14 text-lg font-bold tracking-widest placeholder:tracking-tight placeholder:font-normal transition-all duration-300 ${!entryId ? 'pr-14 pl-6' : 'px-6 text-center'}`}
                    aria-invalid={formError ? "true" : "false"}
                    disabled={isPending}
                />
            </div>
            
            {formError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                    <Typography className="text-xs font-bold text-red-500">{formError}</Typography>
                </div>
            )}

            <Button
                type="submit"
                size="lg"
                className="w-full h-14 text-lg uppercase"
                loading={isPending}
            >
                View Dashboard
            </Button>
        </div>

        <div className="pt-4 border-t border-[color:var(--surface-border)] border-dashed">
             <Typography className="text-[10px] text-center text-[color:var(--text-tertiary)] leading-relaxed">
                Find your ID in the URL on the FPL website:<br/>
                <code className="text-[color:var(--text-secondary)] font-mono">.../entry/1234567/event/</code>
            </Typography>
        </div>
      </form>
    </Card>
  );
}
