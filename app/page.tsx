import Image from "next/image";
import { EntryIdForm } from "@/components/EntryIdForm";
import { RecentEntryCard } from "@/components/RecentEntryCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { MyTeamShortcut } from "@/components/MyTeamShortcut";
import { AutoRedirect } from "@/components/AutoRedirect";
import { Card, Typography, Badge } from "@/components/ui";
import { LayoutDashboard, Sparkles, Trophy, Calendar } from "lucide-react";

export default function Home() {
  return (
    <main className="tc-hero flex min-h-dvh flex-col items-center px-6 py-12">
      <AutoRedirect />
      {/* Header */}
      <div className="flex w-full max-w-7xl items-center justify-end gap-3 mb-12">
        <a
          href="/rankings"
          className="tc-focus-visible inline-flex items-center gap-1.5 rounded-full border border-[color:var(--surface-border)] bg-[color:var(--surface-elevated)]/80 px-3 py-1.5 text-sm font-bold transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
        >
          📊 Rankings
        </a>
        <UserMenu />
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <div className="flex max-w-4xl flex-col items-center text-center mb-16 animate-fade-in">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#2a0a33] to-[#160520] shadow-2xl mb-8 ring-1 ring-[var(--accent)]/30 p-4">
            {/* Plain img: next/image can fail to render local SVGs without an optimizer loader */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src="/favicon.svg"
                alt="Triple Captain Logo"
                width={64}
                height={64}
                className="drop-shadow-[0_0_8px_rgba(255,183,0,0.5)]"
            />
        </div>

        <Badge variant="primary" className="mb-8 px-4 py-1.5 shadow-glow">
            <Trophy className="mr-2 h-4 w-4" />
            V2 Premium Companion
        </Badge>
        
        <Typography as="h1" variant="display" weight="black" className="mb-8 leading-[0.9]">
            Triple{" "}
            <span className="tc-gradient-text">Captain</span>
        </Typography>

        <Typography className="text-xl text-[color:var(--text-secondary)] max-w-2xl leading-relaxed mb-12">
          Your ultimate FPL companion with AI-powered predictions, live tracking,
          and strategic insights. Dominate your leagues with data-driven decision making.
        </Typography>

        {/* Main CTA */}
        <div className="w-full max-w-md flex flex-col items-center gap-6">
            <MyTeamShortcut />
            <EntryIdForm />
            <RecentEntryCard />
        </div>
      </div>

      {/* Features Grid */}
      <section className="w-full max-w-6xl mt-24 mb-32">
        <div className="grid md:grid-cols-2 gap-8">
            <FeatureHighlight
              icon={<LayoutDashboard className="w-6 h-6" />}
              title="Live Dashboard"
              description="Real-time tracking with player performance and live match indicators. Never miss a point again."
              color="blue"
            />
            <FeatureHighlight
              icon={<Sparkles className="w-6 h-6" />}
              title="Tactical AI Auditor"
              description="Our legendary Gaffer critiques your squad, finding hidden tactical traps and golden signing opportunities."
              color="purple"
            />
            <FeatureHighlight
              icon={<Trophy className="w-6 h-6" />}
              title="League Analytics"
              description="Track your rank, compete with friends, and visualize your points progression over the season."
              color="amber"
            />
            <FeatureHighlight
              icon={<Calendar className="w-6 h-6" />}
              title="Strategic Planning"
              description="5-gameweek fixture difficulty ratings with home/away indicators for professional planning."
              color="green"
            />
        </div>
      </section>

      {/* Badge Reel */}
      <section className="w-full overflow-hidden mb-32 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
        <div className="flex flex-wrap items-center justify-center gap-12">
          {[3, 7, 90, 91, 94, 36, 8, 31, 11, 54, 2, 14, 43, 1, 4, 17, 56, 6, 21, 39].map((teamCode) => (
            <div key={teamCode} className="w-10 h-10 relative">
              <Image
                src={`https://resources.premierleague.com/premierleague/badges/t${teamCode}.png`}
                alt="Badge"
                fill
                className="object-contain"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-[color:var(--surface-border)] pt-12 pb-24 flex flex-col items-center gap-8">
        <Typography variant="caption" weight="black" className="opacity-40 uppercase tracking-[0.2em]">V2.2.5 Strike Force • Built for the Premier League</Typography>
        <div className="flex flex-wrap items-center justify-center gap-4">
            <Badge variant="secondary">Next.js 16</Badge>
            <Badge variant="secondary">React 19</Badge>
            <Badge variant="secondary">Tailwind CSS 4</Badge>
            <Badge variant="secondary">Prisma</Badge>
        </div>
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
    blue: "bg-[var(--accent)]/10 text-[color:var(--accent)]",
    purple: "bg-[var(--brand-secondary)]/10 text-[color:var(--brand-secondary)]",
    amber: "bg-amber-400/10 text-amber-400",
    green: "bg-[var(--accent)]/10 text-[color:var(--accent)]",
  };

  return (
    <Card className="p-8 flex items-start gap-6 border-transparent" glass>
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${colorClasses[color]}`}>
        {icon}
      </div>
      <div>
        <Typography variant="title" weight="bold" className="text-xl mb-2">{title}</Typography>
        <Typography className="text-[color:var(--text-secondary)] leading-relaxed">{description}</Typography>
      </div>
    </Card>
  );
}
