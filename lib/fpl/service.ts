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
  mapLatestGameweekPlayers,
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

import { callGemini } from "./gemini";

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

    const [picks, bootstrap, liveData, fixtures] = await Promise.all([
      getEntryPicks(entryId, summaryEvent).catch(() => null),
      getBootstrap(),
      getEventLive(summaryEvent).catch(() => null),
      getFixtures(summaryEvent).catch(() => null),
    ]);

    const currentEventMeta = bootstrap.events.find(
      (event) => event.id === summaryEvent,
    );
    const isLive = Boolean(currentEventMeta?.is_current && !currentEventMeta?.finished);
    const isFinished = currentEventMeta?.finished ?? true;

    const nextDeadline = calculateNextDeadline(bootstrap.events);
    const phase = calculateFplPhase(bootstrap.events, nextDeadline);

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
        fixtures: fixtures ?? undefined,
      }),
      nextDeadline,
      phase,
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

function calculateFplPhase(
  events: BootstrapStatic["events"],
  nextDeadline: GameweekDeadlineDTO | null
): import("./dto").FplPhase {
  const currentGw = events.find((e) => e.is_current);
  
  // 1. LIVE Phase: Current GW is active and not finished
  // Also check if current time is after deadline but game hasn't finished
  if (currentGw && !currentGw.finished) {
    return "LIVE";
  }

  // Handle "Updating" case: If no current GW is marked as current, but deadline has passed
  const nextGw = events.find((e) => e.is_next);
  if (nextGw) {
      const deadline = new Date(nextGw.deadline_time);
      const now = new Date();
      if (now > deadline && !nextGw.finished) {
          return "LIVE"; // Treat as live even if not marked "is_current" yet
      }
  }

  // 2. STRATEGY Phase: Next deadline is within 48 hours
  if (nextDeadline) {
    const now = new Date();
    const deadline = new Date(nextDeadline.deadline);
    const hoursToDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursToDeadline <= 48) {
      return "STRATEGY";
    }
  }

  // 3. DEBRIEF Phase: Default for when GW is finished but next isn't close
  return "DEBRIEF";
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

    const [picks, liveData, fixtures] = await Promise.all([
      getEntryPicks(entryId, event).catch(() => null),
      getEventLive(event).catch(() => null),
      getFixtures(event).catch(() => null),
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
        fixtures: fixtures ?? undefined,
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
    // We try to get picks for currentEvent, but if FPL returns 404 (common during pre-deadline phase),
    // we fall back to currentEvent - 1.
    let currentPicks;
    try {
        currentPicks = await getEntryPicks(entryId, currentEvent);
    } catch (error) {
        console.warn(`Picks for GW ${currentEvent} not available, falling back to GW ${currentEvent - 1}`);
        if (currentEvent > 1) {
            currentPicks = await getEntryPicks(entryId, currentEvent - 1);
        } else {
            throw error;
        }
    }

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

    console.log(`Calculating predictions for ${entryId} (GW ${nextGw})...`);

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
    console.error("Error in loadPredictions:", error);
    if (error instanceof FplError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}

export async function loadPlannerData(
    entryIdInput: string | number,
): Promise<{
    squad: import("./dto").LatestGwPlayerDTO[];
    bank: number;
    teamValue: number;
    nextGw: number;
    fixtures: import("./schemas").Fixture[];
    bgwDgwMap: Record<number, Record<number, { count: number; opponents: string[] }>>;
}> {
    const entryId = typeof entryIdInput === "number" ? entryIdInput : parseEntryId(entryIdInput);
    
    const [profile, history, bootstrap] = await Promise.all([
        getEntryProfile(entryId),
        getEntryHistory(entryId),
        getBootstrap(),
    ]);

    const currentEvent = await resolveCurrentEvent(profile.current_event);
    const nextGw = currentEvent + 1;
    const picks = await getEntryPicks(entryId, currentEvent);
    
    // Fetch fixtures for the next 5 gameweeks
    const gwRange = Array.from({ length: 5 }, (_, i) => nextGw + i);
    const fixturesPromises = gwRange.map(gw => getFixtures(gw).catch(() => []));
    const fixturesArrays = await Promise.all(fixturesPromises);
    const allFixtures = fixturesArrays.flat();

    // Map Team IDs to Short Names for display
    const teamMap = new Map(bootstrap.teams.map(t => [t.id, t.short_name]));

    // Calculate BGW/DGW Map
    const bgwDgwMap: Record<number, Record<number, { count: number; opponents: string[] }>> = {};
    
    bootstrap.teams.forEach(team => {
        bgwDgwMap[team.id] = {};
        gwRange.forEach(gw => {
            const teamFixtures = allFixtures.filter(f => (f.team_h === team.id || f.team_a === team.id) && f.event === gw);
            bgwDgwMap[team.id][gw] = {
                count: teamFixtures.length,
                opponents: teamFixtures.map(f => {
                    const isHome = f.team_h === team.id;
                    const opponentId = isHome ? f.team_a : f.team_h;
                    return `${teamMap.get(opponentId)}${isHome ? '(H)' : '(A)'}`;
                })
            };
        });
    });
    
    const latestHistory = history.current[history.current.length - 1];
    
    const squad = mapLatestGameweekPlayers({
        picks,
        elements: bootstrap.elements
    });

    return {
        squad,
        bank: latestHistory.bank / 10,
        teamValue: latestHistory.value / 10,
        nextGw,
        fixtures: allFixtures,
        bgwDgwMap
    };
}
