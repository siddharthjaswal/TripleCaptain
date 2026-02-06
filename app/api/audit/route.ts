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

        const prompt = `You are "Luffy", the FPL Pirate Captain.
Analyze this planned transfer for the next gameweek.
Current Squad: ${JSON.stringify(squad.map((p: any) => ({ name: p.name, team: p.teamCode })))}
Transfers Planned: ${JSON.stringify(transfers.map((t: any) => ({ out: t.out.name, in: t.in.webName })))}
Bank Remaining: £${bank}m

Provide a short, direct pirate-themed verdict on whether this is a "Golden Voyage" or a "Sinking Ship".
Focus on the logic of the swap and the budget impact.
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
