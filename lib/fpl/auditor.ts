import { prisma } from '../prisma';
import { callGemini } from './gemini';
import { getEntryPicks } from './client';

interface Pick {
    element: number;
}

interface PicksData {
    picks: Pick[];
}

export async function auditTeam(entryId: number) {
    console.log(`Auditing team for entry ${entryId}...`);
    
    // 1. Get current GW
    const currentGw = await prisma.gameweek.findFirst({
        where: { isCurrent: true }
    });
    
    if (!currentGw) throw new Error("No current gameweek found");
    const nextGwId = currentGw.id + 1;

    // 2. Get user picks
    const picksData = await getEntryPicks(entryId, currentGw.id) as PicksData;
    const playerIds = picksData.picks.map((p: { element: number }) => p.element);

    // 3. Fetch player details from DB
    const players = await prisma.player.findMany({
        where: { id: { in: playerIds } },
        include: { team: true }
    });

    // 4. Get upcoming fixtures for these teams
    const teamIds = players.map((p: { teamId: number }) => p.teamId);
    const upcomingFixtures = await prisma.fixture.findMany({
        where: {
            gameweekId: { gte: nextGwId, lte: nextGwId + 3 },
            OR: [
                { homeTeamId: { in: teamIds } },
                { awayTeamId: { in: teamIds } }
            ]
        },
        include: {
            homeTeam: true,
            awayTeam: true
        }
    });

    // 5. Prepare prompt for AI
    const teamData = players.map((p) => ({
        name: p.webName,
        position: p.elementType === 1 ? 'GK' : p.elementType === 2 ? 'DEF' : p.elementType === 3 ? 'MID' : 'FWD',
        team: p.team.name,
        form: p.form,
        epNext: p.epNext,
        cost: p.nowCost / 10,
        ownership: p.selectedByPercent,
        fixtures: upcomingFixtures
            .filter((f) => f.homeTeamId === p.teamId || f.awayTeamId === p.teamId)
            .map((f) => {
                const isHome = f.homeTeamId === p.teamId;
                const opponent = isHome ? f.awayTeam.shortName : f.homeTeam.shortName;
                const difficulty = isHome ? f.difficultyH : f.difficultyA;
                return `${opponent}(${isHome ? 'H' : 'A'})-Diff:${difficulty}`;
            })
    }));

    const prompt = `You are "The Gaffer", a legendary English football manager and FPL tactical expert. 
Audit the following FPL team for the next 3 gameweeks.
Team Data: ${JSON.stringify(teamData)}

Provide your audit in JSON format with:
- healthScore: (0-100)
- critique: A few paragraphs in a blunt, professional, yet slightly cheeky English manager tone. Focus on tactical weaknesses, fixture traps, and standout assets. Use footballing terms like "squeaky bum time", "park the bus", "clinical", etc.
- recommendations: Array of specific transfer or strategy tips.

Return ONLY the JSON.`;

    const responseText = await callGemini(prompt);
    
    // Clean JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response");
    const auditResult = JSON.parse(jsonMatch[0]);

    if (auditResult) {
        // Save to DB
        await prisma.teamAudit.create({
            data: {
                entryId,
                gameweek: currentGw.id,
                healthScore: auditResult.healthScore,
                critique: auditResult.critique,
                suggestions: auditResult.recommendations
            }
        });
    }

    return auditResult;
}
