import Link from "next/link";

const links = [
  { slug: "summary", name: "Summary", isDynamic: false },
  { slug: "gameweek", name: "Gameweek", isDynamic: true },
  { slug: "predictions", name: "Predictions", isDynamic: false },
  { slug: "leagues", name: "Leagues", isDynamic: false },
  { slug: "fixtures", name: "Fixtures", isDynamic: false },
] as const;

type DashboardNavProps = {
  entryId: number;
  active: (typeof links)[number]["slug"];
  currentEvent?: number;
};

export function DashboardNav({ entryId, active, currentEvent }: DashboardNavProps) {
  return (
    <nav className="flex gap-2">
      {links.map((link) => {
        const href =
          link.slug === "summary" ? `/${entryId}` : `/${entryId}/${link.slug}`;
        const isActive = link.slug === active;
        const displayName =
          link.isDynamic && currentEvent
            ? `Gameweek ${currentEvent}`
            : link.name;
        return (
          <Link
            key={link.slug}
            href={href}
            className={`tc-focus-visible rounded-full px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-[color:var(--accent)] text-[color:var(--accent-contrast)]"
                : "border border-[color:var(--surface-border)] bg-[color:var(--surface-elevated)]/90 text-[color:var(--text-primary)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {displayName}
          </Link>
        );
      })}
    </nav>
  );
}
