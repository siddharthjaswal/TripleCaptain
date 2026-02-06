'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Typography, Badge } from './ui';
import { 
    Search, 
    ArrowRightLeft, 
    TrendingUp, 
    Coins, 
    ChevronRight, 
    ChevronLeft,
    Trash2,
    Plus,
    Anchor,
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
}

interface Transfer {
    out: LatestGwPlayerDTO;
    in: any; // Result from search
}

export function TransferPlanner({ entryId, initialSquad, initialBank, nextGw }: PlannerProps) {
    const [squad, setSquad] = useState(initialSquad);
    const [bank, setBank] = useState(initialBank);
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
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
        } catch (e) {
            console.error(e);
        } finally {
            setIsSearching(false);
        }
    };

    const performSwap = (playerIn: any) => {
        if (!selectedForSwap) return;

        const costIn = playerIn.nowCost / 10;
        const sellPriceOut = selectedForSwap.rawPoints; // Placeholder for sell price logic if needed

        // Simple check
        if (costIn > bank + (selectedForSwap as any).cost) {
            // Note: I need the 'cost' of the player out. I'll add it to the DTO.
        }

        const newSquad = squad.map(p => {
            if (p.elementId === selectedForSwap.elementId) {
                return {
                    ...p,
                    elementId: playerIn.id,
                    name: playerIn.webName,
                    photo: playerIn.photo,
                    points: 0, // Reset for planner
                    rawPoints: 0,
                    cost: playerIn.nowCost / 10 // Store cost
                } as any;
            }
            return p;
        });

        setSquad(newSquad);
        setTransfers([...transfers, { out: selectedForSwap, in: playerIn }]);
        setBank(prev => prev + ((selectedForSwap as any).cost || 0) - (playerIn.nowCost / 10));
        setSelectedForSwap(null);
        setSearchQuery('');
        setSearchResults([]);
    };

    const getAiVerdict = async () => {
        setIsAnalyzing(true);
        try {
            // We'll create an API for this
            const res = await fetch('/api/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ squad, transfers, bank })
            });
            const data = await res.json();
            setVerdict(data.audit.critique);
        } catch (e) {
            setVerdict("The sea is too rough to think, Captain! (AI Error)");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="grid lg:grid-cols-3 gap-8 pb-20 animate-fade-in">
            {/* Left: The Pitch (Planner Mode) */}
            <div className="lg:col-span-2 space-y-6">
                <Card className="p-4 flex items-center justify-between" glass>
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                            <Coins className="h-5 w-5" />
                        </div>
                        <div>
                            <Typography variant="caption" weight="black">Bank</Typography>
                            <Typography variant="title" weight="black" className="text-xl">£{bank.toFixed(1)}m</Typography>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => {
                            setSquad(initialSquad);
                            setBank(initialBank);
                            setTransfers([]);
                            setVerdict(null);
                        }}>Reset</Button>
                        <Button size="sm" onClick={getAiVerdict} loading={isAnalyzing}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Luffy's Verdict
                        </Button>
                    </div>
                </Card>

                <div className="tc-pitch border-4 border-white/10 rounded-[3rem] p-8 shadow-2xl relative">
                    <div className="absolute inset-0 bg-black/10 z-0" />
                    
                    {/* Pitch Rows */}
                    <div className="space-y-12 relative z-10">
                        <PlannerRow players={gk} label="Goalkeeper" onSelect={setSelectedForSwap} selectedId={selectedForSwap?.elementId} />
                        <PlannerRow players={def} label="Defence" onSelect={setSelectedForSwap} selectedId={selectedForSwap?.elementId} />
                        <PlannerRow players={mid} label="Midfield" onSelect={setSelectedForSwap} selectedId={selectedForSwap?.elementId} />
                        <PlannerRow players={fwd} label="Forwards" onSelect={setSelectedForSwap} selectedId={selectedForSwap?.elementId} />
                    </div>
                </div>

                {/* Bench */}
                <Card className="p-6" glass>
                    <Typography variant="caption" weight="black" className="mb-4 block text-center">The Crew Deck (Bench)</Typography>
                    <div className="flex justify-center gap-4">
                        {bench.map(p => (
                            <div key={p.elementId} onClick={() => setSelectedForSwap(p)} className={`cursor-pointer transition-all ${selectedForSwap?.elementId === p.elementId ? 'scale-110 ring-2 ring-[color:var(--accent)] rounded-xl p-1' : 'opacity-80 hover:opacity-100'}`}>
                                <Image src={getPlayerPhotoUrl(p.photo)!} alt={p.name} width={50} height={60} className="object-contain" unoptimized />
                                <p className="text-[10px] font-black text-center mt-1 truncate w-12 uppercase">{p.name}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Right: Search & Verdict */}
            <div className="space-y-6">
                {/* Search / Swap UI */}
                <Card className="p-8 h-fit flex flex-col gap-6" glass>
                    {selectedForSwap ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-[color:var(--accent)]/10 rounded-2xl border border-[color:var(--accent)]/20">
                                <ArrowRightLeft className="h-6 w-6 text-[color:var(--accent)] animate-pulse" />
                                <div>
                                    <Typography variant="caption" weight="black">Replacing</Typography>
                                    <Typography variant="title" weight="black" className="text-xl">{selectedForSwap.name}</Typography>
                                </div>
                                <button onClick={() => setSelectedForSwap(null)} className="ml-auto p-2 hover:bg-white/10 rounded-full">
                                    <Trash2 className="h-4 w-4 opacity-50" />
                                </button>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input 
                                    className="tc-input pl-12 h-14 font-bold"
                                    placeholder="Search new recruit..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                                {isSearching ? (
                                    <div className="text-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-50" />
                                    </div>
                                ) : searchResults.map(p => (
                                    <div 
                                        key={p.id} 
                                        onClick={() => performSwap(p)}
                                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-[color:var(--surface-hover)] border border-transparent hover:border-[color:var(--surface-border)] cursor-pointer transition-all group"
                                    >
                                        <div className="w-10 h-10 relative overflow-hidden rounded-lg bg-slate-800">
                                            <Image src={getPlayerPhotoUrl(p.photo)!} alt={p.webName} fill className="object-cover" unoptimized />
                                        </div>
                                        <div className="flex-1">
                                            <Typography weight="black" className="text-sm uppercase">{p.webName}</Typography>
                                            <Typography variant="caption" className="text-[9px]">{p.team.shortName} • £{(p.nowCost/10).toFixed(1)}m</Typography>
                                        </div>
                                        <div className="text-right">
                                            <Typography weight="black" className="text-sm text-emerald-500">{p.epNext}</Typography>
                                            <Typography variant="caption" className="text-[9px]">Exp. Pts</Typography>
                                        </div>
                                        <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 text-[color:var(--accent)] transition-opacity" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 space-y-4">
                            <Anchor className="h-12 w-12 mx-auto text-[color:var(--text-tertiary)] opacity-20" />
                            <Typography className="text-[color:var(--text-secondary)] italic">
                                Tap a player on the pitch to start planning your next move, Captain!
                            </Typography>
                        </div>
                    )}
                </Card>

                {/* Verdict Box */}
                {verdict && (
                    <Card className="p-8 bg-indigo-500/5 border-indigo-500/20 relative overflow-hidden" glass>
                        <div className="absolute -bottom-8 -right-8 opacity-5">
                            <Sparkles className="h-32 w-32" />
                        </div>
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-4">
                                <Badge variant="primary" className="bg-indigo-500 text-white">Luffy&apos;s Verdict</Badge>
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

function PlannerRow({ players, label, onSelect, selectedId }: { 
    players: LatestGwPlayerDTO[], 
    label: string, 
    onSelect: (p: LatestGwPlayerDTO) => void,
    selectedId?: number 
}) {
    return (
        <div className="flex flex-col gap-4">
            <Typography variant="caption" weight="black" className="text-center opacity-30 tracking-[0.5em]">{label}</Typography>
            <div className="flex justify-around items-end w-full">
                {players.map(p => (
                    <div 
                        key={p.elementId} 
                        onClick={() => onSelect(p)}
                        className={`flex flex-col items-center gap-2 transition-all duration-300 group cursor-pointer ${selectedId === p.elementId ? 'scale-110' : 'hover:-translate-y-2'}`}
                    >
                        <div className="relative">
                            <Image 
                                src={getPlayerPhotoUrl(p.photo)!} 
                                alt={p.name} 
                                width={selectedId === p.elementId ? 80 : 60} 
                                height={selectedId === p.elementId ? 100 : 75} 
                                className={`object-contain transition-all filter drop-shadow-lg ${selectedId === p.elementId ? 'brightness-125' : 'group-hover:brightness-110'}`}
                                unoptimized 
                            />
                            {selectedId === p.elementId && (
                                <div className="absolute inset-0 bg-[color:var(--accent)]/20 blur-xl -z-10 rounded-full" />
                            )}
                        </div>
                        <div className={`px-3 py-1 rounded-lg backdrop-blur-md border border-white/10 shadow-xl transition-colors ${selectedId === p.elementId ? 'bg-[color:var(--accent)]' : 'bg-black/40'}`}>
                            <p className="text-[10px] font-black text-center text-white uppercase truncate w-16">{p.name}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
