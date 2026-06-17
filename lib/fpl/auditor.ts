import { prisma } from '../prisma';
import { callGemini, isAIConfigured } from './gemini';
import { getEntryPicks } from './client';
import { analyzeSquadVsElite, scorePlayer, getEliteSnapshot } from './brain';
import { narrateAudit } from '../narrate';

interface RawPick {
    element: number;
    is_captain?: boolean;
}

interface PicksData {
    picks: RawPick[];
}

export interface AuditResult {
    healthScore: number;
    critique: string;
    recommendations: string[];
}

/**
 * The Gaffer's team audit. The Brain supplies deterministic facts — engine
 * scores per player, elite-template alignment, captaincy data — and Claude
 * turns them into the Gaffer's verdict. Without AI the audit still works,
 * built entirely from the engine's own analysis.
 */
export async function auditTeam(entryId: number): Promise<AuditResult> {
    const currentGw = await prisma.gameweek.findFirst({ where: { isCurrent: true } });
    if (!currentGw) throw new Error('No current gameweek found');
    const nextGwId = currentGw.id + 1;

    // 1. User squad
    const picksData = (await getEntryPicks(entryId, currentGw.id)) as PicksData;
    const playerIds = picksData.picks.map((p) => p.element);
    const captainId = picksData.picks.find((p) => p.is_captain)?.element ?? null;

    const players = await prisma.player.findMany({
        where: { id: { in: playerIds } },
        include: { team: true },
    });

    // 2. Upcoming fixtures for their clubs (empty in off-season — handled)
    const teamIds = players.map((p) => p.teamId);
    const upcomingFixtures = await prisma.fixture.findMany({
        where: {
            gameweekId: { gte: nextGwId, lte: nextGwId + 3 },
            OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
        },
        include: { homeTeam: true, awayTeam: true },
    });

    // 3. Brain facts: elite comparison + engine scores
    const elite = await analyzeSquadVsElite(playerIds, captainId, currentGw.id);
    const snapshot = elite.snapshot ?? (await getEliteSnapshot(currentGw.id));
    const eliteById = new Map((snapshot?.players ?? []).map((p) => [p.id, p]));

    const scored = players.map((p) => {
        const fixtures = upcomingFixtures.filter(
            (f) => f.homeTeamId === p.teamId || f.awayTeamId === p.teamId,
        );
        const ease =
            fixtures.length > 0
                ? 1 -
                  fixtures.reduce((sum, f) => {
                      const isHome = f.homeTeamId === p.teamId;
                      return sum + ((isHome ? f.difficultyH : f.difficultyA) ?? 3);
                  }, 0) /
                      (fixtures.length * 5)
                : null;
        const { score, reasons } = scorePlayer(p, eliteById.get(p.id), ease);
        return { p, fixtures, score, reasons };
    });

    const teamData = scored.map(({ p, fixtures, score, reasons }) => ({
        name: p.webName,
        position: p.elementType === 1 ? 'GK' : p.elementType === 2 ? 'DEF' : p.elementType === 3 ? 'MID' : 'FWD',
        team: p.team.name,
        price: p.nowCost / 10,
        form: p.form,
        epNext: p.epNext,
        ownership: p.selectedByPercent,
        eliteOwnershipPct: eliteById.get(p.id)?.elitePct ?? 0,
        engineScore: score,
        engineNotes: reasons,
        fixtures: fixtures.map((f) => {
            const isHome = f.homeTeamId === p.teamId;
            const opponent = isHome ? f.awayTeam.shortName : f.homeTeam.shortName;
            const difficulty = isHome ? f.difficultyH : f.difficultyA;
            return `${opponent}(${isHome ? 'H' : 'A'})-Diff:${difficulty}`;
        }),
    }));

    let auditResult: AuditResult;

    if (isAIConfigured()) {
        const prompt = `You are "The Gaffer", a legendary English football manager and FPL tactical expert.
Audit this FPL squad. Our scouting engine has already done the maths — ground EVERY claim in the data below; do not invent stats.

SQUAD (with engine scores 0-100 and notes): ${JSON.stringify(teamData)}

ELITE INTELLIGENCE (from the squads of the world's top ${snapshot?.sample ?? 50} FPL managers):
- Template alignment: this squad owns ${elite.templateAlignmentPct}% of the elite template (players >50% elite ownership).
- Elite-template players they're MISSING: ${JSON.stringify(elite.missingTemplate)}
- Most-captained by elites: ${JSON.stringify(elite.eliteCaptain)} — this user's captain has ${elite.userCaptainEliteCapPct}% elite captaincy.
- Elite formations in use: ${JSON.stringify(snapshot?.formations ?? {})}, avg bank £${snapshot?.avgBank ?? '?'}m, avg team value £${snapshot?.avgTeamValue ?? '?'}m.

Provide your audit as JSON:
- healthScore: 0-100 (anchor it to the engine scores + template alignment)
- critique: a few paragraphs in a blunt, professional, slightly cheeky English manager tone. Use footballing terms ("squeaky bum time", "park the bus", "clinical"). Reference the elite intelligence explicitly.
- recommendations: array of 3-5 specific, actionable transfer/strategy tips (name names from the missing-template list when sensible).

Return ONLY the JSON.`;

        const responseText = await callGemini(prompt);
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Invalid AI response');
        auditResult = JSON.parse(jsonMatch[0]) as AuditResult;
    } else {
        // Zero-token audit — the narrator turns engine facts into Gaffer prose.
        const ranked = [...scored].sort((a, b) => b.score - a.score);
        const avg = ranked.length ? ranked.reduce((s, x) => s + x.score, 0) / ranked.length : 0;
        const healthScore = Math.round(0.7 * avg + 0.3 * elite.templateAlignmentPct);
        const narrated = narrateAudit({
            avgScore: Math.round(avg),
            healthScore,
            strongest: ranked.slice(0, 3).map((s) => ({ name: s.p.webName, score: Math.round(s.score) })),
            weakest: [...ranked].reverse().slice(0, 3).map((s) => ({ name: s.p.webName, score: Math.round(s.score) })),
            templateAlignmentPct: elite.templateAlignmentPct,
            missingTemplate: elite.missingTemplate,
            eliteCaptain: elite.eliteCaptain,
            userCaptainEliteCapPct: elite.userCaptainEliteCapPct,
        });
        auditResult = { healthScore, ...narrated };
    }

    await prisma.teamAudit.create({
        data: {
            entryId,
            gameweek: currentGw.id,
            healthScore: auditResult.healthScore,
            critique: auditResult.critique,
            suggestions: auditResult.recommendations as object,
        },
    });

    return auditResult;
}

