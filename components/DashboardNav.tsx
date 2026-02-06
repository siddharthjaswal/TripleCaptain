import Link from "next/link";

const links = [
  { slug: "summary", name: "Summary", isDynamic: false },
  { slug: "gameweek", name: "Gameweek", isDynamic: true },
  { slug: "predictions", name: "Predictions", isDynamic: false },
  { slug: "planner", name: "Planner", isDynamic: false },
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
    <nav className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-2 min-w-max">
        {links.map((link) => {
          const href =
            link.slug === "summary" ? `/${entryId}` : `/${entryId}/${link.slug}`;
          const isActive = link.slug === active;
          const displayName =
            link.isDynamic && currentEvent
              ? `GW ${currentEvent}`
              : link.name;
          return (
            <Link
              key={link.slug}
              href={href}
              className={`tc-focus-visible rounded-full px-5 py-2 text-sm font-bold transition-all duration-300 ${
                isActive
                  ? "bg-[color:var(--accent)] text-[color:var(--accent-contrast)] shadow-lg shadow-[color:var(--accent)]/30 scale-105"
                  : "border border-[color:var(--surface-border)] bg-[color:var(--surface-elevated)]/90 text-[color:var(--text-secondary)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] hover:bg-[color:var(--surface-root)]"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {displayName}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
