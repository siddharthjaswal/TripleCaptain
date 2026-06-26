import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bell } from "lucide-react";
import { DashboardNav } from "@/components/DashboardNav";
import { AlertsCenter } from "@/components/AlertsCenter";
import { EnableNotifications } from "@/components/EnableNotifications";
import { PersistLastEntry } from "@/components/PersistLastEntry";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoutButton } from "@/components/LogoutButton";
import { loadEntryAlerts, parseEntryId } from "@/lib/fpl/service";

type AlertsPageParams = { entryId: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<AlertsPageParams>;
}): Promise<Metadata> {
  const { entryId } = await params;
  return { title: `Alerts | Manager ${entryId} | Triple Captain` };
}

export default async function EntryAlertsPage({
  params,
}: {
  params: Promise<AlertsPageParams>;
}) {
  const { entryId } = await params;
  let parsedEntryId: number;
  try {
    parsedEntryId = parseEntryId(entryId);
  } catch {
    notFound();
  }

  const data = await loadEntryAlerts(parsedEntryId);
  const urgentCount = data.alerts.filter((a) => a.severity === "urgent").length;

  return (
    <main className="tc-surface min-h-dvh px-4 pb-24 pt-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <LogoutButton />
            <ThemeToggle />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[color:var(--accent)] to-[color:var(--accent)]/80 shadow-lg shadow-[color:var(--accent)]/20">
                <Bell className="h-7 w-7 text-[color:var(--accent-contrast)]" />
                {urgentCount > 0 && (
                  <span className="tc-numeric absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-[color:var(--accent)] px-1.5 text-[11px] font-black text-[color:var(--accent-contrast)] ring-2 ring-[color:var(--surface-root)]">
                    {urgentCount}
                  </span>
                )}
              </div>
              <div>
                <h1 className="font-display text-2xl font-black uppercase tracking-tight sm:text-3xl">
                  Alerts
                </h1>
                <p className="text-sm tc-text-muted font-medium">{data.teamName}</p>
              </div>
            </div>
            <DashboardNav entryId={data.entryId} active="alerts" currentEvent={data.nextEvent ?? undefined} />
          </div>
        </header>

        <EnableNotifications entryId={data.entryId} />

        <AlertsCenter alerts={data.alerts} />

        <PersistLastEntry
          entryId={data.entryId}
          teamName={data.teamName}
          managerName={data.managerName}
        />
      </div>
    </main>
  );
}
