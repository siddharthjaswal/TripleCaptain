'use client';

import React, { useState } from 'react';
import { Card, Button, Typography, Badge } from './ui';
import { 
    Search, 
    ArrowRightLeft, 
    Coins, 
    Trash2,
    Loader2,
    Sparkles
} from 'lucide-react';
import type { LatestGwPlayerDTO } from '@/lib/fpl/dto';
import { getPlayerPhotoUrl } from '@/lib/fpl/images';
import Image from 'next/image';

interface PlannerProps {
    entryId: number;
    initialSquad: LatestGwPlayerDTO[];
    initialBank: number;
    nextGw: number;
    bgwDgwMap: Record<number, Record<number, { count: number; opponents: string[] }>>;
}

interface Transfer {
    out: LatestGwPlayerDTO;
    in: {
        id: number;
        webName: string;
        photo: string;
        teamId: number;
        nowCost: number;
        epNext: number;
        team: {
            shortName: string;
        };
    };
}

export function TransferPlanner({ entryId, initialSquad, initialBank, nextGw, bgwDgwMap }: PlannerProps) {
    const [squad, setSquad] = useState(initialSquad);
    const [bank, setBank] = useState(initialBank);
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Transfer['in'][]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedForSwap, setSelectedForSwap] = useState<LatestGwPlayerDTO | null>(null);
    const [verdict, setVerdict] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Filter squad by position for the pitch view
    const gk = squad.filter(p => p.position === 'GK' && !p.isBench);
    const def = squad.filter(p => p.position === 'DEF' && !p.isBench);
    const mid = squad.filter(p => p.position === 'MID' && !p.isBench);
    const fwd = squad.filter(p => p.position === 'FWD' && !p.isBench);
    const bench = squad.filter(p => p.isBench);

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const pos = selectedForSwap ? 
                (selectedForSwap.position === 'GK' ? 1 : 
                 selectedForSwap.position === 'DEF' ? 2 : 
                 selectedForSwap.position === 'MID' ? 3 : 4) : '';
            
            const res = await fetch(`/api/players/search?q=${query}&position=${pos}`);
            const data = await res.json();
            if (data.success) {
                setSearchResults(data.players);
            }
        } catch (error) {
            console.error('Player search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const performSwap = (playerIn: Transfer['in']) => {
        if (!selectedForSwap) return;

        const newSquad = squad.map(p => {
            if (p.elementId === selectedForSwap.elementId) {
                return {
                    ...p,
                    elementId: playerIn.id,
                    name: playerIn.webName,
                    photo: playerIn.photo,
                    teamId: playerIn.teamId,
                    points: 0, 
                    rawPoints: 0,
                    epNext: playerIn.epNext,
                } as LatestGwPlayerDTO;
            }
            return p;
        });

        setSquad(newSquad);
        setTransfers([...transfers, { out: selectedForSwap, in: playerIn }]);
        
        // Estimated bank calculation (simplified)
        setBank(prev => prev - (playerIn.nowCost / 10) + (10)); // Placeholder for sell price
        
        setSelectedForSwap(null);
        setSearchQuery('');
        setSearchResults([]);
    };

    const getAiVerdict = async () => {
        setIsAnalyzing(true);
        try {
            const res = await fetch('/api/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    entryId,
                    squad: squad.map(p => ({
                        name: p.name,
                        teamCode: p.teamCode,
                        position: p.position,
                        epNext: p.rawPoints // rawPoints is used as epNext in some DTOs
                    })), 
                    transfers: transfers.map(t => ({
                        out: { name: t.out.name, epNext: t.out.rawPoints },
                        in: { webName: t.in.webName, epNext: t.in.epNext }
                    })), 
                    bank 
                })
            });
            const data = await res.json();
            
            if (res.status === 402) {
                setVerdict("You're out of tactical credits, Manager! Upgrade to the Locker Room for unlimited insights.");
                return;
            }
            
            setVerdict(data.audit.critique);
        } catch (error) {
            console.error('AI Verdict error:', error);
            setVerdict("The tactical board is frozen! (AI Error)");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="grid lg:grid-cols-4 gap-8 pb-20 animate-fade-in">
            {/* Left: The Pitch (Planner Mode) */}
            <div className="lg:col-span-3 space-y-6">
                <Card className="p-4 flex items-center justify-between" glass>
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                            <Coins className="h-5 w-5" />
                        </div>
                        <div>
                            <Typography variant="caption" weight="black">Bank (Est.)</Typography>
                            <Typography variant="title" weight="black" className="text-xl">£{bank.toFixed(1)}m</Typography>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => {
                            setSquad(initialSquad);
                            setBank(initialBank);
                            setTransfers([]);
                            setVerdict(null);
                        }}>Reset Squad</Button>
                        <Button size="sm" onClick={getAiVerdict} loading={isAnalyzing} className="shadow-glow">
                            <Sparkles className="mr-2 h-4 w-4" />
                            Gaffer&apos;s Verdict
                        </Button>
                    </div>
                </Card>

                <div className="tc-pitch border-4 border-white/10 rounded-[3rem] p-8 shadow-2xl relative">
                    <div className="absolute inset-0 bg-black/10 z-0" />
                    
                    {/* Pitch Rows */}
                    <div className="space-y-12 relative z-10">
                        <PlannerRow players={gk} label="Goalkeeper" onSelect={setSelectedForSwap} selectedId={selectedForSwap?.elementId} bgwDgwMap={bgwDgwMap} nextGw={nextGw} />
                        <PlannerRow players={def} label="Defence" onSelect={setSelectedForSwap} selectedId={selectedForSwap?.elementId} bgwDgwMap={bgwDgwMap} nextGw={nextGw} />
                        <PlannerRow players={mid} label="Midfield" onSelect={setSelectedForSwap} selectedId={selectedForSwap?.elementId} bgwDgwMap={bgwDgwMap} nextGw={nextGw} />
                        <PlannerRow players={fwd} label="Forwards" onSelect={setSelectedForSwap} selectedId={selectedForSwap?.elementId} bgwDgwMap={bgwDgwMap} nextGw={nextGw} />
                    </div>
                </div>

                {/* Bench */}
                <Card className="p-6" glass hover={false}>
                    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                        <Typography variant="caption" weight="black" className="opacity-50">Squad Bench</Typography>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50 border border-red-500" />
                                <Typography variant="caption" className="text-[9px]">Blank GW</Typography>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                                <Typography variant="caption" className="text-[9px]">Double GW</Typography>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-around">
                        {bench.map(p => (
                            <div key={p.elementId} onClick={() => setSelectedForSwap(p)} className={`flex flex-col items-center gap-2 cursor-pointer transition-all ${selectedForSwap?.elementId === p.elementId ? 'scale-110 ring-2 ring-[color:var(--accent)] rounded-xl p-2 bg-[color:var(--accent)]/10' : 'opacity-80 hover:opacity-100'}`}>
                                <Image src={getPlayerPhotoUrl(p.photo)!} alt={p.name} width={50} height={60} className="object-contain" unoptimized />
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase truncate w-16 text-white">{p.name}</p>
                                    <FixtureTimeline teamId={p.teamId!} bgwDgwMap={bgwDgwMap} nextGw={nextGw} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Right: Search & Verdict */}
            <div className="lg:col-span-1 space-y-6">
                {/* Search / Swap UI */}
                <Card className="p-6 h-fit flex flex-col gap-6" glass hover={false}>
                    {selectedForSwap ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 p-4 bg-[color:var(--accent)]/10 rounded-2xl border border-[color:var(--accent)]/20">
                                <ArrowRightLeft className="h-5 w-5 text-[color:var(--accent)] animate-pulse" />
                                <div className="flex-1 min-w-0">
                                    <Typography variant="caption" weight="black" className="text-[10px]">Replacing</Typography>
                                    <Typography variant="title" weight="black" className="text-sm truncate">{selectedForSwap.name}</Typography>
                                </div>
                                <button onClick={() => setSelectedForSwap(null)} className="p-1.5 hover:bg-white/10 rounded-full">
                                    <Trash2 className="h-4 w-4 opacity-50" />
                                </button>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input 
                                    className="tc-input pl-11 h-12 text-sm font-bold"
                                    placeholder="Search new signing..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-hide">
                                {isSearching ? (
                                    <div className="text-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-50" />
                                    </div>
                                ) : searchResults.map(p => (
                                    <div 
                                        key={p.id} 
                                        onClick={() => performSwap(p)}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-[color:var(--surface-hover)] border border-transparent hover:border-[color:var(--surface-border)] cursor-pointer transition-all group"
                                    >
                                        <div className="w-10 h-10 relative overflow-hidden rounded-lg bg-slate-800 shrink-0">
                                            <Image src={getPlayerPhotoUrl(p.photo)!} alt={p.webName} fill className="object-cover" unoptimized />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Typography weight="black" className="text-xs uppercase truncate">{p.webName}</Typography>
                                            <div className="flex items-center gap-2">
                                                <Typography variant="caption" className="text-[9px]">{p.team.shortName}</Typography>
                                                <Typography variant="caption" className="text-[9px] font-bold text-[color:var(--brand-gold)]">£{(p.nowCost/10).toFixed(1)}m</Typography>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <Typography weight="black" className="text-xs text-emerald-500">{p.epNext}</Typography>
                                            <Typography variant="caption" className="text-[8px]">Exp. Pts</Typography>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 space-y-4">
                            <Typography className="text-sm text-[color:var(--text-secondary)] italic leading-relaxed text-center w-full">
                                Select a player on the pitch to simulate a transfer.
                            </Typography>
                        </div>
                    )}
                </Card>

                {/* Verdict Box */}
                {verdict && (
                    <Card className="p-6 bg-indigo-500/5 border-indigo-500/20 relative overflow-hidden" glass hover={false}>
                        <div className="absolute -bottom-8 -right-8 opacity-5">
                            <Sparkles className="h-32 w-32" />
                        </div>
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-4">
                                <Badge variant="primary" className="bg-indigo-500 text-white text-[10px]">Gaffer&apos;s Verdict</Badge>
                            </div>
                            <Typography className="text-sm leading-relaxed italic text-[color:var(--text-secondary)]">
                                &quot;{verdict}&quot;
                            </Typography>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}

function PlannerRow({ players, label, onSelect, selectedId, bgwDgwMap, nextGw }: { 
    players: LatestGwPlayerDTO[], 
    label: string, 
    onSelect: (p: LatestGwPlayerDTO) => void,
    selectedId?: number,
    bgwDgwMap: Record<number, Record<number, { count: number; opponents: string[] }>>,
    nextGw: number
}) {
    return (
        <div className="flex flex-col gap-6">
            <Typography variant="caption" weight="black" className="text-center opacity-30 tracking-[0.5em] text-[10px]">{label}</Typography>
            <div className="flex justify-around items-end w-full px-4">
                {players.map(p => (
                    <div 
                        key={p.elementId} 
                        onClick={() => onSelect(p)}
                        className={`flex flex-col items-center gap-3 transition-all duration-500 group cursor-pointer ${selectedId === p.elementId ? 'scale-110' : 'hover:-translate-y-2'}`}
                    >
                        <div className="relative">
                            <Image 
                                src={getPlayerPhotoUrl(p.photo)!} 
                                alt={p.name} 
                                width={selectedId === p.elementId ? 80 : 60} 
                                height={selectedId === p.elementId ? 100 : 75} 
                                className={`object-contain transition-all filter drop-shadow-xl ${selectedId === p.elementId ? 'brightness-125' : 'group-hover:brightness-110'}`}
                                unoptimized 
                            />
                            {selectedId === p.elementId && (
                                <div className="absolute inset-0 bg-[color:var(--accent)]/30 blur-2xl -z-10 rounded-full animate-pulse" />
                            )}
                        </div>
                        <div className="flex flex-col items-center gap-1 w-full max-w-[90px]">
                            <div className={`px-2 py-1 rounded-md backdrop-blur-md border border-white/10 shadow-lg transition-all w-full text-center ${selectedId === p.elementId ? 'bg-[color:var(--accent)]' : 'bg-black/60 group-hover:bg-black/80'}`}>
                                <p className="text-[10px] font-black text-white uppercase truncate">{p.name}</p>
                            </div>
                            {/* Fixture Info */}
                            <FixtureTimeline teamId={p.teamId!} bgwDgwMap={bgwDgwMap} nextGw={nextGw} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function FixtureTimeline({ teamId, bgwDgwMap, nextGw }: { 
    teamId: number, 
    bgwDgwMap: Record<number, Record<number, { count: number; opponents: string[] }>>,
    nextGw: number 
}) {
    const teamFixtures = bgwDgwMap[teamId] || {};
    const weeks = Array.from({ length: 5 }, (_, i) => nextGw + i);

    return (
        <div className="flex gap-1 justify-center">
            {weeks.map(gw => {
                const f = teamFixtures[gw];
                const isBlank = !f || f.count === 0;
                const isDouble = f && f.count >= 2;
                
                return (
                    <div key={gw} className="flex flex-col items-center">
                        <div 
                            title={isBlank ? "Blank Gameweek" : f.opponents.join(', ')}
                            className={`w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-black transition-all ${
                                isBlank ? 'bg-red-500/20 text-red-500 border border-red-500/50' :
                                isDouble ? 'bg-emerald-500 text-black shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                'bg-white/10 text-white/60 border border-white/5'
                            }`}
                        >
                            {isBlank ? 'B' : isDouble ? 'D' : f.opponents[0]?.substring(0, 3)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
