import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const position = searchParams.get('position'); // 1, 2, 3, 4
    const maxCost = searchParams.get('maxCost') ? parseInt(searchParams.get('maxCost')!) : undefined;

    try {
        const players = await prisma.player.findMany({
            where: {
                OR: [
                    { webName: { contains: query, mode: 'insensitive' } },
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { secondName: { contains: query, mode: 'insensitive' } },
                ],
                ...(position && { elementType: parseInt(position) }),
                ...(maxCost && { nowCost: { lte: maxCost } }),
            },
            include: { team: true },
            orderBy: [
                { epNext: 'desc' },
                { form: 'desc' },
            ],
            take: 20
        });

        return NextResponse.json({ success: true, players });
    } catch (error) {
        console.error('Player search error:', error);
        return NextResponse.json({ error: 'Failed to search players' }, { status: 500 });
    }
}
