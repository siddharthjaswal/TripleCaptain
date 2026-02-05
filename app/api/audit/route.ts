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
