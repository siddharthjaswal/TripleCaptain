import {
  ClassicLeagueStandingResultSchema,
  type ClassicLeagueStandings,
  type EntryCurrentHistory,
  type EntryHistory,
  type EntryPicks,
  type EntryProfile,
  type EntryProfileLeagueSnippet,
} from "./schemas";
import type {
  LatestGwDTO,
  LeagueStandingDTO,
  LeagueSummaryDTO,
  LeagueTableEntryDTO,
  ProfileDTO,
  TotalsDTO,
} from "./dto";

export function mapProfile(entry: EntryProfile): ProfileDTO {
  return {
    entryId: entry.id,
    teamName: entry.name,
    managerName: `${entry.player_first_name} ${entry.player_last_name}`.trim(),
    overallPoints: entry.summary_overall_points,
    overallRank: entry.summary_overall_rank,
  };
}

export function mapTotals(
  entry: EntryProfile,
  currentEvent: number,
): TotalsDTO {
  return {
    entryId: entry.id,
    currentEvent,
    totalPoints: entry.summary_overall_points,
    overallRank: entry.summary_overall_rank,
  };
}

export function mapLatestGameweek(params: {
  entryId: number;
  currentEvent: number;
  history: EntryHistory;
  picks?: EntryPicks | null;
  isLive: boolean;
}): LatestGwDTO {
  const { entryId, currentEvent, history, picks, isLive } = params;
  const historyRecord = findHistoryRecord(history.current, currentEvent);

  if (!historyRecord) {
    throw new Error("Unable to determine latest gameweek data for entry");
  }

  const benchPoints =
    picks?.entry_history.points_on_bench ?? historyRecord.points_on_bench;

  const chipUsed =
    picks?.active_chip ??
    history.chips.find((chip) => chip.event === historyRecord.event)?.name ??
    null;

  return {
    entryId,
    event: historyRecord.event,
    points: historyRecord.points,
    rank: historyRecord.rank ?? historyRecord.overall_rank ?? null,
    pointsOnBench: benchPoints,
    chipUsed,
    isLive,
  };
}

function findHistoryRecord(
  history: EntryCurrentHistory[],
  event: number,
): EntryCurrentHistory | undefined {
  if (history.length === 0) {
    return undefined;
  }

  const matched = history.find((item) => item.event === event);
  return matched ?? history[history.length - 1];
}

export function mapClassicLeagueSummaries(
  leagues: EntryProfileLeagueSnippet[] | undefined,
): LeagueSummaryDTO[] {
  if (!leagues || leagues.length === 0) {
    return [];
  }

  return leagues.map((league) => ({
    id: league.id,
    name: league.name,
    shortName: league.short_name ?? null,
    entryRank: league.entry_rank ?? null,
    entryLastRank: league.entry_last_rank ?? null,
    type: "classic" as const,
  }));
}

export function mapClassicLeagueStandings(
  standings: ClassicLeagueStandings,
  context: { gameweek?: number } = {},
): LeagueStandingDTO {
  const standingsData = standings.standings ?? {};
  const rawResults = Array.isArray(standingsData.results)
    ? standingsData.results
    : [];

  const entries: LeagueTableEntryDTO[] = rawResults.map((result, index) => {
    const parsed = ClassicLeagueStandingResultSchema.safeParse(result);
    const data = parsed.success ? parsed.data : {};
    const entryId = data.entry ?? data.id ?? index + 1;

    return {
      entryId,
      rank: data.rank ?? null,
      lastRank: data.last_rank ?? null,
      entryName: data.entry_name ?? "—",
      playerName: data.player_name ?? "—",
      points: data.points ?? 0,
      totalPoints: data.total ?? 0,
    };
  });

  return {
    leagueId: standings.league?.id ?? 0,
    leagueName: standings.league?.name ?? "Unknown League",
    page: standingsData.page ?? 1,
    hasNextPage: Boolean(standingsData.has_next),
    gameweek: context.gameweek ?? null,
    entries,
  };
}
