import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  BrainCircuit, 
  Map as MapIcon, 
  Trophy, 
  Calendar 
} from "lucide-react";

const links = [
  { slug: "summary", name: "Summary", isDynamic: false, icon: LayoutDashboard },
  { slug: "gameweek", name: "Gameweek", isDynamic: true, icon: Users },
  { slug: "predictions", name: "AI Insight", isDynamic: false, icon: BrainCircuit },
  { slug: "planner", name: "Planner", isDynamic: false, icon: MapIcon },
  { slug: "leagues", name: "Leagues", isDynamic: false, icon: Trophy },
  { slug: "fixtures", name: "Fixtures", isDynamic: false, icon: Calendar },
] as const;

type DashboardNavProps = {
  entryId: number;
  active: (typeof links)[number]["slug"];
  currentEvent?: number;
};

export function DashboardNav({ entryId, active, currentEvent }: DashboardNavProps) {
  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
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

      {/* Mobile Bottom Navigation */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 w-full h-20 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 flex flex-row justify-around items-center pb-4 z-[100] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex' }}
      >
        {links.map((link) => {
          const href =
            link.slug === "summary" ? `/${entryId}` : `/${entryId}/${link.slug}`;
          const isActive = link.slug === active;
          const Icon = link.icon;
          const label = link.isDynamic && currentEvent ? `GW${currentEvent}` : link.name;
          
          return (
            <Link
              key={link.slug}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full ${
                isActive 
                  ? "text-emerald-400" 
                  : "text-slate-400"
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 3 : 2} />
              <span className="text-[9px] font-bold uppercase tracking-tight">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
