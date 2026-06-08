import type { LatestGwDTO } from "@/lib/fpl/dto";
import { formatNumber } from "@/lib/format";
import { Card, Typography, Badge } from "@/components/ui";
import { Zap, CheckCircle2 } from "lucide-react";

type LatestGwCardProps = {
  latest: LatestGwDTO;
};

export function LatestGwCard({ latest }: LatestGwCardProps) {
  return (
    <Card className="p-8 relative overflow-hidden" glass>
       <div className="absolute top-0 right-0 p-4 opacity-5 text-cyan-500">
        <Zap className="h-24 w-24 fill-current" />
      </div>

      <div className="flex items-center justify-between gap-3 mb-8">
        <Typography variant="caption" weight="bold">
          Latest Gameweek
        </Typography>
        <StatusPill isLive={latest.isLive} event={latest.event} />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-1">
          <Typography variant="caption" className="text-[10px]">GW Points</Typography>
          <Typography variant="title" weight="black" className="text-3xl text-cyan-500">{formatNumber(latest.points)}</Typography>
        </div>
        <div className="space-y-1">
          <Typography variant="caption" className="text-[10px]">GW Rank</Typography>
          <Typography variant="title" weight="black" className="text-3xl">{latest.rank ? `#${formatNumber(latest.rank)}` : "—"}</Typography>
        </div>
      </div>

      {latest.chipUsed && (
        <div className="mt-8 flex items-center gap-2 text-xs font-bold uppercase text-[color:var(--brand-gold)]">
          <Zap className="h-4 w-4 fill-current" />
          Chip Active: {latest.chipUsed.replace(/_/g, " ")}
        </div>
      )}
    </Card>
  );
}

function StatusPill({ isLive, event }: { isLive: boolean; event: number }) {
  if (isLive) {
    return (
      <Badge variant="success" className="animate-glow flex gap-2">
        <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
        Live — GW {event}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="flex gap-2">
        <CheckCircle2 className="h-3 w-3" />
        GW {event} Over
    </Badge>
  );
}
