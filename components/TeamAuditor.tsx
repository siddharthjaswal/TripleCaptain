'use client';

import { useState } from 'react';
import { Sparkles, Anchor, Sword, ShieldAlert, Loader2 } from 'lucide-react';
import { Button, Card, Badge, Typography } from './ui';

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
            <Card className="p-12 text-center flex flex-col items-center gap-6" glass>
                <div className="relative">
                    <Loader2 className="h-16 w-16 animate-spin text-[color:var(--accent)]" />
                    <Anchor className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[color:var(--accent)]" />
                </div>
                <div className="space-y-2">
                    <Typography variant="title" weight="black">Luffy is inspecting your ship...</Typography>
                    <Typography className="italic">&quot;Checking the tangerines and counting the berries!&quot;</Typography>
                </div>
            </Card>
        );
    }

    if (!audit) {
        return (
            <Card className="p-12 text-center bg-gradient-to-br from-[color:var(--accent)]/10 to-transparent border-dashed border-2">
                <Sparkles className="h-16 w-16 mx-auto text-[color:var(--accent)] mb-6 animate-pulse" />
                <Typography variant="title" weight="black" className="mb-2">Team Auditor</Typography>
                <Typography className="mb-8 max-w-md mx-auto text-[color:var(--text-secondary)]">
                    Let Captain Luffy critique your squad and find the hidden traps in your formation.
                </Typography>
                <Button onClick={runAudit} size="lg" className="shadow-lg">
                    <Anchor className="mr-2 h-5 w-5" />
                    Audit My Team
                </Button>
            </Card>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid md:grid-cols-3 gap-6">
                {/* Health Score */}
                <Card className="p-8 flex flex-col items-center justify-center text-center relative overflow-hidden" glass>
                    <div className="absolute inset-0 bg-[color:var(--accent)]/5 pointer-events-none" />
                    <Typography variant="caption" className="mb-6">Ship Condition</Typography>
                    <div className="relative h-40 w-40 flex items-center justify-center">
                        <svg className="h-full w-full transform -rotate-90">
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="16"
                                fill="transparent"
                                className="text-[color:var(--surface-border)]/30"
                            />
                            <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="16"
                                fill="transparent"
                                strokeDasharray={439.8}
                                strokeDashoffset={439.8 - (439.8 * audit.healthScore) / 100}
                                className={`${audit.healthScore > 70 ? 'text-green-500' : audit.healthScore > 40 ? 'text-yellow-500' : 'text-red-500'} transition-all duration-1000 ease-out`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <Typography variant="display" className="text-4xl font-black leading-none">{audit.healthScore}</Typography>
                            <Typography variant="caption" className="text-[10px] font-black opacity-50">%</Typography>
                        </div>
                    </div>
                </Card>

                {/* Critique */}
                <Card className="md:col-span-2 p-8 relative overflow-hidden group" glass>
                    <div className="absolute -top-12 -right-12 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                        <Anchor className="h-64 w-64" />
                    </div>
                    <div className="relative h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                            <Badge variant="primary" className="px-3 py-1">Captain&apos;s Log</Badge>
                            <Typography variant="title" weight="bold">Luffy&apos;s Critique</Typography>
                        </div>
                        <Typography className="text-lg leading-relaxed italic text-[color:var(--text-secondary)] flex-1">
                            &quot;{audit.critique}&quot;
                        </Typography>
                    </div>
                </Card>
            </div>

            {/* Recommendations */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {audit.recommendations.map((rec, i) => (
                    <Card key={i} className="p-6 border-l-8 border-l-[color:var(--accent)] flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            {rec.type.includes('Transfer') ? (
                                <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                                    <Sword className="h-5 w-5" />
                                </div>
                            ) : (
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                    <ShieldAlert className="h-5 w-5" />
                                </div>
                            )}
                            <Typography variant="caption" weight="black">{rec.type}</Typography>
                        </div>
                        {rec.player && (
                            <Typography variant="title" weight="bold" className="text-xl">
                                {rec.player}
                            </Typography>
                        )}
                        <Typography className="text-sm text-[color:var(--text-secondary)] leading-relaxed">
                            {rec.reason || rec.tip}
                        </Typography>
                    </Card>
                ))}
            </div>
            
            <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={runAudit} size="md">
                    <Anchor className="mr-2 h-4 w-4" />
                    Re-Audit Team
                </Button>
            </div>
        </div>
    );
}
