import { z } from "zod";

export const BootstrapEventSchema = z.strictObject({
  id: z.number(),
  name: z.string(),
  deadline_time: z.string(),
  is_current: z.boolean(),
  is_next: z.boolean(),
  is_previous: z.boolean(),
});

export const BootstrapStaticSchema = z.strictObject({
  events: z.array(BootstrapEventSchema),
  total_players: z.number(),
});

export const EntryProfileSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    player_first_name: z.string(),
    player_last_name: z.string(),
    summary_overall_points: z.number(),
    summary_overall_rank: z.number().nullable(),
    summary_event_points: z.number(),
    summary_event_rank: z.number().nullable(),
    current_event: z.number().nullable(),
  })
  .passthrough();

export type EntryProfile = z.infer<typeof EntryProfileSchema>;

export const EntryCurrentHistorySchema = z.strictObject({
  event: z.number(),
  points: z.number(),
  total_points: z.number(),
  rank: z.number().nullable(),
  rank_sort: z.number().nullable(),
  overall_rank: z.number().nullable(),
  event_transfers: z.number(),
  event_transfers_cost: z.number(),
  value: z.number(),
  bank: z.number(),
  points_on_bench: z.number(),
});

export const EntryHistorySchema = z.strictObject({
  current: z.array(EntryCurrentHistorySchema),
  chips: z
    .array(
      z.strictObject({
        name: z.string(),
        event: z.number(),
        time: z.string(),
      }),
    )
    .default([]),
  past: z
    .array(
      z.strictObject({
        season_name: z.string(),
        total_points: z.number(),
        rank: z.number(),
      }),
    )
    .default([]),
});

export const EntryPickSchema = z.strictObject({
  element: z.number(),
  position: z.number(),
  multiplier: z.number(),
  is_captain: z.boolean(),
  is_vice_captain: z.boolean(),
});

export const EntryPicksSchema = z.strictObject({
  active_chip: z.string().nullable(),
  entry_history: z.strictObject({
    event: z.number(),
    points: z.number(),
    total_points: z.number(),
    rank: z.number().nullable(),
    event_transfers: z.number(),
    event_transfers_cost: z.number(),
    points_on_bench: z.number(),
  }),
  picks: z.array(EntryPickSchema),
});

export const EventLiveElementSchema = z.strictObject({
  id: z.number(),
  stats: z.strictObject({
    total_points: z.number(),
    minutes: z.number().nullable(),
    goals_scored: z.number().nullable(),
    assists: z.number().nullable(),
    clean_sheets: z.number().nullable(),
    goals_conceded: z.number().nullable(),
    own_goals: z.number().nullable(),
    penalties_saved: z.number().nullable(),
    penalties_missed: z.number().nullable(),
    yellow_cards: z.number().nullable(),
    red_cards: z.number().nullable(),
    saves: z.number().nullable(),
    bonus: z.number().nullable(),
    bps: z.number().nullable(),
    influence: z.number().nullable(),
    creativity: z.number().nullable(),
    threat: z.number().nullable(),
    ict_index: z.union([z.string(), z.number()]),
  }),
});

export const EventLiveSchema = z.strictObject({
  elements: z.array(EventLiveElementSchema),
});

export const ClassicLeagueStandingResultSchema = z.strictObject({
  id: z.number(),
  entry: z.number(),
  entry_name: z.string(),
  player_name: z.string(),
  rank: z.number().nullable(),
  last_rank: z.number().nullable(),
  points: z.number(),
  total: z.number(),
});

export const ClassicLeagueStandingsSchema = z.strictObject({
  league: z.strictObject({
    id: z.number(),
    name: z.string(),
    created: z.string(),
  }),
  new_entries: z.strictObject({
    has_next: z.boolean(),
    results: z.array(
      z.strictObject({
        entry: z.number(),
        entry_name: z.string(),
        player_name: z.string(),
        joined_time: z.string(),
      }),
    ),
  }),
  standings: z.strictObject({
    has_next: z.boolean(),
    page: z.number(),
    results: z.array(ClassicLeagueStandingResultSchema),
  }),
});

export type BootstrapStatic = z.infer<typeof BootstrapStaticSchema>;
export type EntryProfile = z.infer<typeof EntryProfileSchema>;
export type EntryHistory = z.infer<typeof EntryHistorySchema>;
export type EntryCurrentHistory = z.infer<typeof EntryCurrentHistorySchema>;
export type EventLive = z.infer<typeof EventLiveSchema>;
export type EntryPicks = z.infer<typeof EntryPicksSchema>;
export type ClassicLeagueStandings = z.infer<
  typeof ClassicLeagueStandingsSchema
>;
