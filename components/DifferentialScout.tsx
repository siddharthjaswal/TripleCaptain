'use client';

import { useState, useEffect } from 'react';
import { Compass, Gem, Loader2, Sparkles } from 'lucide-react';
import { Button, Card, Badge, Typography } from './ui';

interface Pick {
    name: string;
    reasoning: string;
    epNext: number;
    ownership: number;
}

export function DifferentialScout() {
    const [picks, setPicks] = useState<Pick[]>([]);
    const [loading, setLoading] = useState(false);

    const scout = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/scout');
            const data = await res.json();
            if (data.success) {
                setPicks(data.picks);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        scout();
    }, []);

    if (loading) {
        return (
            <Card className="p-20 text-center flex flex-col items-center gap-6" glass>
                <div className="relative">
                    <Compass className="h-16 w-16 animate-spin text-[color:var(--accent)]" />
                    <Sparkles className="h-6 w-6 absolute top-0 right-0 text-yellow-500 animate-pulse" />
                </div>
                <Typography variant="title" weight="black" className="animate-pulse">Scouting for hidden treasures...</Typography>
            </Card>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-[color:var(--accent)] text-[color:var(--accent-contrast)] shadow-lg shadow-[color:var(--accent)]/20">
                        <Compass className="h-6 w-6" />
                    </div>
                    <div>
                        <Typography variant="title" weight="black">Differential Scout</Typography>
                        <Typography variant="caption">Hidden Gems & Low Ownership High-Upside Players</Typography>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={scout}>
                    Refresh List
                </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {picks.map((pick, i) => (
                    <Card key={i} className="relative overflow-hidden group hover:shadow-2xl transition-all duration-500" glass>
                        <div className="absolute -right-8 -top-8 opacity-5 group-hover:opacity-20 transition-all duration-700 group-hover:scale-110">
                            <Gem className="h-40 w-40 text-[color:var(--accent)]" />
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <Typography variant="title" weight="black" className="text-2xl">{pick.name}</Typography>
                                <Badge className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-3 py-1 font-black">
                                    <Gem className="mr-2 h-4 w-4" /> #{i+1}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[color:var(--surface-root)] rounded-2xl p-4 text-center border border-[color:var(--surface-border)] shadow-inner">
                                    <Typography variant="caption" weight="bold" className="mb-1">Exp. Points</Typography>
                                    <Typography variant="title" weight="black" className="text-3xl text-[color:var(--accent)]">{pick.epNext}</Typography>
                                </div>
                                <div className="bg-[color:var(--surface-root)] rounded-2xl p-4 text-center border border-[color:var(--surface-border)] shadow-inner">
                                    <Typography variant="caption" weight="bold" className="mb-1">Ownership</Typography>
                                    <Typography variant="title" weight="black" className="text-3xl text-secondary">{pick.ownership}%</Typography>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-[color:var(--surface-border)] border-dashed">
                                <Typography className="text-base leading-relaxed italic text-[color:var(--text-secondary)]">
                                    &quot;{pick.reasoning}&quot;
                                </Typography>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
            
            {picks.length === 0 && !loading && (
                <Card className="p-12 text-center" glass>
                    <Typography variant="caption">No hidden treasures found yet. Try refreshing!</Typography>
                </Card>
            )}
        </div>
    );
}
