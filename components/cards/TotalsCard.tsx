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
      <div className="flex items-baseline gap-3">
        <Typography variant="title" weight="black" className="text-3xl">{value}</Typography>
        {hasChange && (
          <div className={`flex items-center gap-1 ${isImprovement ? 'text-green-500' : 'text-red-500'}`}>
            {isImprovement ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <Typography weight="bold" className="text-sm">{formatNumber(Math.abs(rankChange))}</Typography>
          </div>
        )}
      </div>
    </div>
  );
}
