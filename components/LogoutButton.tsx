"use client";

import Link from "next/link";
import { LAST_ENTRY_STORAGE_KEY } from "@/lib/storage";

export function LogoutButton() {
  const handleLogout = () => {
    try {
      window.localStorage.removeItem(LAST_ENTRY_STORAGE_KEY);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Unable to clear entry storage", error);
      }
    }
  };

  return (
    <Link
      href="/"
      onClick={handleLogout}
      className="tc-focus-visible inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-[color:var(--surface-elevated)] tc-text-muted hover:text-[color:var(--text-primary)]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4"
      >
        <path
          fillRule="evenodd"
          d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
          clipRule="evenodd"
        />
      </svg>
      Change Manager
    </Link>
  );
}
