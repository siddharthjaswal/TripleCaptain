'use client';

import { useState } from 'react';
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
            <div className="tc-card rounded-3xl p-12 text-center flex flex-col items-center gap-4 border border-[color:var(--surface-border)]">
                <Loader2 className="h-12 w-12 animate-spin text-[color:var(--accent)]" />
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-[color:var(--text-primary)]">Luffy is inspecting your ship...</h3>
                    <p className="tc-text-muted italic">"Checking the tangerines and counting the berries!"</p>
                </div>
            </div>
        );
    }

    if (!audit) {
        return (
            <div className="tc-card rounded-3xl p-8 text-center bg-gradient-to-br from-[color:var(--accent)]/5 to-[color:var(--surface-elevated)] border-dashed border-2 border-[color:var(--surface-border)]">
                <Sparkles className="h-12 w-12 mx-auto text-[color:var(--accent)] mb-4" />
                <h3 className="text-xl font-bold text-[color:var(--text-primary)] mb-2">Team Auditor</h3>
                <p className="tc-text-muted mb-6">Let Captain Luffy critique your squad and find the hidden traps.</p>
                <button 
                    onClick={runAudit}
                    className="tc-focus-visible inline-flex items-center gap-2 rounded-lg bg-[color:var(--accent)] px-6 py-3 text-sm font-bold text-[color:var(--accent-contrast)] hover:opacity-90 transition mx-auto"
                >
                    <Anchor className="mr-2 h-4 w-4" />
                    Audit My Team
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
                {/* Health Score */}
                <div className="tc-card rounded-3xl p-6 flex flex-col items-center justify-center text-center bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)]">
                    <h4 className="text-xs font-bold uppercase tracking-wider tc-text-muted mb-4">Ship Condition</h4>
                    <div className="relative h-32 w-32 flex items-center justify-center">
                        <svg className="h-full w-full transform -rotate-90 text-[color:var(--surface-border)]">
                            <circle
                                cx="64"
                                cy="64"
                                r="58"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
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
                        <span className="absolute text-4xl font-black text-[color:var(--text-primary)]">{audit.healthScore}%</span>
                    </div>
                </div>

                {/* Critique */}
                <div className="tc-card rounded-3xl md:col-span-2 p-6 bg-[color:var(--surface-elevated)] border border-[color:var(--surface-border)] relative overflow-hidden text-[color:var(--text-primary)]">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Anchor className="h-24 w-24" />
                    </div>
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="bg-[color:var(--accent)] text-[color:var(--accent-contrast)] px-2 py-1 rounded text-xs font-bold uppercase">Captain's Log</span>
                            <h3 className="font-bold">Luffy's Critique</h3>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap italic">
                            "{audit.critique}"
                        </p>
                    </div>
                </div>
            </div>

            {/* Recommendations */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {audit.recommendations.map((rec, i) => (
                    <div key={i} className="tc-card rounded-2xl p-4 hover:shadow-md transition-shadow border-l-4 border-l-[color:var(--accent)] bg-[color:var(--surface-elevated)] text-[color:var(--text-primary)]">
                        <div className="flex items-center gap-2 mb-2">
                            {rec.type.includes('Transfer') ? (
                                <Sword className="h-4 w-4 text-red-500" />
                            ) : (
                                <ShieldAlert className="h-4 w-4 text-blue-500" />
                            )}
                            <span className="font-bold text-xs uppercase tracking-tight tc-text-muted">{rec.type}</span>
                        </div>
                        {rec.player && <h5 className="font-bold text-lg mb-1">{rec.player}</h5>}
                        <p className="text-xs tc-text-muted leading-snug">
                            {rec.reason || rec.tip}
                        </p>
                    </div>
                ))}
            </div>
            
            <div className="flex justify-center">
                <button 
                    onClick={runAudit}
                    className="tc-focus-visible inline-flex items-center gap-2 rounded-lg border border-[color:var(--surface-border)] px-4 py-2 text-sm font-medium transition hover:bg-[color:var(--surface-elevated)] tc-text-muted hover:text-[color:var(--text-primary)]"
                >
                    Re-Audit Team
                </button>
            </div>
        </div>
    );
}
