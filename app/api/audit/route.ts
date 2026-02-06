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

        const prompt = `You are "The Gaffer", a tactical FPL genius.
Analyze this planned transfer for the next gameweek.
Current Squad Overview: ${JSON.stringify(squad.map((p: any) => ({ name: p.name, team: p.teamCode, pos: p.position })))}
Transfers Planned in Planner: ${JSON.stringify(transfers.map((t: any) => ({ 
    out: t.out.name, 
    in: t.in.webName,
    pointsGain: (t.in.epNext - (t.out.epNext || 0)).toFixed(1)
})))}
Bank Remaining: £${bank.toFixed(1)}m

Provide a short, direct football-themed verdict. Use "Title Contender" for good moves and "Relegation Form" for bad ones.
Focus on the tactical logic and the value for money.
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
