import { notFound } from "next/navigation";
import { DashboardNav } from "@/components/DashboardNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TransferPlanner } from "@/components/TransferPlanner";
import { SquadLab } from "@/components/SquadLab";
import { SeasonPlanner } from "@/components/SeasonPlanner";
import { loadPlannerData, parseEntryId } from "@/lib/fpl/service";
import { Typography } from "@/components/ui";
import { AccountStatus } from "@/components/AccountStatus";
import Link from "next/link";
import { Anchor } from "lucide-react";

type PlannerPageParams = {
  entryId: string;
};

export default async function PlannerPage({
  params,
}: {
  params: Promise<PlannerPageParams>;
}) {
  const { entryId: entryIdRaw } = await params;
  const entryId = (() => {
    try {
      return parseEntryId(entryIdRaw);
    } catch {
      notFound();
    }
  })();

  const data = await loadPlannerData(entryId);

  return (
    <main className="tc-surface min-h-dvh px-4 pb-16 pt-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
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
            <div className="flex items-center gap-6">
                <AccountStatus entryId={entryId} />
                <ThemeToggle />
            </div>
          </div>
          
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-[color:var(--accent)] text-[color:var(--accent-contrast)] shadow-lg shadow-[color:var(--accent)]/20">
                <Anchor className="h-6 w-6" />
              </div>
              <div>
                <Typography variant="title" weight="black" className="uppercase">Transfer Planner</Typography>
                <Typography variant="caption" weight="black" className="text-[10px]">Plotting the course for Gameweek {data.nextGw}</Typography>
              </div>
            </div>
            
            <DashboardNav
              entryId={entryId}
              active="planner"
              currentEvent={data.nextGw - 1}
            />
          </div>
        </header>

        <SquadLab entryId={entryId} />

        <SeasonPlanner entryId={entryId} />

        <TransferPlanner
            entryId={entryId}
            initialSquad={data.squad}
            initialBank={data.bank}
            nextGw={data.nextGw}
            bgwDgwMap={data.bgwDgwMap}
        />
      </div>
    </main>
  );
}
