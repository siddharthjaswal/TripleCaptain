import type { Alert, AlertCategory, AlertSeverity } from "@/lib/data/alerts";
import {
  Clock,
  Activity,
  Ban,
  Crown,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

const CATEGORY_ICON: Record<AlertCategory, typeof Clock> = {
  deadline: Clock,
  injury: Activity,
  suspension: Ban,
  captain: Crown,
  price: TrendingUp,
};

const SEVERITY: Record<
  AlertSeverity,
  { ring: string; chip: string; label: string }
> = {
  urgent: {
    ring: "border-[color:var(--accent)]/40",
    chip: "bg-[color:var(--accent)]/15 text-[color:var(--accent)]",
    label: "Urgent",
  },
  warning: {
    ring: "border-[color:var(--brand-gold)]/40",
    chip: "bg-[color:var(--brand-gold)]/15 text-[color:var(--brand-gold)]",
    label: "Heads up",
  },
  info: {
    ring: "border-cyan-500/30",
    chip: "bg-cyan-500/15 text-cyan-400",
    label: "FYI",
  },
};

/** Renders a manager's alert feed. All-clear state when nothing needs attention. */
export function AlertsCenter({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="tc-card flex flex-col items-center gap-3 p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <p className="font-bold">You&apos;re all set.</p>
          <p className="mt-1 text-sm tc-text-muted">
            No injuries, suspensions or price moves on your squad, and no deadline looming.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {alerts.map((a) => {
        const Icon = CATEGORY_ICON[a.category];
        const s = SEVERITY[a.severity];
        return (
          <div
            key={a.id}
            className={`tc-card flex items-start gap-4 border ${s.ring} p-4`}
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.chip}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold">{a.title}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${s.chip}`}
                >
                  {s.label}
                </span>
              </div>
              <p className="mt-1 text-sm tc-text-muted">{a.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
