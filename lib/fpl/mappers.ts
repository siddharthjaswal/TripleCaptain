import {
  ClassicLeagueStandingResultSchema,
  type BootstrapElement,
  type ClassicLeagueStandings,
  type EntryCurrentHistory,
  type EntryHistory,
  type EntryPicks,
  type EntryProfile,
  type EntryProfileLeagueSnippet,
  type EventLive,
} from "./schemas";
import type {
  LatestGwDTO,
  LatestGwPlayerDTO,
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
  liveData?: EventLive | null;
  elements?: BootstrapElement[];
}): LatestGwDTO {
  const { entryId, currentEvent, history, picks, isLive, liveData, elements } =
    params;
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

  const players = picks
    ? mapLatestGameweekPlayers({
        picks,
        liveData,
        elements,
      })
    : [];

  return {
    entryId,
    event: historyRecord.event,
    points: historyRecord.points,
    rank: historyRecord.rank ?? historyRecord.overall_rank ?? null,
    pointsOnBench: benchPoints,
    chipUsed,
    isLive,
    players,
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

function mapLatestGameweekPlayers(params: {
  picks: EntryPicks;
  liveData?: EventLive | null;
  elements?: BootstrapElement[];
}): LatestGwPlayerDTO[] {
  const { picks, liveData, elements } = params;
  const liveLookup = new Map<number, number>();
  liveData?.elements.forEach((entry) => {
    liveLookup.set(entry.id, entry.stats.total_points ?? 0);
  });

  const elementLookup = new Map<number, BootstrapElement>();
  elements?.forEach((element) => {
    elementLookup.set(element.id, element);
  });

  return picks.picks
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((pick, index) => {
      const playerInfo = elementLookup.get(pick.element);
      const rawPoints = liveLookup.get(pick.element) ?? 0;
      const positionCode = playerInfo?.element_type ?? 4;
      const position = mapElementType(positionCode);
      const isBench = pick.position > 11;
      const multiplier = pick.multiplier ?? 1;
      const appliedPoints = isBench ? rawPoints : rawPoints * multiplier;

      return {
        elementId: pick.element,
        name: playerInfo?.web_name ?? `Player ${pick.element}`,
        position,
        slot: pick.position ?? index + 1,
        isBench,
        isCaptain: Boolean(pick.is_captain),
        isViceCaptain: Boolean(pick.is_vice_captain),
        multiplier,
        points: appliedPoints,
        rawPoints,
        photo: playerInfo?.photo ?? null,
        teamId: playerInfo?.team ?? null,
        teamCode: playerInfo?.team_code ?? null,
      } satisfies LatestGwPlayerDTO;
    });
}

function mapElementType(type: number): "GK" | "DEF" | "MID" | "FWD" {
  switch (type) {
    case 1:
      return "GK";
    case 2:
      return "DEF";
    case 3:
      return "MID";
    default:
      return "FWD";
  }
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
