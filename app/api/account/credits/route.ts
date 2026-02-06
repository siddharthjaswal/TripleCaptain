import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const { entryId, credits } = await req.json();
        
        const account = await prisma.account.update({
            where: { entryId: parseInt(entryId) },
            data: { 
                credits: { increment: credits || 0 },
                isPro: credits === 9999 // Hack for Pro for now
            }
        });

        return NextResponse.json({ success: true, account });
    } catch (error) {
        console.error('Account update error:', error);
        return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 });
    }
}
