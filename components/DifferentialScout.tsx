'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Compass, Gem, TrendingUp, Users, Loader2 } from 'lucide-react';

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
            <div className="flex flex-col items-center justify-center p-12 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Scouting for hidden treasures...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Compass className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold">Differential Scout</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={scout}>
                    Refresh List
                </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {picks.map((pick, i) => (
                    <Card key={i} className="relative overflow-hidden group hover:border-primary/50 transition-colors">
                        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Gem className="h-24 w-24" />
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold">{pick.name}</h3>
                                <Badge className="bg-yellow-500 text-black border-none">
                                    <Gem className="mr-1 h-3 w-3" /> Pick #{i+1}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-primary/5 rounded-lg p-2 text-center">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Exp. Points</p>
                                    <p className="text-lg font-black text-primary">{pick.epNext}</p>
                                </div>
                                <div className="bg-secondary/5 rounded-lg p-2 text-center">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Ownership</p>
                                    <p className="text-lg font-black text-secondary">{pick.ownership}%</p>
                                </div>
                            </div>

                            <div className="pt-2">
                                <p className="text-sm leading-relaxed italic text-muted-foreground">
                                    "{pick.reasoning}"
                                </p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
            
            {picks.length === 0 && !loading && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No hidden treasures found yet. Try refreshing!</p>
                </div>
            )}
        </div>
    );
}
