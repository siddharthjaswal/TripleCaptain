import Link from "next/link";

const links = [
  { slug: "summary", name: "Summary" },
  { slug: "leagues", name: "Leagues" },
] as const;

type DashboardNavProps = {
  entryId: number;
  active: (typeof links)[number]["slug"];
};

export function DashboardNav({ entryId, active }: DashboardNavProps) {
  return (
    <nav className="flex gap-2">
      {links.map((link) => {
        const href =
          link.slug === "summary" ? `/${entryId}` : `/${entryId}/${link.slug}`;
        const isActive = link.slug === active;
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
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}
