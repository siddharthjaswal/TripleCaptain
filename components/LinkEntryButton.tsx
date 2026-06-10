"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Link2, Loader2 } from "lucide-react";

type Me = {
  authConfigured: boolean;
  user: { entryId: number | null } | null;
};

/**
 * "Make this my team" — links the FPL entry being viewed to the signed-in
 * user's profile. Hidden when signed out / auth unconfigured.
 * States: not linked → link CTA · linked to this team → ✓ chip ·
 * linked elsewhere → subtle switch CTA.
 */
export function LinkEntryButton({ entryId }: { entryId: number }) {
  const [me, setMe] = useState<Me | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  if (!me?.authConfigured || !me.user) return null;

  const linked = me.user.entryId;

  const link = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/link-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to link");
      setMe({ ...me, user: { entryId } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to link");
    } finally {
      setBusy(false);
    }
  };

  if (linked === entryId) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--brand-secondary)]/30 bg-[color:var(--brand-secondary)]/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-[color:var(--brand-secondary)]">
        <BadgeCheck className="h-3.5 w-3.5" />
        Your Team
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={link}
        disabled={busy}
        className="tc-focus-visible inline-flex items-center gap-1.5 rounded-full border border-[color:var(--accent)]/35 bg-[color:var(--accent-light)] px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-[color:var(--accent)] transition hover:brightness-110 disabled:opacity-50"
        title={
          linked
            ? "You currently have a different team linked — this will switch it"
            : "Save this FPL team to your profile"
        }
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
        {linked ? "Switch my team to this" : "Make this my team"}
      </button>
      {error && (
        <span className="text-[10px] font-bold text-[color:var(--error)]">{error}</span>
      )}
    </span>
  );
}
