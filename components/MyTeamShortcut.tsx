"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";

type Me = {
  authConfigured: boolean;
  user: { name: string | null; entryId: number | null } | null;
};

/** Landing-page shortcut: signed-in users with a linked team jump straight in. */
export function MyTeamShortcut() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  if (!me?.user?.entryId) return null;

  return (
    <Link
      href={`/${me.user.entryId}`}
      className="tc-focus-visible group flex w-full items-center justify-between rounded-2xl border border-[color:var(--accent)]/30 bg-[color:var(--accent-light)] px-5 py-4 transition hover:brightness-110"
    >
      <span className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-[color:var(--accent)]" />
        <span className="text-left">
          <span className="block text-[10px] font-black uppercase tracking-widest text-[color:var(--text-tertiary)]">
            Welcome back{me.user.name ? `, ${me.user.name.split(" ")[0]}` : ""}
          </span>
          <span className="block text-sm font-black text-[color:var(--accent)]">
            Continue to my team
          </span>
        </span>
      </span>
      <ArrowRight className="h-5 w-5 text-[color:var(--accent)] transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
