'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Anchor, Sword, ShieldAlert, Loader2 } from 'lucide-react';

interface Recommendation {
    type: string;
    player?: string;
    reason?: string;
    tip?: string;
}

interface AuditData {
    healthScore: number;
    critique: string;
    recommendations: Recommendation[];
}

export function TeamAuditor({ entryId }: { entryId: number }) {
    const [audit, setAudit] = useState<AuditData | null>(null);
    const [loading, setLoading] = useState(false);

    const runAudit = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/audit?entryId=${entryId}`);
            const data = await res.json();
            if (data.success) {
                setAudit(data.audit);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card className="p-12 text-center flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="space-y-2">
                    <h3 className="text-xl font-bold">Luffy is inspecting your ship...</h3>
                    <p className="text-muted-foreground italic">"Checking the tangerines and counting the berries!"</p>
                </div>
            </Card>
        );
    }

    if (!audit) {
        return (
            <Card className="p-8 text-center bg-gradient-to-br from-primary/5 to-secondary/5 border-dashed">
                <Sparkles className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Team Auditor</h3>
                <p className="text-muted-foreground mb-6">Let Captain Luffy critique your squad and find the hidden traps.</p>
                <Button onClick={runAudit} size="lg">
                    <Anchor className="mr-2 h-4 w-4" />
                    Audit My Team
                </Button>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
                {/* Health Score */}
                <Card className="p-6 flex flex-col items-center justify-center text-center bg-primary/5 border-primary/20">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Ship Condition</h4>
                    <div className="relative h-32 w-32 flex items-center justify-center">
                        <svg className="h-full w-full transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="58"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-muted/20"
                            />
                            <circle
                                cx="64"
                                cy="64"
                                r="58"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={364.4}
                                strokeDashoffset={364.4 - (364.4 * audit.healthScore) / 100}
                                className={`${audit.healthScore > 70 ? 'text-green-500' : audit.healthScore > 40 ? 'text-yellow-500' : 'text-red-500'} transition-all duration-1000`}
                            />
                        </svg>
                        <span className="absolute text-4xl font-black">{audit.healthScore}%</span>
                    </div>
                </Card>

                {/* Critique */}
                <Card className="md:col-span-2 p-6 bg-secondary/5 border-secondary/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Anchor className="h-24 w-24" />
                    </div>
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-4">
                            <Badge className="bg-primary text-primary-foreground">Captain's Log</Badge>
                            <h3 className="font-bold">Luffy's Critique</h3>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap italic">
                            "{audit.critique}"
                        </p>
                    </div>
                </Card>
            </div>

            {/* Recommendations */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {audit.recommendations.map((rec, i) => (
                    <Card key={i} className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-primary">
                        <div className="flex items-center gap-2 mb-2">
                            {rec.type.includes('Transfer') ? (
                                <Sword className="h-4 w-4 text-red-500" />
                            ) : (
                                <ShieldAlert className="h-4 w-4 text-blue-500" />
                            )}
                            <span className="font-bold text-xs uppercase tracking-tight">{rec.type}</span>
                        </div>
                        {rec.player && <h5 className="font-bold text-lg mb-1">{rec.player}</h5>}
                        <p className="text-xs text-muted-foreground leading-snug">
                            {rec.reason || rec.tip}
                        </p>
                    </Card>
                ))}
            </div>
            
            <div className="flex justify-center">
                <Button variant="outline" onClick={runAudit} size="sm">
                    Re-Audit Team
                </Button>
            </div>
        </div>
    );
}
