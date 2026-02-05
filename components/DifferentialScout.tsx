'use client';

import { useState, useEffect } from 'react';
import { Compass, Gem, Loader2 } from 'lucide-react';

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
                <Loader2 className="h-10 w-10 animate-spin text-[color:var(--accent)]" />
                <p className="tc-text-muted animate-pulse">Scouting for hidden treasures...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[color:var(--text-primary)]">
                    <Compass className="h-6 w-6 text-[color:var(--accent)]" />
                    <h2 className="text-2xl font-bold">Differential Scout</h2>
                </div>
                <button 
                    onClick={scout}
                    className="tc-focus-visible inline-flex items-center gap-2 rounded-lg px-3 py-1 text-sm font-medium transition hover:bg-[color:var(--surface-elevated)] tc-text-muted hover:text-[color:var(--text-primary)]"
                >
                    Refresh List
                </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {picks.map((pick, i) => (
                    <div key={i} className="tc-card rounded-3xl relative overflow-hidden group border border-[color:var(--surface-border)] bg-[color:var(--surface-elevated)] text-[color:var(--text-primary)] transition-all hover:shadow-xl">
                        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Gem className="h-24 w-24 text-[color:var(--accent)]" />
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black">{pick.name}</h3>
                                <span className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center">
                                    <Gem className="mr-1 h-3 w-3" /> Pick #{i+1}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-[color:var(--surface-root)] rounded-xl p-3 text-center border border-[color:var(--surface-border)]">
                                    <p className="text-[10px] uppercase font-bold tc-text-muted mb-1">Exp. Points</p>
                                    <p className="text-xl font-black text-[color:var(--accent)]">{pick.epNext}</p>
                                </div>
                                <div className="bg-[color:var(--surface-root)] rounded-xl p-3 text-center border border-[color:var(--surface-border)]">
                                    <p className="text-[10px] uppercase font-bold tc-text-muted mb-1">Ownership</p>
                                    <p className="text-xl font-black text-secondary">{pick.ownership}%</p>
                                </div>
                            </div>

                            <div className="pt-2">
                                <p className="text-sm leading-relaxed italic tc-text-muted">
                                    "{pick.reasoning}"
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {picks.length === 0 && !loading && (
                <div className="text-center py-12">
                    <p className="tc-text-muted">No hidden treasures found yet. Try refreshing!</p>
                </div>
            )}
        </div>
    );
}
