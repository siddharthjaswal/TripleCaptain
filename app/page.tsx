import { EntryIdForm } from "@/components/EntryIdForm";
import { RecentEntryCard } from "@/components/RecentEntryCard";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <main className="tc-hero flex min-h-dvh flex-col items-center px-6 py-12 text-[color:var(--text-primary)]">
      {/* Header */}
      <div className="flex w-full max-w-6xl justify-end mb-8">
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <div className="flex max-w-4xl flex-col items-center text-center mb-16">
        <span className="tc-chip mb-6">Fantasy Premier League Companion</span>
        <h1 className="text-balance text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--text-primary)] bg-clip-text text-transparent">
          Triple Captain
        </h1>
        <p className="text-pretty text-xl tc-text-muted max-w-2xl leading-relaxed">
          Your ultimate FPL companion with AI-powered predictions, live gameweek tracking,
          league standings, and comprehensive fixture analysis. Make smarter decisions with data-driven insights.
        </p>
      </div>

      {/* Main CTA - Centered Form */}
      <div className="w-full max-w-md mb-12 flex justify-center">
        <EntryIdForm />
      </div>

      {/* Recent Entries - Centered */}
      <div className="w-full flex justify-center mb-20">
        <RecentEntryCard />
      </div>

      {/* Features Preview */}
      <div className="w-full max-w-6xl mb-20">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">What You'll Get</h2>
            <p className="tc-text-muted text-sm">
              Everything you need to dominate your FPL leagues
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <FeatureHighlight
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M2.25 2.25a.75.75 0 000 1.5H3v10.5a3 3 0 003 3h1.21l-1.172 3.513a.75.75 0 001.424.474l.329-.987h8.418l.33.987a.75.75 0 001.422-.474l-1.17-3.513H18a3 3 0 003-3V3.75h.75a.75.75 0 000-1.5H2.25zm6.04 16.5l.5-1.5h6.42l.5 1.5H8.29zm7.46-12a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6zm-3 2.25a.75.75 0 00-1.5 0v3.75a.75.75 0 001.5 0V9zm-3 2.25a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5z" clipRule="evenodd" />
                </svg>
              }
              title="Live Dashboard"
              description="Real-time gameweek tracking with player performance and live match indicators"
              color="blue"
            />
            <FeatureHighlight
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M11.25 5.337c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.036 1.007-1.875 2.25-1.875S15 2.34 15 3.375c0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959 0 .332.278.598.61.578 1.91-.114 3.79-.342 5.632-.676a.75.75 0 01.878.645 49.17 49.17 0 01.376 5.452.657.657 0 01-.66.664c-.354 0-.675-.186-.958-.401a1.647 1.647 0 00-1.003-.349c-1.035 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401.31 0 .557.262.534.571a48.774 48.774 0 01-.595 4.845.75.75 0 01-.61.61c-1.82.317-3.673.533-5.555.642a.58.58 0 01-.611-.581c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.035-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959a.641.641 0 01-.658.643 49.118 49.118 0 01-4.708-.36.75.75 0 01-.645-.878c.293-1.614.504-3.257.629-4.924A.53.53 0 005.337 15c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.036 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.369 0 .713.128 1.003.349.283.215.604.401.959.401a.656.656 0 00.659-.663 47.703 47.703 0 00-.31-4.82.75.75 0 01.83-.832c1.343.155 2.703.254 4.077.294a.64.64 0 00.657-.642z" />
                </svg>
              }
              title="AI Predictions"
              description="Captain picks, transfers, chip strategy, and differential recommendations"
              color="purple"
            />
            <FeatureHighlight
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 00-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 00.75-.75 2.25 2.25 0 00-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 013.16 5.337a45.6 45.6 0 012.006-.343v.256zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 01-2.863 3.207 6.72 6.72 0 00.857-3.294z" clipRule="evenodd" />
                </svg>
              }
              title="League Standings"
              description="Track your rank, compete with friends, and visualize points progression"
              color="amber"
            />
            <FeatureHighlight
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                  <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
                </svg>
              }
              title="Fixture Analysis"
              description="5-gameweek difficulty ratings with home/away indicators for strategic planning"
              color="green"
            />
          </div>
        </div>
      </div>

      {/* Feature Cards Section */}
      <section className="w-full max-w-6xl mt-20 mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon="👑"
            title="Captain Picks"
            description="Top 3 captain recommendations based on expected points, form, and fixtures"
          />
          <FeatureCard
            icon="⚽"
            title="Best XI Optimizer"
            description="Formation analyzer testing 7 valid formations for maximum points"
          />
          <FeatureCard
            icon="🔄"
            title="Transfer Suggestions"
            description="Budget-aware player swaps with 3-gameweek fixture analysis"
          />
          <FeatureCard
            icon="🎯"
            title="Chip Strategy"
            description="Perfect timing advice for Triple Captain, Bench Boost, and Free Hit"
          />
          <FeatureCard
            icon="💎"
            title="Differential Picks"
            description="Low-ownership gems to gain rank advantage over rivals"
          />
          <FeatureCard
            icon="📈"
            title="League Race Chart"
            description="Visualize top managers' points progression over time"
          />
        </div>
      </section>

      {/* Premier League Teams */}
      <section className="w-full max-w-6xl mt-20 mb-12">
        <div className="flex flex-wrap items-center justify-center gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((teamId) => (
            <div
              key={teamId}
              className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 opacity-60 hover:opacity-100 transition-opacity"
            >
              <img
                src={`https://resources.premierleague.com/premierleague/badges/t${teamId}.png`}
                alt={`Team ${teamId}`}
                className="w-full h-full object-contain"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <footer className="flex flex-wrap items-center justify-center gap-3 text-sm tc-text-muted mt-auto pt-12">
        <span className="tc-chip">Next.js 16</span>
        <span className="tc-chip">React 19</span>
        <span className="tc-chip">TypeScript</span>
        <span className="tc-chip">Tailwind CSS</span>
      </footer>
    </main>
  );
}

function FeatureHighlight({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "blue" | "purple" | "amber" | "green";
}) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    green: "bg-green-500/10 text-green-600 dark:text-green-400",
  };

  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-elevated)]/50 hover:border-[color:var(--accent)] transition">
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-base mb-1">{title}</h3>
        <p className="text-sm tc-text-muted leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="tc-card rounded-3xl p-6 shadow-lg hover:shadow-xl transition border border-[color:var(--surface-border)] hover:border-[color:var(--accent)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--accent)]/10 text-2xl">
          {icon}
        </div>
        <h3 className="font-bold text-lg">{title}</h3>
      </div>
      <p className="text-sm tc-text-muted leading-relaxed">{description}</p>
    </div>
  );
}
