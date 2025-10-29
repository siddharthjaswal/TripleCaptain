import { describe, expect, it } from "vitest";
import {
  mapClassicLeagueStandings,
  mapClassicLeagueSummaries,
  mapLatestGameweek,
  mapProfile,
  mapTotals,
} from "./mappers";
import type {
  ClassicLeagueStandings,
  EntryHistory,
  EntryPicks,
  EntryProfile,
  EntryProfileLeagueSnippet,
  EventLive,
} from "./schemas";

const profile: EntryProfile = {
  id: 1234,
  name: "Test FC",
  player_first_name: "Alex",
  player_last_name: "Smith",
  summary_overall_points: 1987,
  summary_overall_rank: 125_000,
  summary_event_points: 62,
  summary_event_rank: 540_000,
  current_event: 10,
};

const history: EntryHistory = {
  current: [
    {
      event: 9,
      points: 55,
      total_points: 1925,
      rank: 210_000,
      rank_sort: 210_000,
      overall_rank: 110_000,
      event_transfers: 1,
      event_transfers_cost: 4,
      value: 1027,
      bank: 23,
      points_on_bench: 5,
    },
    {
      event: 10,
      points: 62,
      total_points: 1987,
      rank: 190_000,
      rank_sort: 190_000,
      overall_rank: 125_000,
      event_transfers: 2,
      event_transfers_cost: 4,
      value: 1031,
      bank: 12,
      points_on_bench: 7,
    },
  ],
  chips: [
    {
      name: "wildcard",
      event: 8,
      time: "2024-09-28T11:00:00Z",
    },
  ],
  past: [],
};

const classicLeagues: EntryProfileLeagueSnippet[] = [
  {
    id: 111,
    name: "Work League",
    short_name: "Work",
    entry_rank: 12,
    entry_last_rank: 15,
  },
  {
    id: 222,
    name: "Friends League",
    short_name: null,
    entry_rank: 5,
    entry_last_rank: 6,
  },
];

const leagueStandings: ClassicLeagueStandings = {
  league: {
    id: 111,
    name: "Work League",
    created: "2024-06-01T11:00:00Z",
  },
  new_entries: {
    has_next: false,
    results: [],
  },
  standings: {
    has_next: false,
    page: 1,
    results: [
      {
        id: 1,
        entry: 987,
        entry_name: "Test FC",
        player_name: "Alex Smith",
        rank: 1,
        last_rank: 2,
        points: 68,
        total: 1987,
      },
    ],
  },
};

describe("mapProfile", () => {
  it("returns simplified profile", () => {
    const dto = mapProfile(profile);
    expect(dto).toEqual({
      entryId: 1234,
      teamName: "Test FC",
      managerName: "Alex Smith",
      overallPoints: 1987,
      overallRank: 125_000,
    });
  });
});

describe("mapClassicLeagueSummaries", () => {
  it("maps classic league snippets", () => {
    const summaries = mapClassicLeagueSummaries(classicLeagues);
    expect(summaries).toHaveLength(2);
    expect(summaries[0]).toEqual({
      id: 111,
      name: "Work League",
      shortName: "Work",
      entryRank: 12,
      entryLastRank: 15,
      type: "classic",
    });
  });
});

describe("mapClassicLeagueStandings", () => {
  it("maps standings into DTO", () => {
    const dto = mapClassicLeagueStandings(leagueStandings, { gameweek: 10 });
    expect(dto.leagueName).toBe("Work League");
    expect(dto.gameweek).toBe(10);
    expect(dto.entries[0]).toEqual({
      entryId: 987,
      entryName: "Test FC",
      playerName: "Alex Smith",
      rank: 1,
      lastRank: 2,
      points: 68,
      totalPoints: 1987,
    });
  });
});

describe("mapTotals", () => {
  it("maps totals with current event", () => {
    const dto = mapTotals(profile, 10);
    expect(dto).toEqual({
      entryId: 1234,
      currentEvent: 10,
      totalPoints: 1987,
      overallRank: 125_000,
    });
  });
});

describe("mapLatestGameweek", () => {
  it("uses current event record", () => {
    const dto = mapLatestGameweek({
      entryId: 1234,
      currentEvent: 10,
      history,
      isLive: false,
    });

    expect(dto).toEqual({
      entryId: 1234,
      event: 10,
      points: 62,
      rank: 190_000,
      pointsOnBench: 7,
      chipUsed: null,
      isLive: false,
      players: [],
    });
  });

  it("falls back to latest available when event missing", () => {
    const dto = mapLatestGameweek({
      entryId: 1234,
      currentEvent: 11,
      history,
      isLive: true,
    });

    expect(dto.event).toBe(10);
    expect(dto.players).toEqual([]);
  });

  it("maps picks, chip info, and player statistics", () => {
    const dto = mapLatestGameweek({
      entryId: 1234,
      currentEvent: 10,
      history,
      isLive: false,
      picks: picksFixture,
      liveData: liveFixture,
      elements: bootstrapElements,
    });

    expect(dto.chipUsed).toBe("triple_captain");
    expect(dto.pointsOnBench).toBe(9);
    expect(dto.players).toHaveLength(3);
    const captain = dto.players.find((player) => player.isCaptain);
    expect(captain?.name).toBe("Captain");
    expect(captain?.points).toBe(15);
    const benchPlayer = dto.players.find((player) => player.isBench);
    expect(benchPlayer?.points).toBe(4);
  });

  it("returns bench picks when squad has no starters", () => {
    const dto = mapLatestGameweek({
      entryId: 1234,
      currentEvent: 10,
      history,
      isLive: false,
      picks: benchOnlyPicks,
      liveData: liveFixture,
      elements: benchElements,
    });

    expect(dto.players).toHaveLength(3);
    expect(dto.players.every((player) => player.isBench)).toBe(true);
    expect(dto.players.map((player) => player.points)).toEqual([6, 3, 1]);
  });

  it("defaults player points to zero when live stats are missing", () => {
    const dto = mapLatestGameweek({
      entryId: 1234,
      currentEvent: 10,
      history,
      isLive: true,
      picks: picksFixture,
      elements: bootstrapElements,
    });

    expect(dto.players).toHaveLength(3);
    dto.players.forEach((player) => {
      expect(player.points).toBe(0);
      expect(player.rawPoints).toBe(0);
    });
  });
});

const benchOnlyPicks: EntryPicks = {
  active_chip: null,
  entry_history: {
    event: 10,
    points: 0,
    total_points: 1950,
    rank: 200_000,
    event_transfers: 0,
    event_transfers_cost: 0,
    points_on_bench: 10,
  },
  picks: [
    {
      element: 4,
      position: 12,
      multiplier: 0,
      is_captain: false,
      is_vice_captain: false,
    },
    {
      element: 5,
      position: 13,
      multiplier: 0,
      is_captain: false,
      is_vice_captain: false,
    },
    {
      element: 6,
      position: 14,
      multiplier: 0,
      is_captain: false,
      is_vice_captain: false,
    },
  ],
};

const benchElements = [
  {
    id: 4,
    web_name: "Bench One",
    element_type: 2,
    team: 1,
    team_code: 3,
    photo: "123456.jpg",
  },
  {
    id: 5,
    web_name: "Bench Two",
    element_type: 3,
    team: 1,
    team_code: 3,
    photo: "234567.jpg",
  },
  {
    id: 6,
    web_name: "Bench Three",
    element_type: 4,
    team: 1,
    team_code: 3,
    photo: "345678.jpg",
  },
];
const bootstrapElements = [
  {
    id: 1,
    web_name: "Keeper",
    element_type: 1,
    team: 1,
    team_code: 3,
    photo: "111111.jpg",
  },
  {
    id: 2,
    web_name: "Captain",
    element_type: 4,
    team: 2,
    team_code: 6,
    photo: "222222.jpg",
  },
  {
    id: 3,
    web_name: "Bench",
    element_type: 3,
    team: 3,
    team_code: 1,
    photo: "333333.jpg",
  },
];

const picksFixture: EntryPicks = {
  active_chip: "triple_captain",
  entry_history: {
    event: 10,
    points: 62,
    total_points: 1987,
    rank: 190_000,
    event_transfers: 2,
    event_transfers_cost: 4,
    points_on_bench: 9,
  },
  picks: [
    {
      element: 1,
      position: 1,
      multiplier: 1,
      is_captain: false,
      is_vice_captain: false,
    },
    {
      element: 2,
      position: 2,
      multiplier: 3,
      is_captain: true,
      is_vice_captain: false,
    },
    {
      element: 3,
      position: 12,
      multiplier: 0,
      is_captain: false,
      is_vice_captain: true,
    },
  ],
};

const liveFixture: EventLive = {
  elements: [
    {
      id: 1,
      stats: {
        total_points: 2,
        minutes: null,
        goals_scored: null,
        assists: null,
        clean_sheets: null,
        goals_conceded: null,
        own_goals: null,
        penalties_saved: null,
        penalties_missed: null,
        yellow_cards: null,
        red_cards: null,
        saves: null,
        bonus: null,
        bps: null,
        influence: null,
        creativity: null,
        threat: null,
        ict_index: "0",
      },
    },
    {
      id: 2,
      stats: {
        total_points: 5,
        minutes: null,
        goals_scored: null,
        assists: null,
        clean_sheets: null,
        goals_conceded: null,
        own_goals: null,
        penalties_saved: null,
        penalties_missed: null,
        yellow_cards: null,
        red_cards: null,
        saves: null,
        bonus: null,
        bps: null,
        influence: null,
        creativity: null,
        threat: null,
        ict_index: "0",
      },
    },
    {
      id: 3,
      stats: {
        total_points: 4,
        minutes: null,
        goals_scored: null,
        assists: null,
        clean_sheets: null,
        goals_conceded: null,
        own_goals: null,
        penalties_saved: null,
        penalties_missed: null,
        yellow_cards: null,
        red_cards: null,
        saves: null,
        bonus: null,
        bps: null,
        influence: null,
        creativity: null,
        threat: null,
        ict_index: "0",
      },
    },
    {
      id: 4,
      stats: {
        total_points: 6,
        minutes: null,
        goals_scored: null,
        assists: null,
        clean_sheets: null,
        goals_conceded: null,
        own_goals: null,
        penalties_saved: null,
        penalties_missed: null,
        yellow_cards: null,
        red_cards: null,
        saves: null,
        bonus: null,
        bps: null,
        influence: null,
        creativity: null,
        threat: null,
        ict_index: "0",
      },
    },
    {
      id: 5,
      stats: {
        total_points: 3,
        minutes: null,
        goals_scored: null,
        assists: null,
        clean_sheets: null,
        goals_conceded: null,
        own_goals: null,
        penalties_saved: null,
        penalties_missed: null,
        yellow_cards: null,
        red_cards: null,
        saves: null,
        bonus: null,
        bps: null,
        influence: null,
        creativity: null,
        threat: null,
        ict_index: "0",
      },
    },
    {
      id: 6,
      stats: {
        total_points: 1,
        minutes: null,
        goals_scored: null,
        assists: null,
        clean_sheets: null,
        goals_conceded: null,
        own_goals: null,
        penalties_saved: null,
        penalties_missed: null,
        yellow_cards: null,
        red_cards: null,
        saves: null,
        bonus: null,
        bps: null,
        influence: null,
        creativity: null,
        threat: null,
        ict_index: "0",
      },
    },
  ],
};
