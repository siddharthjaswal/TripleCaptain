import type { TotalsDTO } from "@/lib/fpl/dto";
import { formatNumber } from "@/lib/format";
import { Card, Typography, Badge } from "@/components/ui";
import { TrendingUp, TrendingDown, Target } from "lucide-react";

type TotalsCardProps = {
  totals: TotalsDTO;
};

export function TotalsCard({ totals }: TotalsCardProps) {
  return (
    <Card className="p-8 relative overflow-hidden" glass>
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <Target className="h-24 w-24" />
      </div>
      
      <div className="flex items-center justify-between gap-4 mb-8">
        <Typography variant="caption" weight="bold">
          Overall Performance
        </Typography>
        <Badge variant="primary">GW {totals.currentEvent}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Kpi label="Total Points" value={formatNumber(totals.totalPoints)} />
        <KpiWithChange
          label="Overall Rank"
          value={
            totals.overallRank ? `#${formatNumber(totals.overallRank)}` : "—"
          }
          rankChange={totals.rankChange}
        />
      </div>
    </Card>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <Typography variant="caption" className="text-[10px]">{label}</Typography>
      <Typography variant="title" weight="black" className="text-3xl">{value}</Typography>
    </div>
  );
}

function KpiWithChange({ label, value, rankChange }: { label: string; value: string; rankChange: number | null }) {
  const hasChange = rankChange !== null && rankChange !== 0;
  const isImprovement = rankChange !== null && rankChange < 0;

  return (
    <div className="space-y-1">
      <Typography variant="caption" className="text-[10px]">{label}</Typography>
      <div className="flex flex-col gap-1">
        <Typography variant="title" weight="black" className="text-3xl leading-none">{value}</Typography>
        {hasChange && (
          <div className={`flex items-center gap-1.5 ${isImprovement ? 'text-green-500' : 'text-red-500'}`}>
            {isImprovement ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            <Typography weight="bold" className="text-xs uppercase tracking-tight">{formatNumber(Math.abs(rankChange))}</Typography>
          </div>
        )}
      </div>
    </div>
  );
}
