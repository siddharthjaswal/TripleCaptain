import { NextRequest, NextResponse } from 'next/server';
import { auditTeam } from '@/lib/fpl/auditor';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const entryId = searchParams.get('entryId');

    if (!entryId) {
        return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    try {
        const audit = await auditTeam(parseInt(entryId));
        return NextResponse.json({ success: true, audit });
    } catch (error) {
        console.error('Audit API error:', error);
        return NextResponse.json({ error: 'Failed to perform team audit' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { squad, transfers, bank } = body;

        const prompt = `You are "Luffy", the legendary Pirate King of FPL.
Analyze these planned transfers for the next gameweek.
Current Squad Overview: ${JSON.stringify(squad.map((p: any) => ({ name: p.name, team: p.teamCode, pos: p.position })))}
Transfers Made in Planner: ${JSON.stringify(transfers.map((t: any) => ({ 
    out: t.out.name, 
    in: t.in.webName,
    pointsGain: (t.in.epNext - (t.out.epNext || 0)).toFixed(1)
})))}
Bank Remaining: £${bank.toFixed(1)}m

Critique this strategy from a competitive FPL perspective:
1. Is the "loot" (expected points gain) worth the cost?
2. Are they ignoring any "sea monsters" (injured players or terrible fixtures)?
3. Is the squad balance (bench strength) still solid?

Provide a detailed, direct pirate-themed verdict. Use "Golden Voyage" for good moves and "Sinking Ship" for bad ones.
Focus on the specific players being brought in.
Return ONLY the verdict text.`;

        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });
        
        const result = await model.generateContent(prompt);
        const verdict = result.response.text();

        return NextResponse.json({ success: true, audit: { critique: verdict } });
    } catch (error) {
        console.error('Audit POST error:', error);
        return NextResponse.json({ error: 'Failed to analyze plan' }, { status: 500 });
    }
}
