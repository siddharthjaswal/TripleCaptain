import { NextRequest, NextResponse } from "next/server";
import { getBootstrap, getFixtures } from "@/lib/fpl/client";
import type { PlayerDetailsDTO, FixtureDifficultyDTO } from "@/lib/fpl/dto";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId: playerIdStr } = await context.params;
    const playerId = Number.parseInt(playerIdStr, 10);

    if (Number.isNaN(playerId)) {
      return NextResponse.json(
        { error: "Invalid player ID" },
        { status: 400 }
      );
    }

    // Fetch bootstrap data and fixtures
    const [bootstrap, fixtures] = await Promise.all([
      getBootstrap(),
      getFixtures(),
    ]);

    // Find the player
    const player = bootstrap.elements.find((el: any) => el.id === playerId);

    if (!player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    // Find team info
    const team = bootstrap.teams.find((t: any) => t.id === player.team);
    const teamName = team?.name || "Unknown";
    const teamShort = team?.short_name || "UNK";

    // Map position
    const positionMap: { [key: number]: "GK" | "DEF" | "MID" | "FWD" } = {
      1: "GK",
      2: "DEF",
      3: "MID",
      4: "FWD",
    };
    const position = positionMap[player.element_type] || "MID";

    // Get next 5 fixtures for this team
    const teamFixtures = fixtures
      .filter((f: any) =>
        !f.finished &&
        (f.team_h === player.team || f.team_a === player.team)
      )
      .sort((a: any, b: any) => a.event - b.event)
      .slice(0, 5);

    const nextFixtures: FixtureDifficultyDTO[] = teamFixtures.map((fixture: any) => {
      const isHome = fixture.team_h === player.team;
      const opponentId = isHome ? fixture.team_a : fixture.team_h;
      const opponent = bootstrap.teams.find((t: any) => t.id === opponentId);
      const difficulty = isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;

      return {
        opponent: opponent?.name || "Unknown",
        opponentShort: opponent?.short_name || "UNK",
        difficulty: difficulty || 3,
        isHome,
      };
    });

    // Map status
    const statusMap: { [key: string]: string } = {
      'a': 'Available',
      'd': 'Doubtful',
      'i': 'Injured',
      'u': 'Unavailable',
      's': 'Suspended',
    };

    // Helper to safely get number field
    const getNumber = (val: any): number => {
      if (typeof val === 'number') return val;
      return 0;
    };

    // Helper to safely parse string to number
    const parseString = (val: any): number => {
      if (typeof val === 'string') return Number.parseFloat(val);
      if (typeof val === 'number') return val;
      return 0;
    };

    // Helper to safely get string field
    const getString = (val: any): string | null => {
      if (typeof val === 'string') return val;
      return null;
    };

    // Build PlayerDetailsDTO
    const playerDetails: PlayerDetailsDTO = {
      // Basic Info
      playerId: player.id,
      name: player.web_name,
      fullName: `${player.first_name || ''} ${player.second_name || ''}`.trim(),
      photo: player.photo || null,
      position,
      team: teamName,
      teamShort,
      teamId: player.team,

      // Pricing
      currentPrice: getNumber((player as any).now_cost) / 10, // Convert from 0.1m units to actual price
      costChange: getNumber((player as any).cost_change_start) / 10,

      // Availability
      status: statusMap[getString((player as any).status) || 'a'] || 'Available',
      news: getString((player as any).news),
      chanceOfPlayingNextRound: (player as any).chance_of_playing_next_round ?? null,

      // Season Stats
      totalPoints: getNumber((player as any).total_points),
      pointsPerGame: parseString((player as any).points_per_game),
      minutes: getNumber((player as any).minutes),
      goalsScored: getNumber((player as any).goals_scored),
      assists: getNumber((player as any).assists),
      cleanSheets: getNumber((player as any).clean_sheets),
      goalsConceded: getNumber((player as any).goals_conceded),
      ownGoals: getNumber((player as any).own_goals),
      penaltiesSaved: getNumber((player as any).penalties_saved),
      penaltiesMissed: getNumber((player as any).penalties_missed),
      yellowCards: getNumber((player as any).yellow_cards),
      redCards: getNumber((player as any).red_cards),
      saves: getNumber((player as any).saves),
      bonus: getNumber((player as any).bonus),

      // Performance Metrics
      form: parseString(player.form),
      expectedPoints: parseString(player.ep_next),
      expectedGoals: parseString((player as any).expected_goals),
      expectedAssists: parseString((player as any).expected_assists),
      expectedGoalInvolvements: parseString((player as any).expected_goal_involvements),

      // ICT Index
      ictIndex: parseString((player as any).ict_index),
      influence: parseString((player as any).influence),
      creativity: parseString((player as any).creativity),
      threat: parseString((player as any).threat),

      // Ownership & Popularity
      selectedByPercent: parseString(player.selected_by_percent),
      transfersIn: getNumber((player as any).transfers_in),
      transfersOut: getNumber((player as any).transfers_out),
      transfersInEvent: getNumber((player as any).transfers_in_event),
      transfersOutEvent: getNumber((player as any).transfers_out_event),

      // Fixtures
      nextFixtures,
    };

    return NextResponse.json(playerDetails);
  } catch (error) {
    console.error("Error fetching player details:", error);
    return NextResponse.json(
      { error: "Failed to fetch player details" },
      { status: 500 }
    );
  }
}
