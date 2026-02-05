import { NextResponse } from 'next/server';
import { scoutDifferentials } from '@/lib/fpl/scout';

export async function GET() {
    try {
        const picks = await scoutDifferentials();
        return NextResponse.json({ success: true, picks });
    } catch (error) {
        console.error('Scout API error:', error);
        return NextResponse.json({ error: 'Failed to scout differentials' }, { status: 500 });
    }
}
