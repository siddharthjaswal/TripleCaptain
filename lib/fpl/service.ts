import { notFound } from "next/navigation";
import {
  FplError,
  getBootstrap,
  getClassicLeagueStandings,
  getEntryHistory,
  getEntryPicks,
  getEntryProfile,
  getEventLive,
  getFixtures,
} from "./client";
import type {
  FixturesViewDTO,
  GameweekDeadlineDTO,
  GameweekViewDTO,
  LeaguesViewDTO,
  PredictionsDTO,
  SummaryDTO,
} from "./dto";
import type { BootstrapStatic, EntryCurrentHistory } from "./schemas";
import {
  mapClassicLeagueStandings,
  mapClassicLeagueSummaries,
  mapFixtures,
  mapLatestGameweek,
  mapProfile,
  mapTotals,
} from "./mappers";
import {
  calculateBestXI,
  calculateCaptainPicks,
  calculateChipRecommendations,
  calculateDifferentialPicks,
  calculateFixtureAnalysis,
  calculateTransferSuggestions,
} from "./predictions";

export function parseEntryId(value: string | null): number {
  if (!value) {
    throw new Error("Missing entryId parameter");
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error("Entry ID must be a positive number");
  }

  return parsed;
}

export function parseLeagueId(
  value: string | number | null | undefined,
): number {
  if (value === null || value === undefined) {
    throw new Error("Missing leagueId parameter");
  }

  const id =
    typeof value === "number" ? value : Number.parseInt(String(value), 10);

  if (Number.isNaN(id) || id <= 0) {
    throw new Error("leagueId must be a positive number");
  }

  return id;
}

export async function loadEntrySummary(
  entryIdInput: string | number,
): Promise<SummaryDTO> {
  const entryId =
    typeof entryIdInput === "number"
      ? entryIdInput
      : parseEntryId(entryIdInput);

  try {
    const [profile, history] = await Promise.all([
      getEntryProfile(entryId),
      getEntryHistory(entryId),
    ]);

    const fallbackEvent = await resolveCurrentEvent(profile.current_event);
    const latestHistoryEvent = resolveLatestHistoryEvent(history.current);
    const resolvedEvent = latestHistoryEvent ?? fallbackEvent;
    const historyRecord = resolveHistoryRecord(history.current, resolvedEvent);
    const summaryEvent = historyRecord?.event ?? resolvedEvent;

    const [picks, bootstrap, liveData] = await Promise.all([
      getEntryPicks(entryId, summaryEvent).catch(() => null),
      getBootstrap(),
      getEventLive(summaryEvent).catch(() => null),
    ]);

    const currentEventMeta = bootstrap.events.find(
      (event) => event.id === summaryEvent,
    );
    const isLive = Boolean(currentEventMeta?.is_current && !currentEventMeta?.finished);
    const isFinished = currentEventMeta?.finished ?? true;

    const nextDeadline = calculateNextDeadline(bootstrap.events);

    return {
      profile: mapProfile(profile),
      totals: mapTotals(profile, summaryEvent, history),
      latest: mapLatestGameweek({
        entryId,
        currentEvent: summaryEvent,
        history,
        picks: picks ?? undefined,
        isLive,
        isFinished,
        liveData: liveData ?? undefined,
        elements: bootstrap.elements,
      }),
      nextDeadline,
    };
  } catch (error) {
    if (error instanceof FplError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}

export async function loadEntryLeagues(
  entryIdInput: string | number,
  options: {
    leagueId?: string | number | null;
    page?: string | number | null;
  } = {},
): Promise<LeaguesViewDTO> {
  const entryId =
    typeof entryIdInput === "number"
      ? entryIdInput
      : parseEntryId(entryIdInput);

  const profile = await getEntryProfile(entryId);
  const leagues = mapClassicLeagueSummaries(profile.leagues?.classic)
    .filter((league) => league.entryRank !== null && league.entryRank > 0) // Ignore leagues with no rank or zero rank (empty/inactive)
    .sort((a, b) => {
      // Sort by rank ascending (lower rank = smaller league, comes first)
      return a.entryRank! - b.entryRank!;
    });
  const teamName = profile.name;
  const managerName =
    `${profile.player_first_name} ${profile.player_last_name}`.trim();
  let currentEvent: number | null = null;
  try {
    currentEvent = await resolveCurrentEvent(profile.current_event);
  } catch {
    currentEvent = null;
  }

  const selectedLeagueId = (() => {
    if (options.leagueId !== undefined && options.leagueId !== null) {
      try {
        return parseLeagueId(options.leagueId);
      } catch {
        return null;
      }
    }
    return leagues[0]?.id ?? null;
  })();

  if (!selectedLeagueId) {
    return {
      entryId,
      teamName,
      managerName,
      currentEvent,
      leagues,
      selectedLeagueId: null,
      selectedLeague: null,
      leagueRace: null,
    };
  }

  try {
    const page =
      options.page !== undefined && options.page !== null
        ? Number.parseInt(String(options.page), 10)
        : undefined;
    const standings = await getClassicLeagueStandings(selectedLeagueId, {
      page: Number.isNaN(page) ? undefined : page,
    });

    const selectedLeague = mapClassicLeagueStandings(standings, {
      gameweek: currentEvent ?? undefined,
    });

    // Fetch race data only for page 1 (top 5 managers)
    let leagueRace: import("./dto").LeagueRaceDTO | null = null;
    if ((!page || page === 1) && selectedLeague.entries.length > 0) {
      try {
        const top10Entries = selectedLeague.entries.slice(0, 5);
        const historyPromises = top10Entries.map((entry) =>
          getEntryHistory(entry.entryId)
            .then((history) => ({
              entryId: entry.entryId,
              entryName: entry.entryName,
              playerName: entry.playerName,
              history: history.current.map((h) => ({
                event: h.event,
                totalPoints: h.total_points,
              })),
            }))
            .catch(() => null)
        );

        const histories = await Promise.all(historyPromises);
        const validHistories = histories.filter((h): h is NonNullable<typeof h> => h !== null);

        if (validHistories.length > 0) {
          leagueRace = {
            leagueId: selectedLeagueId,
            leagueName: selectedLeague.leagueName,
            entries: validHistories,
          };
        }
      } catch {
        // Silently fail if race data can't be loaded
        leagueRace = null;
      }
    }

    return {
      entryId,
      teamName,
      managerName,
      currentEvent,
      leagues,
      selectedLeagueId,
      selectedLeague,
      leagueRace,
    };
  } catch (error) {
    if (error instanceof FplError && error.status === 404) {
      return {
        entryId,
        teamName,
        managerName,
        currentEvent,
        leagues,
        selectedLeagueId,
        selectedLeague: null,
        leagueRace: null,
      };
    }
    throw error;
  }
}

async function resolveCurrentEvent(
  currentEvent: number | null,
): Promise<number> {
  if (typeof currentEvent === "number" && currentEvent > 0) {
    return currentEvent;
  }

  const bootstrap = await getBootstrap();
  const active = bootstrap.events.find(
    (event) => event.is_current || event.is_next,
  );
  if (active) {
    return active.id;
  }

  const lastEvent = bootstrap.events[bootstrap.events.length - 1];
  if (lastEvent) {
    return lastEvent.id;
  }

  throw new Error("Unable to determine current gameweek");
}

function resolveLatestHistoryEvent(
  history: EntryCurrentHistory[],
): number | null {
  if (history.length === 0) {
    return null;
  }

  return history.reduce<number>((latest, item) => {
    return item.event > latest ? item.event : latest;
  }, 0);
}

function resolveHistoryRecord(
  history: EntryCurrentHistory[],
  targetEvent: number,
) {
  if (history.length === 0) {
    return undefined;
  }

  const exact = history.find((item) => item.event === targetEvent);
  if (exact) {
    return exact;
  }

  return history[history.length - 1];
}

function calculateNextDeadline(
  events: BootstrapStatic["events"],
): GameweekDeadlineDTO | null {
  const now = new Date();

  // Find the next gameweek that hasn't finished
  const nextEvent = events.find((event) => !event.finished);

  if (!nextEvent) {
    return null;
  }

  const deadline = new Date(nextEvent.deadline_time);
  const isBeforeDeadline = now < deadline;

  return {
    nextGameweek: nextEvent.id,
    deadline: nextEvent.deadline_time,
    isBeforeDeadline,
  };
}

export async function loadFixtures(
  entryIdInput: string | number,
  options: { event?: string | number | null } = {},
): Promise<FixturesViewDTO> {
  const entryId =
    typeof entryIdInput === "number"
      ? entryIdInput
      : parseEntryId(entryIdInput);

  try {
    const profile = await getEntryProfile(entryId);
    const bootstrap = await getBootstrap();

    const teamName = profile.name;
    const managerName =
      `${profile.player_first_name} ${profile.player_last_name}`.trim();

    // Determine which event to show
    const currentEvent = await resolveCurrentEvent(profile.current_event);
    let event: number;
    if (options.event !== undefined && options.event !== null) {
      event = typeof options.event === "number"
        ? options.event
        : Number.parseInt(String(options.event), 10);
      if (Number.isNaN(event) || event <= 0) {
        event = currentEvent;
      }
    } else {
      event = currentEvent;
    }

    const fixtures = await getFixtures(event);
    const mappedFixtures = mapFixtures(fixtures, bootstrap);

    // Try to fetch picks and live data for this gameweek
    let picks;
    let liveData;
    try {
      picks = await getEntryPicks(entryId, event);
    } catch {
      picks = null;
    }
    try {
      liveData = await getEventLive(event);
    } catch {
      liveData = null;
    }

    // Map players to fixtures
    const playersByFixture = new Map<number, import("./dto").FixturePlayerDTO[]>();

    if (picks) {
      const picksList = picks.picks ?? [];

      for (const pick of picksList) {
        const playerInfo = bootstrap.elements.find((el) => el.id === pick.element);
        if (!playerInfo) continue;

        // Find the fixture this player's team is in
        const fixture = fixtures.find(
          (f) =>
            (f.team_h === playerInfo.team || f.team_a === playerInfo.team) &&
            f.event === event,
        );

        if (!fixture) continue;

        // Get live points if available
        let points = 0;
        if (liveData) {
          const liveStats = liveData.elements.find(
            (el) => el.id === pick.element,
          );
          points = liveStats?.stats?.total_points ?? 0;
        }

        // Apply multiplier
        const multiplier = pick.multiplier ?? 1;
        const appliedPoints = points * multiplier;

        const fixturePlayer: import("./dto").FixturePlayerDTO = {
          elementId: pick.element,
          name: playerInfo.web_name,
          teamId: playerInfo.team,
          points: appliedPoints,
          isCaptain: Boolean(pick.is_captain),
          isViceCaptain: Boolean(pick.is_vice_captain),
          multiplier,
        };

        if (!playersByFixture.has(fixture.id)) {
          playersByFixture.set(fixture.id, []);
        }
        playersByFixture.get(fixture.id)!.push(fixturePlayer);
      }
    }

    return {
      entryId,
      teamName,
      managerName,
      currentEvent,
      event,
      fixtures: mappedFixtures,
      playersByFixture,
    };
  } catch (error) {
    if (error instanceof FplError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}

export async function loadGameweek(
  entryIdInput: string | number,
  options: { event?: string | number | null } = {},
): Promise<GameweekViewDTO> {
  const entryId =
    typeof entryIdInput === "number"
      ? entryIdInput
      : parseEntryId(entryIdInput);

  try {
    const [profile, history, bootstrap] = await Promise.all([
      getEntryProfile(entryId),
      getEntryHistory(entryId),
      getBootstrap(),
    ]);

    const teamName = profile.name;
    const managerName =
      `${profile.player_first_name} ${profile.player_last_name}`.trim();

    // Determine which event to show
    let event: number;
    if (options.event !== undefined && options.event !== null) {
      event = typeof options.event === "number"
        ? options.event
        : Number.parseInt(String(options.event), 10);
      if (Number.isNaN(event) || event <= 0) {
        event = await resolveCurrentEvent(profile.current_event);
      }
    } else {
      const fallbackEvent = await resolveCurrentEvent(profile.current_event);
      const latestHistoryEvent = resolveLatestHistoryEvent(history.current);
      event = latestHistoryEvent ?? fallbackEvent;
    }

    const currentEvent = await resolveCurrentEvent(profile.current_event);
    const _historyRecord = resolveHistoryRecord(history.current, event);

    const [picks, liveData] = await Promise.all([
      getEntryPicks(entryId, event).catch(() => null),
      getEventLive(event).catch(() => null),
    ]);

    const currentEventMeta = bootstrap.events.find((e) => e.id === event);
    const isLive = Boolean(currentEventMeta?.is_current && !currentEventMeta?.finished);
    const isFinished = currentEventMeta?.finished ?? true;

    return {
      entryId,
      teamName,
      managerName,
      currentEvent,
      gameweek: mapLatestGameweek({
        entryId,
        currentEvent: event,
        history,
        picks: picks ?? undefined,
        isLive,
        isFinished,
        liveData: liveData ?? undefined,
        elements: bootstrap.elements,
      }),
    };
  } catch (error) {
    if (error instanceof FplError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}


export async function loadPredictions(
  entryIdInput: string | number,
): Promise<PredictionsDTO> {
  const entryId =
    typeof entryIdInput === "number"
      ? entryIdInput
      : parseEntryId(entryIdInput);

  try {
    const [profile, history, bootstrap] = await Promise.all([
      getEntryProfile(entryId),
      getEntryHistory(entryId),
      getBootstrap(),
    ]);

    // Determine next gameweek
    const currentEvent = await resolveCurrentEvent(profile.current_event);
    const nextEvent = bootstrap.events.find(
      (event) => event.id > currentEvent && !event.finished,
    );

    if (!nextEvent) {
      throw new Error("No upcoming gameweek found");
    }

    const nextGw = nextEvent.id;

    // Get current picks (from most recent completed/current gameweek)
    const currentPicks = await getEntryPicks(entryId, currentEvent);

    // Get fixtures for next gameweek
    const nextGwFixtures = await getFixtures(nextGw);

    // Get fixtures for next 3 gameweeks (for transfer suggestions)
    const upcomingFixturesPromises = [nextGw, nextGw + 1, nextGw + 2].map(
      (gw) => getFixtures(gw).catch(() => []),
    );
    const upcomingFixturesArrays = await Promise.all(upcomingFixturesPromises);
    const upcomingFixtures = upcomingFixturesArrays.flat();

    // Get fixtures for next 5 gameweeks (for fixture analysis)
    const fixtureAnalysisPromises = [nextGw, nextGw + 1, nextGw + 2, nextGw + 3, nextGw + 4].map(
      (gw) => getFixtures(gw).catch(() => []),
    );
    const fixtureAnalysisArrays = await Promise.all(fixtureAnalysisPromises);
    const allFixtures = fixtureAnalysisArrays.flat();

    // Get budget information
    const latestHistory = history.current[history.current.length - 1];
    const budget = {
      value: latestHistory?.value ?? 0,
      bank: latestHistory?.bank ?? 0,
    };

    // Calculate predictions
    const captainPicks = calculateCaptainPicks(
      currentPicks,
      bootstrap,
      nextGwFixtures,
    );

    const predictedXI = calculateBestXI(
      currentPicks,
      bootstrap,
      nextGwFixtures,
    );

    const transferSuggestions = calculateTransferSuggestions(
      currentPicks,
      bootstrap,
      upcomingFixtures,
      budget,
    );

    // Calculate V3 features
    const chipRecommendations = calculateChipRecommendations(
      currentPicks,
      bootstrap,
      nextGwFixtures,
      nextGw,
    );

    const currentSquadIds = new Set(currentPicks.picks.map((p) => p.element));
    const budgetAvailable = budget.bank / 10;
    const differentialPicks = calculateDifferentialPicks(
      bootstrap,
      nextGwFixtures,
      upcomingFixtures,
      currentSquadIds,
      budgetAvailable + 15, // Add some budget headroom for transfer flexibility
    );

    const fixtureAnalysis = calculateFixtureAnalysis(
      bootstrap,
      allFixtures,
      nextGw,
    );

    return {
      nextGameweek: nextGw,
      captainPicks,
      predictedXI,
      transferSuggestions,
      chipRecommendations,
      differentialPicks,
      fixtureAnalysis,
      budgetAvailable,
      disclaimer:
        "Predictions based on FPL's expected points algorithm. Actual performance may vary. Always check for late team news before the deadline.",
    };
  } catch (error) {
    if (error instanceof FplError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
