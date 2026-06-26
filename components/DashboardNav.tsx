import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  BrainCircuit,
  Map as MapIcon,
  Trophy,
  Calendar,
  Bell
} from "lucide-react";

const links = [
  { slug: "summary", name: "Summary", isDynamic: false, icon: LayoutDashboard },
  { slug: "gameweek", name: "Gameweek", isDynamic: true, icon: Users },
  { slug: "predictions", name: "AI Insight", isDynamic: false, icon: BrainCircuit },
  { slug: "planner", name: "Planner", isDynamic: false, icon: MapIcon },
  { slug: "leagues", name: "Leagues", isDynamic: false, icon: Trophy },
  { slug: "fixtures", name: "Fixtures", isDynamic: false, icon: Calendar },
  { slug: "alerts", name: "Alerts", isDynamic: false, icon: Bell },
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
                    ? "bg-[color:var(--accent-light)] text-[color:var(--accent)] border border-[color:var(--accent)]/35"
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

      {/* Apple-Style Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] pointer-events-none">
        {/* Glass container with Apple-style blur */}
        <div className="absolute bottom-0 left-0 right-0 h-[92px] pointer-events-auto">
          {/* Ultra-thin frosted glass background - Apple's signature effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/70 to-white/60 dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-900/85" 
               style={{
                 backdropFilter: 'saturate(180%) blur(20px)',
                 WebkitBackdropFilter: 'saturate(180%) blur(20px)',
               }}
          />
          
          {/* Top border with gradient - Apple's subtle detail */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent dark:via-slate-700/40" />
          
          {/* Navigation container */}
          <div className="relative h-full flex items-start pt-2 pb-safe">
            <div className="w-full flex justify-around items-center px-2">
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
                    className="relative flex flex-col items-center justify-center gap-[3px] py-2 px-3 min-w-[56px] group touch-manipulation"
                  >
                    {/* Active indicator pill - Apple style */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-2xl bg-[color:var(--accent)]/10 dark:bg-[color:var(--accent)]/15 scale-100 transition-all duration-300" />
                    )}
                    
                    {/* Icon container with scale animation */}
                    <div className={`relative transition-all duration-300 ${
                      isActive ? 'scale-100' : 'scale-95 group-active:scale-90'
                    }`}>
                      <Icon 
                        size={24} 
                        strokeWidth={isActive ? 2.5 : 2}
                        className={`transition-all duration-300 ${
                          isActive 
                            ? 'text-[color:var(--accent)] drop-shadow-[0_0_8px_var(--accent)]' 
                            : 'text-[color:var(--text-secondary)] dark:text-[color:var(--text-secondary)] group-active:text-[color:var(--text-secondary)] dark:group-active:text-[color:var(--text-secondary)]'
                        }`}
                      />
                    </div>
                    
                    {/* Label with Apple's typography */}
                    <span className={`text-[10px] font-semibold leading-none transition-all duration-300 ${
                      isActive 
                        ? 'text-[color:var(--accent)]' 
                        : 'text-[color:var(--text-secondary)] dark:text-[color:var(--text-secondary)]'
                    }`}>
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
          
          {/* Bottom safe area for modern iPhones */}
          <div className="absolute bottom-0 left-0 right-0 h-safe bg-gradient-to-t from-white/90 to-transparent dark:from-slate-900/95 dark:to-transparent" />
        </div>
      </nav>
    </>
  );
}
