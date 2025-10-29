import { z } from "zod";

export const BootstrapEventSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    deadline_time: z.string(),
    deadline_time_epoch: z.number().optional(),
    finished: z.boolean(),
    data_checked: z.boolean().optional(),
    is_current: z.boolean(),
    is_next: z.boolean(),
    is_previous: z.boolean(),
  })
  .passthrough();

export const BootstrapTeamSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    short_name: z.string(),
  })
  .passthrough();

export const BootstrapStaticSchema = z
  .object({
    events: z.array(BootstrapEventSchema),
    teams: z.array(BootstrapTeamSchema),
    total_players: z.number(),
    elements: z.array(
      z
        .object({
          id: z.number(),
          web_name: z.string(),
          first_name: z.string().optional(),
          second_name: z.string().optional(),
          element_type: z.number(),
          team: z.number(),
          team_code: z.number().optional(),
          photo: z.string().optional(),
        })
        .passthrough(),
    ),
  })
  .passthrough();

const EntryProfileLeagueSnippetSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    short_name: z.string().nullable().optional(),
    created: z.string().optional(),
    admin_entry: z.number().nullable().optional(),
    entry_rank: z.number().nullable().optional(),
    entry_last_rank: z.number().nullable().optional(),
    rank: z.number().nullable().optional(),
  })
  .passthrough();

const EntryProfileLeaguesSchema = z
  .object({
    classic: z.array(EntryProfileLeagueSnippetSchema).default([]),
    h2h: z.array(EntryProfileLeagueSnippetSchema).default([]),
  })
  .passthrough();

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
    leagues: EntryProfileLeaguesSchema.optional(),
  })
  .passthrough();

export type EntryProfileLeagueSnippet = z.infer<
  typeof EntryProfileLeagueSnippetSchema
>;

export const EntryCurrentHistorySchema = z
  .object({
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
  })
  .passthrough();

export const EntryHistorySchema = z
  .object({
    current: z.array(EntryCurrentHistorySchema),
    chips: z
      .array(
        z
          .object({
            name: z.string(),
            event: z.number(),
            time: z.string(),
          })
          .passthrough(),
      )
      .default([]),
    past: z
      .array(
        z
          .object({
            season_name: z.string(),
            total_points: z.number(),
            rank: z.number(),
          })
          .passthrough(),
      )
      .default([]),
  })
  .passthrough();

export const EntryPickSchema = z
  .object({
    element: z.number(),
    position: z.number(),
    multiplier: z.number(),
    is_captain: z.boolean(),
    is_vice_captain: z.boolean(),
    element_type: z.number().optional(),
  })
  .passthrough();

export const EntryPicksSchema = z
  .object({
    active_chip: z.string().nullable(),
    entry_history: z
      .object({
        event: z.number(),
        points: z.number(),
        total_points: z.number(),
        rank: z.number().nullable(),
        event_transfers: z.number(),
        event_transfers_cost: z.number(),
        points_on_bench: z.number(),
      })
      .passthrough(),
    picks: z.array(EntryPickSchema),
    automatic_subs: z.array(z.unknown()).optional(),
  })
  .passthrough();

export const EventLiveElementSchema = z
  .object({
    id: z.number(),
    stats: z
      .object({
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
        influence: z.coerce.number().nullable(),
        creativity: z.coerce.number().nullable(),
        threat: z.coerce.number().nullable(),
        ict_index: z.union([z.string(), z.number()]),
      })
      .passthrough(),
  })
  .passthrough();

export const EventLiveSchema = z
  .object({
    elements: z.array(EventLiveElementSchema),
  })
  .passthrough();

export const ClassicLeagueStandingResultSchema = z
  .object({
    id: z.coerce.number().optional(),
    entry: z.coerce.number().optional(),
    entry_name: z.string().nullable().optional(),
    player_name: z.string().nullable().optional(),
    rank: z.coerce.number().nullable().optional(),
    last_rank: z.coerce.number().nullable().optional(),
    points: z.coerce.number().optional(),
    total: z.coerce.number().optional(),
  })
  .passthrough();

export const ClassicLeagueStandingsSchema = z
  .object({
    league: z
      .object({
        id: z.coerce.number().optional(),
        name: z.string().optional(),
        created: z.string().optional(),
      })
      .passthrough(),
    new_entries: z
      .object({
        has_next: z.coerce.boolean().optional(),
        results: z.array(z.unknown()).optional(),
      })
      .passthrough()
      .optional(),
    standings: z
      .object({
        has_next: z.coerce.boolean().optional(),
        page: z.coerce.number().optional(),
        results: z.array(z.unknown()).optional(),
      })
      .passthrough(),
  })
  .passthrough();

export const FixtureSchema = z
  .object({
    id: z.number(),
    event: z.number().nullable(),
    team_h: z.number(),
    team_a: z.number(),
    team_h_score: z.number().nullable(),
    team_a_score: z.number().nullable(),
    kickoff_time: z.string().nullable(),
    finished: z.boolean(),
    started: z.boolean().optional(),
  })
  .passthrough();

export const FixturesResponseSchema = z.array(FixtureSchema);

export type BootstrapStatic = z.infer<typeof BootstrapStaticSchema>;
export type BootstrapElement = BootstrapStatic["elements"][number];
export type EntryProfile = z.infer<typeof EntryProfileSchema>;
export type EntryHistory = z.infer<typeof EntryHistorySchema>;
export type EntryCurrentHistory = z.infer<typeof EntryCurrentHistorySchema>;
export type EventLive = z.infer<typeof EventLiveSchema>;
export type EntryPicks = z.infer<typeof EntryPicksSchema>;
export type ClassicLeagueStandings = z.infer<
  typeof ClassicLeagueStandingsSchema
>;
export type Fixture = z.infer<typeof FixtureSchema>;
