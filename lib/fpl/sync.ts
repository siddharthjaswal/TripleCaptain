import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const prisma = new PrismaClient();
const API_BASE = "https://fantasy.premierleague.com/api";

async function fetchFromFpl(path: string) {
    const response = await fetch(`${API_BASE}${path}`, {
        headers: {
            "User-Agent": "triple-captain-sync/0.1",
            Accept: "application/json",
        },
    });
    if (!response.ok) throw new Error(`FPL request failed: ${response.status}`);
    return response.json();
}

export async function syncFplData() {
    console.log('Starting FPL data sync...');
    
    try {
        const bootstrap = await fetchFromFpl("/bootstrap-static/");
        const fixtures = await fetchFromFpl("/fixtures/");

        // 1. Sync Teams
        console.log(`Syncing ${bootstrap.teams.length} teams...`);
        for (const team of bootstrap.teams) {
            await prisma.team.upsert({
                where: { id: team.id },
                update: {
                    name: team.name,
                    shortName: team.short_name,
                    code: team.code,
                },
                create: {
                    id: team.id,
                    name: team.name,
                    shortName: team.short_name,
                    code: team.code,
                },
            });
        }

        // 2. Sync Gameweeks
        console.log(`Syncing ${bootstrap.events.length} gameweeks...`);
        for (const event of bootstrap.events) {
            await prisma.gameweek.upsert({
                where: { id: event.id },
                update: {
                    name: event.name,
                    deadlineTime: new Date(event.deadline_time),
                    finished: event.finished,
                    isCurrent: event.is_current,
                    isNext: event.is_next,
                },
                create: {
                    id: event.id,
                    name: event.name,
                    deadlineTime: new Date(event.deadline_time),
                    finished: event.finished,
                    isCurrent: event.is_current,
                    isNext: event.is_next,
                },
            });
        }

        // 3. Sync Players
        console.log(`Syncing ${bootstrap.elements.length} players...`);
        for (const player of bootstrap.elements) {
            await prisma.player.upsert({
                where: { id: player.id },
                update: {
                    webName: player.web_name,
                    firstName: player.first_name,
                    secondName: player.second_name,
                    elementType: player.element_type,
                    teamId: player.team,
                    photo: player.photo,
                    epNext: parseFloat(player.ep_next || '0'),
                    epThis: parseFloat(player.ep_this || '0'),
                    form: parseFloat(player.form || '0'),
                    nowCost: player.now_cost || 0,
                    selectedByPercent: parseFloat(player.selected_by_percent || '0'),
                    pointsPerGame: parseFloat(player.points_per_game || '0'),
                    minutes: player.minutes || 0,
                    chanceOfPlayingNext: player.chance_of_playing_next_round,
                },
                create: {
                    id: player.id,
                    webName: player.web_name,
                    firstName: player.first_name,
                    secondName: player.second_name,
                    elementType: player.element_type,
                    teamId: player.team,
                    photo: player.photo,
                    epNext: parseFloat(player.ep_next || '0'),
                    epThis: parseFloat(player.ep_this || '0'),
                    form: parseFloat(player.form || '0'),
                    nowCost: player.now_cost || 0,
                    selectedByPercent: parseFloat(player.selected_by_percent || '0'),
                    pointsPerGame: parseFloat(player.points_per_game || '0'),
                    minutes: player.minutes || 0,
                    chanceOfPlayingNext: player.chance_of_playing_next_round,
                },
            });
        }

        // 4. Sync Fixtures
        console.log(`Syncing ${fixtures.length} fixtures...`);
        for (const fixture of fixtures) {
            await prisma.fixture.upsert({
                where: { id: fixture.id },
                update: {
                    gameweekId: fixture.event,
                    homeTeamId: fixture.team_h,
                    awayTeamId: fixture.team_a,
                    homeScore: fixture.team_h_score,
                    awayScore: fixture.team_a_score,
                    difficultyH: fixture.team_h_difficulty,
                    difficultyA: fixture.team_a_difficulty,
                    kickoffTime: fixture.kickoff_time ? new Date(fixture.kickoff_time) : null,
                    finished: fixture.finished,
                },
                create: {
                    id: fixture.id,
                    gameweekId: fixture.event,
                    homeTeamId: fixture.team_h,
                    awayTeamId: fixture.team_a,
                    homeScore: fixture.team_h_score,
                    awayScore: fixture.team_a_score,
                    difficultyH: fixture.team_h_difficulty,
                    difficultyA: fixture.team_a_difficulty,
                    kickoffTime: fixture.kickoff_time ? new Date(fixture.kickoff_time) : null,
                    finished: fixture.finished,
                },
            });
        }

        console.log('FPL data sync completed successfully!');
    } catch (error) {
        console.error('Error during FPL sync:', error);
    } finally {
        await prisma.$disconnect();
    }
}
