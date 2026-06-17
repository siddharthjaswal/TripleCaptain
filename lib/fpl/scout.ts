import { prisma } from '../prisma';
import { callGemini, isAIConfigured } from './gemini';
import { rankPlayers, type PlayerVerdict } from './brain';
import { narrateScoutPick } from '../narrate';

interface Pick {
    name: string;
    reasoning: string;
    epNext: number;
    ownership: number;
}

/**
 * Chief Scout differentials. The Brain (deterministic engine + elite-manager
 * learnings) ranks the candidates; Claude only writes the scouting blurbs.
 * Works fully without AI — falls back to the engine's own reasoning.
 */
export async function scoutDifferentials(): Promise<Pick[]> {
    const currentGw = await prisma.gameweek.findFirst({ where: { isCurrent: true } });
    if (!currentGw) throw new Error('No current gameweek found');

    // 1. The Brain ranks low-ownership players (elite conviction, form,
    //    xP, nailedness, value) — no AI involved.
    const candidates = await rankPlayers({ maxOwnership: 12, limit: 10, gameweek: currentGw.id });
    if (candidates.length === 0) return [];

    const enginePicks: Pick[] = candidates.slice(0, 3).map((c) => ({
        name: c.name,
        reasoning: narrateScoutPick({
            name: c.name,
            team: c.team,
            ownership: c.ownership,
            elitePct: c.elitePct,
            eliteEdge: c.eliteEdge,
            form: c.form,
            epNext: c.epNext,
            reasons: c.reasons,
        }),
        epNext: c.epNext,
        ownership: c.ownership,
    }));

    let picks: Pick[] = enginePicks;

    // 2. If AI is available, let it pick the top 3 and write sharper blurbs —
    //    grounded in the engine's data, not its own guesswork.
    if (isAIConfigured()) {
        try {
            const scoutData = candidates.map((c: PlayerVerdict) => ({
                name: c.name,
                team: c.team,
                position: c.position,
                price: c.price,
                ownership: c.ownership,
                epNext: c.epNext,
                form: c.form,
                engineScore: c.score,
                eliteOwnershipPct: c.elitePct,
                eliteVsCrowdEdge: c.eliteEdge,
                engineNotes: c.reasons,
            }));

            const prompt = `You are "The Chief Scout", an expert talent spotter for Premier League clubs.
Our scouting engine (which studies the squads of the world's top 50 FPL managers) has ranked these differential candidates (<12% ownership):
${JSON.stringify(scoutData)}

"eliteOwnershipPct" = how many of the world's top 50 managers own them. "eliteVsCrowdEdge" = elite ownership minus public ownership (a big positive number means the best managers are on him before the crowd).

Pick the top 3 differentials. For each, write "reasoning": 1-2 sentences of professional scouting insight grounded ONLY in the data above (cite the elite numbers when notable).

Format: JSON array of {name, reasoning, epNext, ownership}. Return ONLY the JSON.`;

            const responseText = await callGemini(prompt);
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const aiPicks = JSON.parse(jsonMatch[0]) as Pick[];
                if (Array.isArray(aiPicks) && aiPicks.length > 0) picks = aiPicks;
            }
        } catch (err) {
            console.error('Scout AI narration failed, using engine picks:', err);
        }
    }

    // 3. Persist
    for (const pick of picks) {
        const player = candidates.find((c) => c.name === pick.name);
        if (player) {
            await prisma.differentialPick.create({
                data: {
                    playerId: player.id,
                    gameweek: currentGw.id,
                    reasoning: pick.reasoning,
                    expectedPoints: pick.epNext,
                    ownership: pick.ownership,
                },
            });
        }
    }

    return picks;
}
