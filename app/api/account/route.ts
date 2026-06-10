import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const entryId = searchParams.get('entryId');

    if (!entryId) {
        return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    try {
        const id = parseInt(entryId);
        let account = await prisma.fplAccount.findUnique({
            where: { entryId: id }
        });

        if (!account) {
            account = await prisma.fplAccount.create({
                data: { entryId: id, credits: 5 }
            });
        }

        return NextResponse.json({ success: true, account });
    } catch (error) {
        console.error('Account API error:', error);
        return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 });
    }
}
