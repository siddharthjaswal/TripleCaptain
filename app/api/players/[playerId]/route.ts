import { NextRequest, NextResponse } from "next/server";
import { getBootstrap, getFixtures } from "@/lib/fpl/client";
import type { PlayerDetailsDTO, FixtureDifficultyDTO } from "@/lib/fpl/dto";
import type { BootstrapElement, BootstrapStatic, Fixture } from "@/lib/fpl/schemas";

type BootstrapTeam = BootstrapStatic["teams"][number];

type PlayerRecord = Record<string, unknown>;

const getNumber = (val: unknown): number => {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const parsed = Number.parseFloat(val);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const parseNumeric = (val: unknown): number => {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const parsed = Number.parseFloat(val);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const getString = (val: unknown): string | null => {
  if (typeof val === "string") return val;
  return null;
};

const getNullableNumber = (val: unknown): number | null => {
  if (typeof val === "number") return val;
  if (val === null) return null;
  return null;
};

const toRecord = (element: BootstrapElement): PlayerRecord =>
  element as PlayerRecord;

const readNumberField = (record: PlayerRecord, key: string): number =>
  getNumber(record[key]);

const readNumericField = (record: PlayerRecord, key: string): number =>
  parseNumeric(record[key]);

const readStringField = (record: PlayerRecord, key: string): string | null =>
  getString(record[key]);

const readNullableNumberField = (
  record: PlayerRecord,
  key: string,
): number | null => getNullableNumber(record[key]);

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
    const player = bootstrap.elements.find(
      (el: BootstrapElement) => el.id === playerId,
    );

    if (!player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    // Find team info
    const team = bootstrap.teams.find(
      (t: BootstrapTeam) => t.id === player.team,
    );
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
      .filter(
        (fixture: Fixture) =>
          !fixture.finished &&
          (fixture.team_h === player.team || fixture.team_a === player.team),
      )
      .sort((a: Fixture, b: Fixture) => {
        const aEvent = a.event ?? Number.MAX_SAFE_INTEGER;
        const bEvent = b.event ?? Number.MAX_SAFE_INTEGER;
        return aEvent - bEvent;
      })
      .slice(0, 5);

    const nextFixtures: FixtureDifficultyDTO[] = teamFixtures.map(
      (fixture: Fixture) => {
        const isHome = fixture.team_h === player.team;
        const opponentId = isHome ? fixture.team_a : fixture.team_h;
        const opponent = bootstrap.teams.find(
          (t: BootstrapTeam) => t.id === opponentId,
        );
        const difficulty = isHome
          ? fixture.team_h_difficulty ?? 3
          : fixture.team_a_difficulty ?? 3;

        return {
          opponent: opponent?.name || "Unknown",
          opponentShort: opponent?.short_name || "UNK",
          difficulty,
          isHome,
        };
      },
    );

    // Map status
    const statusMap: Record<string, string> = {
      a: "Available",
      d: "Doubtful",
      i: "Injured",
      u: "Unavailable",
      s: "Suspended",
    };

    const playerRecord = toRecord(player);

    // Build PlayerDetailsDTO
    const playerDetails: PlayerDetailsDTO = {
      // Basic Info
      playerId: player.id,
      name: player.web_name,
      fullName: `${player.first_name || ""} ${player.second_name || ""}`.trim(),
      photo: player.photo || null,
      position,
      team: teamName,
      teamShort,
      teamId: player.team,

      // Pricing
      currentPrice: readNumberField(playerRecord, "now_cost") / 10, // Convert from 0.1m units to actual price
      costChange: readNumberField(playerRecord, "cost_change_start") / 10,

      // Availability
      status:
        statusMap[readStringField(playerRecord, "status") || "a"] ||
        "Available",
      news: readStringField(playerRecord, "news"),
      chanceOfPlayingNextRound: readNullableNumberField(
        playerRecord,
        "chance_of_playing_next_round",
      ),

      // Season Stats
      totalPoints: readNumberField(playerRecord, "total_points"),
      pointsPerGame: readNumericField(playerRecord, "points_per_game"),
      minutes: readNumberField(playerRecord, "minutes"),
      goalsScored: readNumberField(playerRecord, "goals_scored"),
      assists: readNumberField(playerRecord, "assists"),
      cleanSheets: readNumberField(playerRecord, "clean_sheets"),
      goalsConceded: readNumberField(playerRecord, "goals_conceded"),
      ownGoals: readNumberField(playerRecord, "own_goals"),
      penaltiesSaved: readNumberField(playerRecord, "penalties_saved"),
      penaltiesMissed: readNumberField(playerRecord, "penalties_missed"),
      yellowCards: readNumberField(playerRecord, "yellow_cards"),
      redCards: readNumberField(playerRecord, "red_cards"),
      saves: readNumberField(playerRecord, "saves"),
      bonus: readNumberField(playerRecord, "bonus"),

      // Performance Metrics
      form: parseNumeric(player.form),
      expectedPoints: parseNumeric(player.ep_next),
      expectedGoals: readNumericField(playerRecord, "expected_goals"),
      expectedAssists: readNumericField(playerRecord, "expected_assists"),
      expectedGoalInvolvements: readNumericField(
        playerRecord,
        "expected_goal_involvements",
      ),

      // ICT Index
      ictIndex: readNumericField(playerRecord, "ict_index"),
      influence: readNumericField(playerRecord, "influence"),
      creativity: readNumericField(playerRecord, "creativity"),
      threat: readNumericField(playerRecord, "threat"),

      // Ownership & Popularity
      selectedByPercent: parseNumeric(player.selected_by_percent),
      transfersIn: readNumberField(playerRecord, "transfers_in"),
      transfersOut: readNumberField(playerRecord, "transfers_out"),
      transfersInEvent: readNumberField(playerRecord, "transfers_in_event"),
      transfersOutEvent: readNumberField(playerRecord, "transfers_out_event"),

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
