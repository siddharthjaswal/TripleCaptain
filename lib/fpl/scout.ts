import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import "dotenv/config";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface Pick {
    name: string;
    reasoning: string;
    epNext: number;
    ownership: number;
}

export async function scoutDifferentials() {
    console.log('Scouting for differentials...');
    
    // 1. Get current GW
    const currentGw = await prisma.gameweek.findFirst({
        where: { isCurrent: true }
    });
    if (!currentGw) throw new Error("No current gameweek found");

    // 2. Find high potential, low ownership players
    const candidates = await prisma.player.findMany({
        where: {
            selectedByPercent: { lt: 10 },
            epNext: { gt: 3.5 },
            minutes: { gt: 400 } // Must be a semi-regular starter
        },
        include: { team: true },
        orderBy: { epNext: 'desc' },
        take: 10
    });

    if (candidates.length === 0) return [];

    // 3. Get fixtures for these players
    const teamIds = candidates.map(c => c.teamId);
    const fixtures = await prisma.fixture.findMany({
        where: {
            gameweekId: { gte: currentGw.id + 1, lte: currentGw.id + 3 },
            OR: [
                { homeTeamId: { in: teamIds } },
                { awayTeamId: { in: teamIds } }
            ]
        },
        include: { homeTeam: true, awayTeam: true }
    });

    // 4. Send to AI for reasoning
    const scoutData = candidates.map(c => ({
        name: c.webName,
        team: c.team.name,
        ownership: c.selectedByPercent,
        epNext: c.epNext,
        fixtures: fixtures
            .filter(f => f.homeTeamId === c.teamId || f.awayTeamId === c.teamId)
            .map(f => {
                const isHome = f.homeTeamId === c.teamId;
                const opponent = isHome ? f.awayTeam.shortName : f.homeTeam.shortName;
                return `${opponent}(${isHome ? 'H' : 'A'})`;
            })
    }));

    const prompt = `You are "The Chief Scout", an expert talent spotter for Premier League clubs.
Analyze these 10 potential differential players (<10% ownership) for the upcoming gameweeks.
Data: ${JSON.stringify(scoutData)}

Provide a list of the top 3 differential picks.
For each pick, provide:
- name
- reasoning: why they are a "hidden gem" or "shrewd signing" right now (use professional scouting terminology).

Format: JSON array of {name, reasoning, epNext, ownership}.
Return ONLY the JSON.`;

    const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const picks = JSON.parse(jsonMatch[0]) as Pick[];

    if (picks.length > 0) {
        // Save to DB
        for (const pick of picks) {
            const player = candidates.find(c => c.webName === pick.name);
            if (player) {
                await prisma.differentialPick.create({
                    data: {
                        playerId: player.id,
                        gameweek: currentGw.id,
                        reasoning: pick.reasoning,
                        expectedPoints: pick.epNext,
                        ownership: pick.ownership
                    }
                });
            }
        }
    }

    return picks;
}
