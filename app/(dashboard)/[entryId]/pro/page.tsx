'use client';

import { Card, Button, Typography, Badge } from '@/components/ui';
import { Check, Zap, Trophy, Star, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage({ params }: { params: { entryId: string } }) {
    const plans = [
        {
            name: "The Recruit",
            price: "Free",
            description: "Essential tools for casual managers.",
            features: [
                "Live Dashboard & Pitch",
                "League Race Charts",
                "5 AI Tactical Insights / mo",
                "Community Discord Access"
            ],
            cta: "Current Plan",
            current: true,
            highlight: false
        },
        {
            name: "Season Pass",
            price: "£14.99",
            period: "/season",
            description: "The ultimate edge for serious title contenders.",
            features: [
                "Everything in Free",
                "Unlimited Gaffer's Verdicts",
                "Unlimited Team Audits",
                "Chief Scout Pro (Top 10 Picks)",
                "Price Change Predictor",
                "No Advertisements"
            ],
            cta: "Join the Elite",
            current: false,
            highlight: true
        },
        {
            name: "Credit Pack",
            price: "£0.99",
            period: "/10 credits",
            description: "Perfect for a quick tactical boost.",
            features: [
                "10 Instant AI Insights",
                "No Subscription Required",
                "Valid for the whole Season",
                "Use on Audit or Planner"
            ],
            cta: "Top Up Now",
            current: false,
            highlight: false
        }
    ];

    return (
        <main className="tc-surface min-h-dvh px-4 pb-20 pt-12 relative overflow-hidden">
            {/* Background Accents */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] bg-[color:var(--accent)]/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="mx-auto max-w-6xl space-y-12">
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                    <Badge variant="primary" className="px-4 py-1 animate-glow">
                        <Star className="mr-2 h-3 w-3 fill-current" />
                        Upgrade Your Campaign
                    </Badge>
                    <Typography variant="display" weight="black" className="text-5xl">
                        Unlock the <span className="text-[color:var(--accent)]">Locker Room</span>
                    </Typography>
                    <Typography className="text-lg text-[color:var(--text-secondary)]">
                        Get unlimited tactical insights from The Gaffer and find the hidden gems with The Chief Scout. 
                        Professional tools for professional managers.
                    </Typography>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <Card 
                            key={plan.name} 
                            className={`p-10 flex flex-col gap-8 relative overflow-hidden transition-all duration-500 ${plan.highlight ? 'border-[color:var(--accent)] ring-2 ring-[color:var(--accent)]/20 scale-105' : ''}`}
                            glass
                        >
                            {plan.highlight && (
                                <div className="absolute top-0 right-0">
                                    <div className="bg-[color:var(--accent)] text-[color:var(--accent-contrast)] text-[10px] font-black px-4 py-1 uppercase tracking-widest rotate-45 translate-x-4 translate-y-4 shadow-lg">
                                        Best Value
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Typography variant="caption" weight="black" className="opacity-50">{plan.name}</Typography>
                                <div className="flex items-baseline gap-1">
                                    <Typography variant="display" className="text-4xl">{plan.price}</Typography>
                                    {plan.period && <Typography variant="caption" className="font-bold opacity-60">{plan.period}</Typography>}
                                </div>
                                <Typography className="text-sm text-[color:var(--text-secondary)] leading-relaxed">
                                    {plan.description}
                                </Typography>
                            </div>

                            <div className="space-y-4 flex-1">
                                {plan.features.map(feature => (
                                    <div key={feature} className="flex items-center gap-3">
                                        <div className={`p-1 rounded-full ${plan.highlight ? 'bg-cyan-500/20 text-cyan-500' : 'bg-[color:var(--surface-hover)] text-[color:var(--text-tertiary)]'}`}>
                                            <Check className="h-3 w-3 stroke-[3px]" />
                                        </div>
                                        <Typography className="text-sm font-medium">{feature}</Typography>
                                    </div>
                                ))}
                            </div>

                            <Button 
                                variant={plan.highlight ? 'primary' : 'secondary'} 
                                className="w-full py-4 text-sm uppercase tracking-widest font-black"
                                asChild={!plan.current}
                            >
                                {plan.current ? (
                                    <span>{plan.cta}</span>
                                ) : (
                                    <Link href={`/${params.entryId}`}>{plan.cta}</Link>
                                )}
                            </Button>
                        </Card>
                    ))}
                </div>

                <div className="pt-20 border-t border-[color:var(--surface-border)] border-dashed text-center space-y-8">
                    <Typography variant="title" weight="black">Trusted by Elite Managers</Typography>
                    <div className="flex flex-wrap justify-center gap-12 opacity-30 grayscale">
                         {/* Symbolic Sponsor Logos or PL badges */}
                         <div className="flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6" />
                            <Typography weight="black" className="uppercase tracking-tighter">Verified AI Analysis</Typography>
                         </div>
                         <div className="flex items-center gap-2">
                            <Zap className="h-6 w-6" />
                            <Typography weight="black" className="uppercase tracking-tighter">Live Data Engine</Typography>
                         </div>
                         <div className="flex items-center gap-2">
                            <Trophy className="h-6 w-6" />
                            <Typography weight="black" className="uppercase tracking-tighter">Season Long Support</Typography>
                         </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
