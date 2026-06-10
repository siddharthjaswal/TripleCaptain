import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/fpl/gemini';
import { auditTeam } from '@/lib/fpl/auditor';
import { prisma } from '@/lib/prisma';
import { auth, isAuthConfigured } from '@/auth';

/** Logged-in Pro users (with this FPL entry linked) bypass entry credits. */
async function isProUser(entryId: number): Promise<boolean> {
    if (!isAuthConfigured()) return false;
    try {
        const session = await auth();
        if (!session?.user) return false;
        const u = session.user as { isPro?: boolean; entryId?: number | null };
        return Boolean(u.isPro && (u.entryId === null || u.entryId === entryId));
    } catch {
        return false;
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const entryId = searchParams.get('entryId');

    if (!entryId) {
        return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    try {
        const id = parseInt(entryId);
        const proUser = await isProUser(id);

        // Check credits (skipped entirely for logged-in Pro users)
        const account = await prisma.fplAccount.findUnique({ where: { entryId: id } });
        if (!proUser && account && !account.isPro && account.credits <= 0) {
            return NextResponse.json({ error: 'Out of credits', needsUpgrade: true }, { status: 402 });
        }

        const audit = await auditTeam(id);

        // Deduct credit if not pro
        if (!proUser && account && !account.isPro) {
            await prisma.fplAccount.update({
                where: { entryId: id },
                data: { credits: { decrement: 1 } }
            });
        }

        return NextResponse.json({ success: true, audit });
    } catch (error) {
        console.error('Audit API error:', error);
        return NextResponse.json({ error: 'Failed to perform team audit' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { squad, transfers, bank, entryId } = body;

        // Check credits if entryId is provided
        if (entryId) {
            const account = await prisma.fplAccount.findUnique({ where: { entryId: parseInt(entryId) } });
            if (account && !account.isPro && account.credits <= 0) {
                return NextResponse.json({ error: 'Out of credits', needsUpgrade: true }, { status: 402 });
            }
        }

        const prompt = `You are "The Gaffer", a tactical FPL genius.
Analyze this planned transfer for the next gameweek.
Current Squad Overview: ${JSON.stringify(squad.map((p: { name: string; teamCode: number; position: string }) => ({ name: p.name, team: p.teamCode, pos: p.position })))}
Transfers Planned in Planner: ${JSON.stringify(transfers.map((t: { out: { name: string; epNext: number }; in: { webName: string; epNext: number } }) => ({ 
    out: t.out.name, 
    in: t.in.webName,
    pointsGain: (t.in.epNext - (t.out.epNext || 0)).toFixed(1)
})))}
Bank Remaining: £${bank.toFixed(1)}m

Provide a short, direct football-themed verdict. Use "Title Contender" for good moves and "Relegation Form" for bad ones.
Focus on the tactical logic and the value for money.
Return ONLY the verdict text.`;

        const verdict = await callGemini(prompt);

        // Deduct credit
        if (entryId) {
            const account = await prisma.fplAccount.findUnique({ where: { entryId: parseInt(entryId) } });
            if (account && !account.isPro) {
                await prisma.fplAccount.update({
                    where: { entryId: parseInt(entryId) },
                    data: { credits: { decrement: 1 } }
                });
            }
        }

        return NextResponse.json({ success: true, audit: { critique: verdict } });
    } catch (error) {
        console.error('Audit POST error:', error);
        return NextResponse.json({ error: 'Failed to analyze plan' }, { status: 500 });
    }
}
