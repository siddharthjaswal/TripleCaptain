"use client";

import Image from "next/image";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Users } from "lucide-react";

type PriceChange = {
  elementId: number;
  playerName: string;
  teamName: string;
  teamBadge: string;
  position: string;
  photo: string | null;
  currentPrice: number;
  priceChange: number; // Positive = rising, Negative = falling
  transfersIn: number;
  transfersOut: number;
  netTransfers: number;
  ownership: number;
  changeProb: number; // 0-100%
  changeTonight: "rising" | "falling" | "stable";
};

type PriceChangeTrackerProps = {
  players: PriceChange[];
  showOnlyYourTeam?: boolean;
};

export function PriceChangeTracker({ players, showOnlyYourTeam = false }: PriceChangeTrackerProps) {
  const rising = players
    .filter(p => p.changeTonight === "rising")
    .sort((a, b) => b.changeProb - a.changeProb)
    .slice(0, 5);
    
  const falling = players
    .filter(p => p.changeTonight === "falling")
    .sort((a, b) => b.changeProb - a.changeProb)
    .slice(0, 5);

  const formatPrice = (price: number) => `£${(price / 10).toFixed(1)}m`;

  return (
    <div className="tc-card overflow-hidden">
      <div className="bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-rose-500/10 p-4 border-b border-[color:var(--surface-border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-cyan-500" />
            <h3 className="text-sm font-black uppercase tracking-wider">
              Price Change Predictions
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              Tonight
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Rising */}
        {rising.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-cyan-500" />
              <h4 className="text-xs font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                Expected to Rise ({rising.length})
              </h4>
            </div>
            <div className="space-y-2">
              {rising.map(player => (
                <PriceChangeRow key={player.elementId} player={player} type="rising" formatPrice={formatPrice} />
              ))}
            </div>
          </div>
        )}

        {/* Falling */}
        {falling.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-4 w-4 text-rose-500" />
              <h4 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Expected to Fall ({falling.length})
              </h4>
            </div>
            <div className="space-y-2">
              {falling.map(player => (
                <PriceChangeRow key={player.elementId} player={player} type="falling" formatPrice={formatPrice} />
              ))}
            </div>
          </div>
        )}

        {rising.length === 0 && falling.length === 0 && (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 mx-auto mb-3 tc-text-muted opacity-30" />
            <p className="text-sm font-bold tc-text-muted">
              No price changes expected tonight
            </p>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="border-t border-[color:var(--surface-border)] p-3 bg-[color:var(--surface-root)]">
        <div className="flex items-center justify-center gap-2 text-xs tc-text-muted">
          <AlertCircle className="h-3 w-3" />
          <span>Predictions based on net transfers • Updates every hour</span>
        </div>
      </div>
    </div>
  );
}

function PriceChangeRow({ 
  player, 
  type, 
  formatPrice 
}: { 
  player: PriceChange; 
  type: "rising" | "falling";
  formatPrice: (p: number) => string;
}) {
  const isRising = type === "rising";

  return (
    <div className={`rounded-xl border p-3 transition-all ${
      isRising 
        ? "bg-cyan-500/5 border-cyan-500/20 hover:border-cyan-500/40"
        : "bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40"
    }`}>
      <div className="flex items-center gap-3">
        {/* Player Photo */}
        <div className="relative shrink-0">
          {player.photo ? (
            <Image
              src={`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.photo.replace('.jpg', '')}.png`}
              alt={player.playerName}
              width={40}
              height={50}
              className="h-12 w-auto object-contain drop-shadow-md"
            />
          ) : (
            <div className="h-12 w-10 rounded-lg bg-[color:var(--surface-root)] flex items-center justify-center">
              <Users className="h-5 w-5 tc-text-muted" />
            </div>
          )}
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Image
              src={player.teamBadge}
              alt={player.teamName}
              width={16}
              height={16}
              className="h-4 w-4 object-contain"
            />
            <p className="font-black text-sm truncate">{player.playerName}</p>
          </div>
          <div className="flex items-center gap-2 text-xs tc-text-muted">
            <span className="font-bold">{player.position}</span>
            <span>•</span>
            <span>{player.ownership.toFixed(1)}% owned</span>
          </div>
        </div>

        {/* Price & Stats */}
        <div className="shrink-0 text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-black tabular-nums">
              {formatPrice(player.currentPrice)}
            </span>
            {isRising ? (
              <TrendingUp className="h-4 w-4 text-cyan-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-rose-500" />
            )}
          </div>
          
          {/* Probability Bar */}
          <div className="w-24">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="font-bold tc-text-muted">Prob</span>
              <span className={`font-black ${isRising ? 'text-cyan-600 dark:text-cyan-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {player.changeProb}%
              </span>
            </div>
            <div className="h-1.5 bg-[color:var(--surface-root)] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${isRising ? 'bg-cyan-500' : 'bg-rose-500'}`}
                style={{ width: `${player.changeProb}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Net Transfers */}
      <div className="mt-2 pt-2 border-t border-[color:var(--surface-border)] flex items-center justify-between text-xs">
        <span className="tc-text-muted">Net transfers:</span>
        <span className={`font-black tabular-nums ${
          player.netTransfers > 0 ? 'text-cyan-500' : 'text-rose-500'
        }`}>
          {player.netTransfers > 0 ? '+' : ''}{player.netTransfers.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
