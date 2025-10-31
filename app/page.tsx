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

      {/* Main CTA */}
      <div className="w-full max-w-6xl mb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Form Section */}
          <div className="flex flex-col items-center lg:items-end">
            <EntryIdForm />
          </div>

          {/* Features Preview */}
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold mb-4">What You'll Get</h2>
            <div className="space-y-3">
              <FeatureItem
                icon="📊"
                title="Live Dashboard"
                description="Real-time gameweek tracking with player performance"
              />
              <FeatureItem
                icon="🔮"
                title="AI Predictions"
                description="Captain picks, transfers, and chip strategy recommendations"
              />
              <FeatureItem
                icon="🏆"
                title="League Standings"
                description="Track your rank and compete with friends"
              />
              <FeatureItem
                icon="📅"
                title="Fixture Analysis"
                description="5-gameweek difficulty ratings for strategic planning"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Entries */}
      <RecentEntryCard />

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

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-[color:var(--surface-elevated)] transition">
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <div>
        <h3 className="font-semibold text-sm mb-1">{title}</h3>
        <p className="text-xs tc-text-muted leading-relaxed">{description}</p>
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
