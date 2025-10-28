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
  EntryProfile,
  EntryProfileLeagueSnippet,
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
    const dto = mapClassicLeagueStandings(leagueStandings);
    expect(dto.leagueName).toBe("Work League");
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
  });

  it("prefers chip info from picks when present", () => {
    const dto = mapLatestGameweek({
      entryId: 1234,
      currentEvent: 10,
      history,
      isLive: false,
      picks: {
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
        picks: [],
      },
    });

    expect(dto.chipUsed).toBe("triple_captain");
    expect(dto.pointsOnBench).toBe(9);
  });
});
