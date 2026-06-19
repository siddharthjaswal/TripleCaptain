import {
  ClassicLeagueStandingResultSchema,
  type BootstrapElement,
  type BootstrapStatic,
  type ClassicLeagueStandings,
  type EntryCurrentHistory,
  type EntryHistory,
  type EntryPicks,
  type EntryProfile,
  type EntryProfileLeagueSnippet,
  type EventLive,
  type Fixture,
} from "./schemas";
import type {
  FixtureDTO,
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
  history: EntryHistory,
): TotalsDTO {
  const currentRank = entry.summary_overall_rank;

  // Find previous gameweek's rank (currentEvent - 1)
  const previousEventHistory = history.current.find(
    (h) => h.event === currentEvent - 1
  );
  const previousRank = previousEventHistory?.overall_rank ?? null;

  // Calculate rank change (negative = improved, positive = worsened)
  let rankChange: number | null = null;
  if (currentRank !== null && previousRank !== null) {
    rankChange = currentRank - previousRank;
  }

  return {
    entryId: entry.id,
    currentEvent,
    totalPoints: entry.summary_overall_points,
    overallRank: currentRank,
    previousRank,
    rankChange,
  };
}

export function mapLatestGameweek(params: {
  entryId: number;
  currentEvent: number;
  history: EntryHistory;
  picks?: EntryPicks | null;
  isLive: boolean;
  isFinished: boolean;
  liveData?: EventLive | null;
  elements?: BootstrapElement[];
  fixtures?: Fixture[] | null;
}): LatestGwDTO {
  const {
    entryId,
    currentEvent,
    history,
    picks,
    isLive,
    isFinished,
    liveData,
    elements,
    fixtures,
  } = params;
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
        fixtures,
      })
    : [];

  const totalPoints = isLive 
    ? players.reduce((sum, p) => sum + (p.isBench ? 0 : p.points), 0)
    : historyRecord.points;

  return {
    entryId,
    // Report the gameweek we actually resolved data for — findHistoryRecord may
    // have fallen back to the latest available record when currentEvent is missing.
    event: historyRecord.event,
    points: totalPoints,
    rank: historyRecord.rank ?? historyRecord.overall_rank ?? null,
    pointsOnBench: benchPoints,
    chipUsed,
    isLive,
    isFinished,
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

export function mapLatestGameweekPlayers(params: {
  picks: EntryPicks;
  liveData?: EventLive | null;
  elements?: BootstrapElement[];
  fixtures?: Fixture[] | null;
}): LatestGwPlayerDTO[] {
  const { picks, liveData, elements, fixtures } = params;
  const liveLookup = new Map<number, EventLive["elements"][0]["stats"]>();
  liveData?.elements.forEach((entry) => {
    liveLookup.set(entry.id, entry.stats);
  });

  const elementLookup = new Map<number, BootstrapElement>();
  elements?.forEach((element) => {
    elementLookup.set(element.id, element);
  });

  // Calculate projected bonus points
  const bonusProjections = new Map<number, number>();
  if (fixtures && liveData) {
      fixtures.forEach(fixture => {
          if (!fixture.finished && (fixture.team_h_score !== null || fixture.team_a_score !== null)) {
              // Active fixture, calculate bonus
              const playersInFixture = liveData.elements.filter(el => {
                  const playerInfo = elementLookup.get(el.id);
                  return playerInfo && (playerInfo.team === fixture.team_h || playerInfo.team === fixture.team_a);
              });
              
              // Sort by BPS descending
              const sorted = [...playersInFixture].sort((a, b) => (b.stats.bps ?? 0) - (a.stats.bps ?? 0));
              
              if (sorted.length > 0) {
                  const topBps = sorted[0].stats.bps ?? 0;
                  if (topBps > 0) {
                      bonusProjections.set(sorted[0].id, 3);
                      if (sorted.length > 1) {
                          const secondBps = sorted[1].stats.bps ?? 0;
                          if (secondBps > 0) bonusProjections.set(sorted[1].id, 2);
                      }
                      if (sorted.length > 2) {
                          const thirdBps = sorted[2].stats.bps ?? 0;
                          if (thirdBps > 0) bonusProjections.set(sorted[2].id, 1);
                      }
                  }
              }
          }
      });
  }

  const mappedPlayers = picks.picks
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((pick, index) => {
      const playerInfo = elementLookup.get(pick.element);
      const liveStats = liveLookup.get(pick.element);
      const rawPoints = liveStats?.total_points ?? 0;
      const positionCode = playerInfo?.element_type ?? 4;
      const position = mapElementType(positionCode);
      const isBench = pick.position > 11;
      const multiplier = pick.multiplier ?? 1;
      
      const projectedBonus = bonusProjections.get(pick.element) ?? 0;
      const totalPointsWithBonus = rawPoints + projectedBonus;
      const appliedPoints = isBench ? totalPointsWithBonus : totalPointsWithBonus * multiplier;

      const ownership = playerInfo?.selected_by_percent ? parseFloat(playerInfo.selected_by_percent) : 0;
      const impactScore = appliedPoints * (1 - ownership / 100);

      // Check if player is currently playing
      const playerFixture = fixtures?.find(f => (f.team_h === playerInfo?.team || f.team_a === playerInfo?.team) && !f.finished);
      const isLive = !!playerFixture && (playerFixture.team_h_score !== null || playerFixture.team_a_score !== null);

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
        code: playerInfo?.code ?? null,
        teamId: playerInfo?.team ?? null,
        teamCode: playerInfo?.team_code ?? null,
        ownership,
        impactScore: parseFloat(impactScore.toFixed(1)),
        bps: liveStats?.bps ?? 0,
        projectedBonus,
        isLive,
        minutes: liveStats?.minutes ?? 0,
        goals: liveStats?.goals_scored ?? 0,
        assists: liveStats?.assists ?? 0,
        yellowCards: liveStats?.yellow_cards ?? 0,
        redCards: liveStats?.red_cards ?? 0,
        saves: liveStats?.saves ?? 0,
      } satisfies LatestGwPlayerDTO;
    });

    // Handle Live Subs logic
    // If a starting player has 0 minutes and has finished their game, 
    // we should look at the bench. 
    // This is complex to do fully accurately without a full sub engine, 
    // but we can flag it in the UI.
    
    return mappedPlayers;
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

export function mapFixtures(
  fixtures: Fixture[],
  bootstrap: BootstrapStatic,
): FixtureDTO[] {
  const teamsMap = new Map(
    bootstrap.teams.map((team) => [team.id, { name: team.short_name, code: team.code }]),
  );

  return fixtures.map((fixture) => {
    const homeTeamData = teamsMap.get(fixture.team_h);
    const awayTeamData = teamsMap.get(fixture.team_a);

    return {
      id: fixture.id,
      homeTeam: homeTeamData?.name ?? "Unknown",
      awayTeam: awayTeamData?.name ?? "Unknown",
      homeTeamId: fixture.team_h,
      awayTeamId: fixture.team_a,
      homeTeamCode: homeTeamData?.code ?? null,
      awayTeamCode: awayTeamData?.code ?? null,
      homeTeamBadge: homeTeamData ? `https://resources.premierleague.com/premierleague/badges/t${homeTeamData.code}.png` : "",
      awayTeamBadge: awayTeamData ? `https://resources.premierleague.com/premierleague/badges/t${awayTeamData.code}.png` : "",
      homeScore: fixture.team_h_score,
      awayScore: fixture.team_a_score,
      kickoffTime: fixture.kickoff_time,
      finished: fixture.finished,
      started: fixture.started ?? false,
    };
  });
}
