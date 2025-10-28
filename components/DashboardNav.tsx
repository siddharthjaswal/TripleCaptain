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
            className={`rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:ring-sky-300 ${isActive ? "bg-sky-500 text-slate-950" : "border border-slate-700/60 bg-slate-900/60 text-slate-200 hover:border-sky-400/60 hover:text-sky-200"}`}
            aria-current={isActive ? "page" : undefined}
          >
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}
