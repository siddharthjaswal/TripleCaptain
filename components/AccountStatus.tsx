'use client';

import { useState, useEffect } from 'react';
import { Card, Typography, Badge, Button } from './ui';
import { Zap, Coins, Star, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function AccountStatus({ entryId }: { entryId: number }) {
    const [account, setAccount] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAccount = async () => {
            try {
                const res = await fetch(`/api/account?entryId=${entryId}`);
                const data = await res.json();
                if (data.success) {
                    setAccount(data.account);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchAccount();
    }, [entryId]);

    if (loading) return <Loader2 className="h-4 w-4 animate-spin opacity-20" />;

    return (
        <div className="flex items-center gap-3">
            {account?.isPro ? (
                <Badge variant="primary" className="bg-gradient-to-r from-yellow-500 to-amber-600 border-none shadow-lg shadow-yellow-500/20 px-3 py-1 animate-glow">
                    <Star className="mr-1.5 h-3 w-3 fill-current" />
                    <span className="text-[10px] font-black tracking-widest">PRO MANAGER</span>
                </Badge>
            ) : (
                <Link href={`/${entryId}/pro`}>
                    <Card className="flex items-center gap-2 px-3 py-1.5 border-[color:var(--accent)]/30 hover:border-[color:var(--accent)] bg-[color:var(--accent)]/5 group transition-all" hover={false}>
                        <div className="p-1 rounded bg-[color:var(--accent)]/10 text-[color:var(--accent)] group-hover:bg-[color:var(--accent)] group-hover:text-white transition-colors">
                            <Coins className="h-3 w-3" />
                        </div>
                        <Typography variant="caption" weight="black" className="text-[10px] tracking-widest">
                            {account?.credits ?? 0} CREDITS
                        </Typography>
                        <Zap className="h-2.5 w-2.5 text-[color:var(--brand-gold)] fill-current animate-pulse" />
                    </Card>
                </Link>
            )}
        </div>
    );
}
