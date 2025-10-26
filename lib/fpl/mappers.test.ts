import { describe, expect, it } from "vitest";
import { mapLatestGameweek, mapProfile, mapTotals } from "./mappers";
import type { EntryHistory, EntryProfile } from "./schemas";

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
