"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import type { PlayerDetailsDTO } from "@/lib/fpl/dto";
import { getPlayerPhotoUrl, getTeamShirtUrl } from "@/lib/fpl/images";
import { Card, Typography, Badge, Button } from "./ui";
import { 
    X, 
    Target, 
    TrendingUp, 
    Users, 
    Zap, 
    Calendar,
    AlertTriangle,
    Loader2
} from "lucide-react";

type PlayerDetailsModalProps = {
  playerId: number;
  isOpen: boolean;
  onClose: () => void;
};

export function PlayerDetailsModal({
  playerId,
  isOpen,
  onClose,
}: PlayerDetailsModalProps) {
  const [player, setPlayer] = useState<PlayerDetailsDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [useShirtFallback, setUseShirtFallback] = useState(false);

  // Lock background scroll while the modal is open.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !playerId) return;

    const fetchPlayerDetails = async () => {
      setIsLoading(true);
      setError(null);
      setUseShirtFallback(false);

      try {
        const response = await fetch(`/api/players/${playerId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch player details");
        }

        const data: PlayerDetailsDTO = await response.json();
        setPlayer(data);
        setImgUrl(getPlayerPhotoUrl(data.photo));
      } catch (err) {
        console.error("Error fetching player details:", err);
        setError("Unable to load player details. The FPL scout is busy!");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerDetails();
  }, [playerId, isOpen]);

  if (!isOpen) return null;

  const handleImageError = () => {
    if (!imgUrl) return;
    if (imgUrl.includes('250x250')) {
      setImgUrl(imgUrl.replace('250x250', '110x140'));
      return;
    }
    setUseShirtFallback(true);
  };

  const shirtUrl = player ? getTeamShirtUrl(player.teamId) : null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <Card
        className="relative max-w-4xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide border-[color:var(--surface-border)] shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
        glass
        hover={false}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 z-50 p-2 rounded-full bg-[color:var(--surface-hover)] hover:bg-[color:var(--surface-hover)] transition-colors text-[color:var(--text-tertiary)] hover:text-[color:var(--text-primary)]"
        >
          <X className="h-6 w-6" />
        </button>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <Loader2 className="h-12 w-12 animate-spin text-[color:var(--accent)]" />
            <Typography variant="title" weight="black" className="animate-pulse uppercase">Scouting Profile...</Typography>
          </div>
        ) : error ? (
          <div className="py-32 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500" />
            <Typography variant="title" weight="bold" className="text-red-500">{error}</Typography>
            <Button onClick={onClose} variant="secondary">Close Report</Button>
          </div>
        ) : player && (
          <div className="flex flex-col">
            {/* Top Banner / Hero */}
            <div className="relative p-8 md:p-12 bg-gradient-to-br from-[color:var(--accent)]/20 to-transparent flex flex-col md:flex-row items-center gap-12 border-b border-[color:var(--surface-border)]">
                <div className="relative group shrink-0">
                    <div className="absolute inset-0 bg-[color:var(--accent)]/20 blur-3xl rounded-full -z-10 group-hover:bg-[color:var(--accent)]/30 transition-all" />
                    {useShirtFallback && shirtUrl ? (
                         <Image src={shirtUrl} alt="Shirt" width={180} height={220} className="object-contain drop-shadow-2xl" unoptimized />
                    ) : imgUrl ? (
                        <Image src={imgUrl} alt={player.name} width={180} height={220} className="object-contain drop-shadow-2xl" unoptimized onError={handleImageError} />
                    ) : (
                        <div className="w-32 h-40 bg-[color:var(--surface-hover)] rounded-2xl flex items-center justify-center">
                            <Zap className="h-12 w-12 opacity-20" />
                        </div>
                    )}
                </div>

                <div className="flex-1 text-center md:text-left space-y-6">
                    <div className="space-y-2">
                        <Badge variant="primary" className="mb-2 tracking-widest">{player.team} • {player.position}</Badge>
                        <Typography variant="display" className="text-5xl md:text-6xl text-[color:var(--text-primary)] drop-shadow-md">{player.fullName || player.name}</Typography>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                         <PriceTag label="Current Price" value={`£${player.currentPrice}m`} />
                         <PriceTag label="Season Change" value={`${player.costChange > 0 ? '+' : ''}${player.costChange}m`} />
                    </div>

                    {player.status !== 'Available' && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-4 text-red-500 max-w-md">
                            <AlertTriangle className="h-6 w-6 shrink-0" />
                            <div className="text-left">
                                <Typography weight="black" className="text-sm uppercase tracking-tight">{player.status}</Typography>
                                <Typography className="text-xs opacity-80">{player.news}</Typography>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Grid */}
            <div className="p-8 md:p-12 grid md:grid-cols-3 gap-12">
                {/* Left Column: Key Metrics */}
                <div className="space-y-10">
                    <section className="space-y-4">
                        <Typography variant="caption" weight="black" className="text-[color:var(--text-secondary)] tracking-widest">Core Metrics</Typography>
                        <div className="grid grid-cols-2 gap-4">
                            <StatBox icon={<Target />} label="Total Pts" value={player.totalPoints} color="emerald" />
                            <StatBox icon={<TrendingUp />} label="Form" value={player.form.toFixed(1)} color="blue" />
                            <StatBox icon={<Zap />} label="PPG" value={player.pointsPerGame.toFixed(1)} color="purple" />
                            <StatBox icon={<Users />} label="Owned" value={`${player.selectedByPercent}%`} color="amber" />
                        </div>
                    </section>

                    <section className="space-y-4">
                        <Typography variant="caption" weight="black" className="text-[color:var(--text-secondary)] tracking-widest">Expected Value</Typography>
                        <Card className="p-6 bg-[color:var(--surface-hover)] border-[color:var(--surface-border)] space-y-4" hover={false}>
                             <div className="flex justify-between items-center">
                                <Typography className="text-sm text-[color:var(--text-secondary)]">xP Next GW</Typography>
                                <Typography weight="black" className="text-cyan-500 text-lg">{player.expectedPoints.toFixed(1)}</Typography>
                             </div>
                             <div className="flex justify-between items-center">
                                <Typography className="text-sm text-[color:var(--text-secondary)]">xG (Goals)</Typography>
                                <Typography weight="black" className="text-[color:var(--text-primary)]">{player.expectedGoals.toFixed(2)}</Typography>
                             </div>
                             <div className="flex justify-between items-center">
                                <Typography className="text-sm text-[color:var(--text-secondary)]">xA (Assists)</Typography>
                                <Typography weight="black" className="text-[color:var(--text-primary)]">{player.expectedAssists.toFixed(2)}</Typography>
                             </div>
                        </Card>
                    </section>
                </div>

                {/* Middle Column: Season Totals */}
                <div className="space-y-10">
                    <section className="space-y-4">
                        <Typography variant="caption" weight="black" className="text-[color:var(--text-secondary)] tracking-widest">Season Breakdown</Typography>
                        <div className="space-y-1">
                             <LinearStat label="Minutes Played" value={player.minutes} max={3420} />
                             <DataRow label="Goals Scored" value={player.goalsScored} />
                             <DataRow label="Assists" value={player.assists} />
                             <DataRow label="Clean Sheets" value={player.cleanSheets} />
                             <DataRow label="Bonus Points" value={player.bonus} />
                             <DataRow label="Yellow Cards" value={player.yellowCards} />
                        </div>
                    </section>

                    <section className="space-y-4">
                        <Typography variant="caption" weight="black" className="text-[color:var(--text-secondary)] tracking-widest">ICT Index (Rankings)</Typography>
                        <div className="grid grid-cols-2 gap-4">
                            <SmallStat label="Influence" value={player.influence.toFixed(1)} />
                            <SmallStat label="Creativity" value={player.creativity.toFixed(1)} />
                            <SmallStat label="Threat" value={player.threat.toFixed(1)} />
                            <SmallStat label="Index" value={player.ictIndex.toFixed(1)} />
                        </div>
                    </section>
                </div>

                {/* Right Column: Fixtures */}
                <div className="space-y-10">
                    <section className="space-y-4">
                        <Typography variant="caption" weight="black" className="text-[color:var(--text-secondary)] tracking-widest">Upcoming Fixtures</Typography>
                        {player.nextFixtures.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-[color:var(--surface-border)] p-6 text-center">
                                <Calendar className="mx-auto mb-2 h-6 w-6 opacity-30" />
                                <Typography variant="caption" className="text-[10px]">
                                    No upcoming fixtures — the season is complete.
                                </Typography>
                            </div>
                        )}
                        <div className="space-y-3">
                            {player.nextFixtures.map((f, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)] group hover:bg-[color:var(--surface-hover)] transition-colors">
                                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-inner ${getDiffColor(f.difficulty)}`}>
                                        {f.difficulty}
                                     </div>
                                     <div className="flex-1">
                                        <Typography weight="black" className="text-sm uppercase text-[color:var(--text-primary)]">{f.opponentShort}</Typography>
                                        <Typography variant="caption" className="text-[10px] text-[color:var(--text-tertiary)]">{f.isHome ? 'Home' : 'Away'}</Typography>
                                     </div>
                                     <Calendar className="w-4 h-4 opacity-20 group-hover:opacity-100 transition-opacity text-[color:var(--text-primary)]" />
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function PriceTag({ label, value }: { label: string, value: string }) {
    return (
        <div className="px-6 py-3 rounded-2xl bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)] text-center min-w-[140px]">
            <Typography variant="caption" className="text-[10px] text-[color:var(--text-tertiary)] mb-1">{label}</Typography>
            <Typography weight="black" className="text-2xl text-[color:var(--text-primary)]">{value}</Typography>
        </div>
    )
}

function StatBox({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) {
    const colors: Record<string, string> = {
        emerald: 'text-cyan-500 bg-cyan-500/10',
        blue: 'text-blue-500 bg-blue-500/10',
        purple: 'text-purple-500 bg-purple-500/10',
        amber: 'text-amber-500 bg-amber-500/10'
    };
    return (
        <div className="p-6 rounded-3xl bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)] text-center space-y-3 hover:bg-[color:var(--surface-hover)] transition-colors">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${colors[color]}`}>
                {React.isValidElement(icon) ? React.cloneElement(icon, { className: 'w-6 h-6' } as React.HTMLAttributes<HTMLElement>) : icon}
            </div>
            <div>
                <Typography variant="caption" className="text-[10px] text-[color:var(--text-tertiary)] mb-1 tracking-tight">{label}</Typography>
                <Typography weight="black" className="text-xl leading-none text-[color:var(--text-primary)]">{value}</Typography>
            </div>
        </div>
    )
}

function DataRow({ label, value }: { label: string, value: string | number }) {
    return (
        <div className="flex justify-between items-center py-3.5 border-b border-[color:var(--surface-border)] last:border-0">
            <Typography className="text-sm text-[color:var(--text-secondary)]">{label}</Typography>
            <Typography weight="black" className="text-[color:var(--text-primary)]">{value}</Typography>
        </div>
    )
}

function LinearStat({ label, value, max }: { label: string, value: number, max: number }) {
    const percent = Math.min(100, (value / max) * 100);
    return (
        <div className="space-y-2 py-4">
            <div className="flex justify-between items-center">
                <Typography className="text-sm text-[color:var(--text-secondary)]">{label}</Typography>
                <Typography weight="black" className="text-[color:var(--text-primary)]">{value.toLocaleString()}</Typography>
            </div>
            <div className="h-2 w-full bg-[color:var(--surface-hover)] rounded-full overflow-hidden border border-[color:var(--surface-border)]">
                <div className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${percent}%` }} />
            </div>
        </div>
    )
}

function SmallStat({ label, value }: { label: string, value: string }) {
    return (
        <div className="p-4 rounded-2xl bg-[color:var(--surface-hover)] border border-[color:var(--surface-border)] text-center hover:bg-[color:var(--surface-hover)] transition-colors">
            <Typography variant="caption" className="text-[9px] text-[color:var(--text-tertiary)] mb-1.5 uppercase tracking-wider">{label}</Typography>
            <Typography weight="black" className="text-base text-[color:var(--text-primary)]">{value}</Typography>
        </div>
    )
}

function getDiffColor(diff: number) {
    if (diff <= 2) return "bg-cyan-500 text-black";
    if (diff === 3) return "bg-slate-500 text-white";
    if (diff === 4) return "bg-amber-500 text-black";
    return "bg-red-500 text-white";
}
