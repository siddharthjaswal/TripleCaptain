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
import type { BootstrapStatic } from "./schemas";
import {
  mapClassicLeagueStandings,
  mapClassicLeagueSummaries,
  mapFixtures,
  mapLatestGameweek,
  mapLatestGameweekPlayers,
  mapProfile,
  mapTotals,
} from "./mappers";
import { prisma } from "../prisma";
import {
  calculateBestXI,
  calculateCaptainPicks,
  calculateChipRecommendations,
  calculateDifferentialPicks,
  calculateFixtureAnalysis,
  calculateTransferSuggestions,
} from "./predictions";

import { callGemini, isAIConfigured } from "./gemini";
import { narrateLeagueInsights } from "../narrate";
import { suggestTransfers, pickBestXI, clubKey } from "../data/optimizer";
import { recommendChips } from "../data/chips";
import type { ProjectionResult, TransferSuggestion, ChipAdvice } from "../data/types";
import { buildEntryAlerts, type Alert, type AlertElement } from "../data/alerts";
import {
  computeLiveSummary,
  type LivePick,
  type LiveStat,
  type LiveFixture,
  type LiveSummary,
} from "../data/live";
import { computeNailedness, type NailedReport } from "../data/nailedness";
import { positionOf } from "../data/types";
import { buildSquadHorizon, type HorizonPlayer, type HorizonRow } from "../data/horizon";
import { computeRivalsAnalysis, type RivalSquad } from "../data/rivals";

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

    const bootstrap = await getBootstrap();
    const currentGwFromBootstrap = bootstrap.events.find(e => e.is_current)?.id;
    
    // Prioritize the actual current gameweek from bootstrap or profile
    const summaryEvent = profile.current_event || currentGwFromBootstrap || 1;

    const [picks, liveData, fixtures] = await Promise.all([
      getEntryPicks(entryId, summaryEvent).catch(() => null),
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
      chips: history.chips || [],
    };
  } catch (error) {
    if (error instanceof FplError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}

async function generateLeagueInsights(
  leagueId: number,
  leagueName: string,
  entries: import("./dto").LeagueTableEntryDTO[],
  gameweek: number
): Promise<import("./dto").LeagueAiInsightDTO[]> {
  // 1. Check Cache
  try {
      const cached = await prisma.leagueInsight.findUnique({
          where: { leagueId_gameweek: { leagueId, gameweek } }
      });
      
      if (cached) {
          // If cache is less than 6 hours old, return it
          const ageHours = (new Date().getTime() - new Date(cached.createdAt).getTime()) / (1000 * 60 * 60);
          if (ageHours < 6) {
              return cached.insights as import("./dto").LeagueAiInsightDTO[];
          }
      }
  } catch (err) {
      console.error("Cache read failed:", err);
  }

  // 2. Top managers for this league.
  const top10 = entries.slice(0, 10).map(e => ({
    name: e.entryName,
    manager: e.playerName,
    points: e.points,
    total: e.totalPoints,
    rank: e.rank
  }));

  // Zero-token path: the narrator writes Chief-Scout insights from the standings.
  if (!isAIConfigured()) {
    const insights = narrateLeagueInsights({
      leagueName,
      top: top10.map((e) => ({
        name: e.name,
        manager: e.manager,
        total: e.total,
        points: e.points,
        rank: e.rank ?? undefined,
      })),
    });
    try {
      await prisma.leagueInsight.upsert({
        where: { leagueId_gameweek: { leagueId, gameweek } },
        update: { insights, createdAt: new Date() },
        create: { leagueId, gameweek, insights },
      });
    } catch (err) {
      console.error("Cache write failed:", err);
    }
    return insights;
  }

  const prompt = `You are "The Chief Scout", a witty and sharp-tongued English football pundit.
Analyze the current standings of the FPL league "${leagueName}".

Data for top 10 managers: ${JSON.stringify(top10)}

Provide 3 concise "Scout Report" insights about the league. 
Be fun, competitive, and slightly cheeky. Use English football slang (e.g. "proper bargain", "parked the bus", "absolute scenes", "bottled it").
One should be about the leader, one about a rising star or someone in form, and one general witty observation.

Format: JSON array of objects with {title, insight, squadName, sentiment}.
Sentiment options: "positive", "negative", "neutral", "funny".
Return ONLY the JSON. Keep insights under 100 characters each.`;

  try {
    const response = await callGemini(prompt);
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const insights = JSON.parse(jsonMatch[0]);

    // 3. Update Cache
    try {
        await prisma.leagueInsight.upsert({
            where: { leagueId_gameweek: { leagueId, gameweek } },
            update: { insights, createdAt: new Date() },
            create: { leagueId, gameweek, insights }
        });
    } catch (err) {
        console.error("Cache write failed:", err);
    }

    return insights;
  } catch (error) {
    console.error("Failed to generate league insights:", error);
    return [];
  }
}

export async function loadEntryLeagues(
  entryIdInput: string | number,
  options: {
    leagueId?: string | number | null;
    page?: string | number | null;
    skipInsights?: boolean;
  } = {},
): Promise<LeaguesViewDTO> {
  const entryId =
    typeof entryIdInput === "number"
      ? entryIdInput
      : parseEntryId(entryIdInput);

  // 404 here means the entry doesn't exist — surface Next's not-found, matching
  // the other loaders, rather than letting a raw FplError hit the generic boundary.
  const profile = await getEntryProfile(entryId).catch((e) => {
    if (e instanceof FplError && e.status === 404) notFound();
    throw e;
  });
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

    // --- LIVE LEAGUE CALCULATION ---
    const bootstrap = await getBootstrap();
    const currentGwMeta = bootstrap.events.find(e => e.id === currentEvent);
    const isLive = !!currentGwMeta && !currentGwMeta.finished;

    if (isLive && selectedLeague.entries.length > 0) {
        try {
            const liveData = await getEventLive(currentEvent!).catch(() => null);
            const fixtures = await getFixtures(currentEvent!).catch(() => []);
            
            if (liveData) {
                // Fetch picks for each entry on the current page to get real-time points
                // We limit to 50 (max page size) to prevent excessive API load
                const updatedEntries = await Promise.all(
                    selectedLeague.entries.map(async (entry) => {
                        try {
                            const picks = await getEntryPicks(entry.entryId, currentEvent!);
                            const players = mapLatestGameweekPlayers({
                                picks,
                                liveData,
                                elements: bootstrap.elements,
                                fixtures
                            });
                            
                            const liveGwPoints = players.reduce((sum, p) => sum + (p.isBench ? 0 : p.points), 0);
                            // Standings 'totalPoints' usually includes 'points' (the stale GW points)
                            // We replace the stale part with our live calculation
                            const liveTotal = (entry.totalPoints - entry.points) + liveGwPoints;
                            
                            return {
                                ...entry,
                                points: liveGwPoints,
                                totalPoints: liveTotal,
                                // Flag as live for the UI
                                isLive: true
                            };
                        } catch {
                            return entry;
                        }
                    })
                );
                
                // Re-sort the league based on our real-time calculations
                selectedLeague.entries = updatedEntries.sort((a, b) => {
                    if (b.totalPoints !== a.totalPoints) {
                        return b.totalPoints - a.totalPoints;
                    }
                    // Tie-breaker: total points from standings if live calculation is same
                    return (b.totalPoints || 0) - (a.totalPoints || 0);
                });

                // Note: We don't overwrite the 'rank' property because it's global, 
                // but the UI will show them in the correct sorted order.
            }
        } catch (err) {
            console.error("Live league calculation failed:", err);
        }
    }
    // -------------------------------

    // Fetch race data only for page 1 (top 5 managers)
    let leagueRace: import("./dto").LeagueRaceDTO | null = null;
    let aiInsights: import("./dto").LeagueAiInsightDTO[] | undefined = undefined;

    if ((!page || page === 1) && selectedLeague.entries.length > 0 && !options.skipInsights) {
      // Parallelize race data and AI insights
      const [raceData, insights] = await Promise.all([
          (async () => {
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
                  return {
                    leagueId: selectedLeagueId,
                    leagueName: selectedLeague.leagueName,
                    entries: validHistories,
                  };
                }
              } catch {
                return null;
              }
              return null;
          })(),
          generateLeagueInsights(selectedLeagueId, selectedLeague.leagueName, selectedLeague.entries, currentEvent!)
      ]);

      leagueRace = raceData;
      aiInsights = insights;
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
      aiInsights,
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
    // Fetch profile and bootstrap in parallel for better performance
    const [profile, bootstrap] = await Promise.all([
      getEntryProfile(entryId),
      getBootstrap(),
    ]);

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

    // Try to fetch picks and live data for this gameweek in parallel
    const [picks, liveData] = await Promise.all([
      getEntryPicks(entryId, event).catch((error) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Failed to fetch entry picks:", error);
        }
        return null;
      }),
      getEventLive(event).catch((error) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Failed to fetch live data:", error);
        }
        return null;
      }),
    ]);

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

        // Get live points and stats if available (single lookup for efficiency)
        let points = 0;
        let stats: import("./dto").FixturePlayerDTO["stats"] = undefined;
        
        if (liveData) {
          const liveStats = liveData.elements.find(
            (el) => el.id === pick.element,
          );
          
          if (liveStats?.stats) {
            points = liveStats.stats.total_points ?? 0;
            stats = {
              minutes: liveStats.stats.minutes ?? 0,
              goals_scored: liveStats.stats.goals_scored ?? 0,
              assists: liveStats.stats.assists ?? 0,
              clean_sheets: liveStats.stats.clean_sheets ?? 0,
              goals_conceded: liveStats.stats.goals_conceded ?? 0,
              own_goals: liveStats.stats.own_goals ?? 0,
              penalties_saved: liveStats.stats.penalties_saved ?? 0,
              penalties_missed: liveStats.stats.penalties_missed ?? 0,
              yellow_cards: liveStats.stats.yellow_cards ?? 0,
              red_cards: liveStats.stats.red_cards ?? 0,
              saves: liveStats.stats.saves ?? 0,
              bonus: liveStats.stats.bonus ?? 0,
              bps: liveStats.stats.bps ?? 0,
            };
          }
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
          stats,
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

    const currentGwFromBootstrap = bootstrap.events.find(e => e.is_current)?.id;
    const currentEvent = profile.current_event || currentGwFromBootstrap || 1;

    // Determine which event to show
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

    const [initialPicks, liveData, fixtures] = await Promise.all([
      getEntryPicks(entryId, event).catch(() => null),
      getEventLive(event).catch(() => null),
      getFixtures(event).catch(() => null),
    ]);
    // Picks can 404 in the post-rollover / pre-deadline window — fall back a
    // gameweek so the pitch isn't momentarily empty (matching the other loaders).
    const picks =
      initialPicks ?? (event > 1 ? await getEntryPicks(entryId, event - 1).catch(() => null) : null);

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

    try {
        const [profile, history, bootstrap] = await Promise.all([
            getEntryProfile(entryId),
            getEntryHistory(entryId),
            getBootstrap(),
        ]);

        const currentEvent = await resolveCurrentEvent(profile.current_event);
        const nextGw = currentEvent + 1;
        // Picks can 404 pre-deadline or for an entry that didn't play this GW —
        // fall back one gameweek, matching the other loaders.
        let picks;
        try {
            picks = await getEntryPicks(entryId, currentEvent);
        } catch {
            if (currentEvent > 1) picks = await getEntryPicks(entryId, currentEvent - 1);
            else throw new FplError("No picks available for this entry", 404);
        }

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

        // History can be empty (brand-new entry / pre-GW1 off-season) — guard it.
        const latestHistory = history.current.at(-1);

        const squad = mapLatestGameweekPlayers({
            picks,
            elements: bootstrap.elements
        });

        return {
            squad,
            bank: (latestHistory?.bank ?? 0) / 10,
            teamValue: (latestHistory?.value ?? 0) / 10,
            nextGw,
            fixtures: allFixtures,
            bgwDgwMap
        };
    } catch (error) {
        if (error instanceof FplError && error.status === 404) notFound();
        throw error;
    }
}

export type SquadInsightsDTO = {
  /** False when projections aren't computed yet (pre-precompute / off-season). */
  available: boolean;
  bank: number;
  freeTransfers: number;
  squadXp: number;
  bestXi: {
    formation: string;
    projectedTotal: number;
    starters: Array<{ name: string; position: string; xp: number }>;
    bench: Array<{ name: string; position: string; xp: number }>;
  } | null;
  transfers: TransferSuggestion[];
  chips: ChipAdvice[];
};

/**
 * Read the nightly-precomputed player projections (PlayerProjection joined to
 * Player) as ProjectionResult[], deduped to the latest event per player. Cheap
 * indexed reads — used at request time instead of recomputing xP from full-table
 * scans. Empty when precompute hasn't run yet.
 */
async function readPrecomputedProjections(): Promise<ProjectionResult[]> {
  const [rows, players] = await Promise.all([
    prisma.playerProjection.findMany({ orderBy: { event: "desc" } }).catch(() => []),
    prisma.player.findMany({ include: { team: { select: { shortName: true } } } }).catch(() => []),
  ]);
  if (rows.length === 0 || players.length === 0) return [];
  const playerById = new Map(players.map((p) => [p.id, p]));

  const out: ProjectionResult[] = [];
  const seen = new Set<number>();
  for (const r of rows) {
    if (seen.has(r.playerId)) continue; // latest event wins (rows ordered desc)
    const p = playerById.get(r.playerId);
    if (!p) continue;
    seen.add(r.playerId);
    const price = Math.max(p.nowCost / 10, 3.8);
    out.push({
      id: p.id,
      name: p.webName,
      position: positionOf(p.elementType),
      teamShort: p.team.shortName,
      price,
      xPoints: r.xPoints,
      ceiling: r.ceiling,
      floor: r.floor,
      capScore: r.capScore,
      startProb: 1, // not persisted; the optimizer/chips don't use it
      value: Math.round((r.xPoints / price) * 100) / 100,
      archetype: r.archetype as ProjectionResult["archetype"],
      reasons: (r.reasons as string[]) ?? [],
    });
  }
  out.sort((a, b) => b.xPoints - a.xPoints || a.id - b.id);
  return out;
}

/**
 * SquadLab — the deterministic engine applied to a real manager's squad. Pure
 * maths over our multi-season projections (zero AI tokens): the best legal XI,
 * the top net-gain single transfers, and chip-timing advice. Off-season / before
 * the nightly precompute runs, projections are empty and we return
 * `available: false` so the UI can show a graceful "computing" state.
 */
export async function loadSquadInsights(
  entryIdInput: string | number,
): Promise<SquadInsightsDTO> {
  const entryId =
    typeof entryIdInput === "number" ? entryIdInput : parseEntryId(entryIdInput);

  const empty: SquadInsightsDTO = {
    available: false,
    bank: 0,
    freeTransfers: 1,
    squadXp: 0,
    bestXi: null,
    transfers: [],
    chips: [],
  };

  try {
    const [profile, history] = await Promise.all([
      getEntryProfile(entryId),
      getEntryHistory(entryId),
    ]);

    const currentEvent = await resolveCurrentEvent(profile.current_event);

    // Picks for the current GW, falling back one GW if FPL 404s pre-deadline.
    let picks;
    try {
      picks = await getEntryPicks(entryId, currentEvent);
    } catch {
      if (currentEvent > 1) picks = await getEntryPicks(entryId, currentEvent - 1);
      else return empty;
    }

    // Read the nightly-precomputed projections instead of rebuilding every
    // player's xP from full-table scans on each request (cheap indexed reads).
    const projections = await readPrecomputedProjections();
    if (projections.length === 0) return empty;

    const byId = new Map(projections.map((p) => [p.id, p]));
    const squadIds = picks.picks.map((p) => p.element);
    const squad = squadIds
      .map((id) => byId.get(id))
      .filter((p): p is ProjectionResult => p !== undefined);
    if (squad.length === 0) return empty;

    const latestHistory = history.current[history.current.length - 1];
    const bank = (latestHistory?.bank ?? 0) / 10;

    // Club caps for the optimizer — keyed by the same hash the optimizer uses.
    const squadClubCounts: Record<number, number> = {};
    for (const p of squad) {
      const k = clubKey(p.teamShort);
      squadClubCounts[k] = (squadClubCounts[k] ?? 0) + 1;
    }

    // Candidate pool: top projected players not already owned (keep it tight so
    // suggestions are premium, and the scan stays fast).
    const squadSet = new Set(squadIds);
    const candidates = projections
      .filter((p) => !squadSet.has(p.id))
      .slice(0, 200);

    // Ask for a wider set, then keep the best move per *incoming* player so the
    // list shows distinct upgrade targets (the optimizer dedupes by out-player
    // only, so the same signing can otherwise appear against several outs).
    const rawTransfers = suggestTransfers({
      squad,
      candidates,
      bank,
      freeTransfers: 1,
      squadClubCounts,
      maxSuggestions: 15,
    });
    const seenIn = new Set<number>();
    const transfers: TransferSuggestion[] = [];
    for (const t of rawTransfers) {
      if (seenIn.has(t.inId)) continue;
      seenIn.add(t.inId);
      transfers.push(t);
      if (transfers.length >= 5) break;
    }

    const usedChips = (history.chips ?? []).map((c) => c.name);
    const chips = await recommendChips({
      usedChips,
      squad,
      gameweek: currentEvent + 1,
    }).catch(() => [] as ChipAdvice[]);

    const xi = pickBestXI(squad);
    const fmt = (id: number) => {
      const p = byId.get(id);
      return p
        ? { name: p.name, position: p.position, xp: Math.round(p.xPoints * 100) / 100 }
        : { name: "—", position: "", xp: 0 };
    };
    const projectedTotal =
      Math.round(
        xi.starters.reduce((s, id) => s + (byId.get(id)?.xPoints ?? 0), 0) * 10,
      ) / 10;
    const squadXp =
      Math.round(squad.reduce((s, p) => s + p.xPoints, 0) * 10) / 10;

    return {
      available: true,
      bank,
      freeTransfers: 1,
      squadXp,
      bestXi: {
        formation: xi.formation,
        projectedTotal,
        starters: xi.starters.map(fmt),
        bench: xi.bench.map(fmt),
      },
      transfers,
      chips,
    };
  } catch (error) {
    if (error instanceof FplError && error.status === 404) notFound();
    console.error("loadSquadInsights failed:", error);
    return empty;
  }
}

export type EntryAlertsDTO = {
  entryId: number;
  teamName: string;
  managerName: string;
  nextEvent: number | null;
  alerts: Alert[];
};

/**
 * Per-entry alerts for the Alerts Center + the push job. Deterministic, zero AI.
 * Works off-season (deadline-only) and degrades gracefully when picks are
 * unavailable. Reusable headless via the exported function.
 */
export async function loadEntryAlerts(
  entryIdInput: string | number,
): Promise<EntryAlertsDTO> {
  const entryId =
    typeof entryIdInput === "number" ? entryIdInput : parseEntryId(entryIdInput);

  try {
    const [profile, bootstrap] = await Promise.all([
      getEntryProfile(entryId).catch((e) => {
        if (e instanceof FplError && e.status === 404) notFound();
        throw e;
      }),
      getBootstrap(),
    ]);

    const teamName = profile.name;
    const managerName =
      `${profile.player_first_name} ${profile.player_last_name}`.trim();
    const nextDeadline = calculateNextDeadline(bootstrap.events);
    const currentEvent = await resolveCurrentEvent(profile.current_event);

    // Owned squad for the latest available gameweek (404s pre-deadline → fall back).
    let picks = null;
    try {
      picks = await getEntryPicks(entryId, currentEvent);
    } catch {
      if (currentEvent > 1) picks = await getEntryPicks(entryId, currentEvent - 1).catch(() => null);
    }

    const squad = (picks?.picks ?? []).map((p) => ({
      elementId: p.element,
      isCaptain: p.is_captain,
      isStarter: p.position <= 11,
    }));

    const elementsById = new Map<number, AlertElement>(
      bootstrap.elements.map((el) => [
        el.id,
        {
          id: el.id,
          web_name: el.web_name,
          team: el.team,
          status: el.status,
          chance_of_playing_next_round: el.chance_of_playing_next_round ?? null,
          transfers_in_event: el.transfers_in_event,
          transfers_out_event: el.transfers_out_event,
          cost_change_event: el.cost_change_event,
          now_cost: el.now_cost,
        },
      ]),
    );
    const teamShortById = new Map(bootstrap.teams.map((t) => [t.id, t.short_name]));

    const alerts = buildEntryAlerts({
      squad,
      elementsById,
      teamShortById,
      nextDeadline: nextDeadline
        ? { event: nextDeadline.nextGameweek, deadline: nextDeadline.deadline }
        : null,
      totalPlayers: bootstrap.total_players,
      now: Date.now(),
    });

    return {
      entryId,
      teamName,
      managerName,
      nextEvent: nextDeadline?.nextGameweek ?? null,
      alerts,
    };
  } catch (error) {
    if (error instanceof FplError && error.status === 404) notFound();
    console.error("loadEntryAlerts failed:", error);
    throw error;
  }
}

export type LiveCenterDTO = {
  event: number;
  hasStarted: boolean; // at least one fixture kicked off (else nothing to show)
  isFinished: boolean;
  summary: LiveSummary;
  captainName: string | null;
  autoSubs: Array<{ outName: string; inName: string }>;
} | null;

/**
 * Live Gameweek Command Center data — deterministic live score with provisional
 * bonus, auto-subs and progress. Returns null when there's no started gameweek
 * to show (off-season / pre-kickoff), so the surface can hide cleanly.
 */
export async function loadLiveCenter(
  entryIdInput: string | number,
  eventInput?: number,
): Promise<LiveCenterDTO> {
  const entryId =
    typeof entryIdInput === "number" ? entryIdInput : parseEntryId(entryIdInput);

  try {
    const bootstrap = await getBootstrap();
    const currentMeta =
      bootstrap.events.find((e) => e.is_current) ??
      bootstrap.events.find((e) => e.is_next) ??
      null;
    const event = eventInput ?? currentMeta?.id;
    if (!event) return null;

    const eventMeta = bootstrap.events.find((e) => e.id === event) ?? null;

    const [picks, live, fixtures] = await Promise.all([
      getEntryPicks(entryId, event).catch(() => null),
      getEventLive(event).catch(() => null),
      getFixtures(event).catch(() => [] as Awaited<ReturnType<typeof getFixtures>>),
    ]);

    if (!picks || !live) return null;

    const liveFixtures: LiveFixture[] = fixtures.map((f) => ({
      teamH: f.team_h,
      teamA: f.team_a,
      started: f.started ?? false,
      finished: f.finished,
    }));
    const hasStarted = liveFixtures.some((f) => f.started);
    if (!hasStarted) return null; // nothing live yet

    const meta = new Map(
      bootstrap.elements.map((el) => [
        el.id,
        { team: el.team, elementType: el.element_type, name: el.web_name },
      ]),
    );
    const allPlayersTeam = new Map(bootstrap.elements.map((el) => [el.id, el.team]));

    const liveById = new Map<number, LiveStat>(
      live.elements.map((el) => [
        el.id,
        {
          totalPoints: el.stats.total_points,
          minutes: el.stats.minutes ?? 0,
          bps: el.stats.bps ?? 0,
        },
      ]),
    );

    const livePicks: LivePick[] = picks.picks.map((p) => ({
      element: p.element,
      position: p.position,
      multiplier: p.multiplier,
      isCaptain: p.is_captain,
      isViceCaptain: p.is_vice_captain,
      elementType: meta.get(p.element)?.elementType ?? 0,
      team: meta.get(p.element)?.team ?? 0,
    }));

    const summary = computeLiveSummary({
      picks: livePicks,
      liveById,
      fixtures: liveFixtures,
      allPlayersTeam,
      averageScore: eventMeta?.average_entry_score ?? null,
      activeChip: picks.active_chip ?? null,
    });

    const name = (id: number | null) => (id != null ? meta.get(id)?.name ?? null : null);

    return {
      event,
      hasStarted,
      isFinished: eventMeta?.finished ?? liveFixtures.every((f) => f.finished),
      summary,
      captainName: name(summary.captain.element),
      autoSubs: summary.autoSubs.map((s) => ({
        outName: meta.get(s.outElement)?.name ?? "—",
        inName: meta.get(s.inElement)?.name ?? "—",
      })),
    };
  } catch (error) {
    if (error instanceof FplError && error.status === 404) return null;
    console.error("loadLiveCenter failed:", error);
    return null;
  }
}

export type SquadNailednessDTO = {
  entryId: number;
  teamName: string;
  managerName: string;
  nextEvent: number | null;
  players: Array<{
    name: string;
    position: string; // GK/DEF/MID/FWD
    teamShort: string;
    isCaptain: boolean;
    isStarter: boolean;
    report: NailedReport;
  }>;
  risks: number; // starters that are doubtful/injured/rotation risks
} | null;

/**
 * Squad rotation/injury risk for the Predicted-Lineups surface. Deterministic
 * nailedness per owned player, sorted riskiest-first among starters. Returns
 * null when picks aren't available.
 */
export async function loadSquadNailedness(
  entryIdInput: string | number,
): Promise<SquadNailednessDTO> {
  const entryId =
    typeof entryIdInput === "number" ? entryIdInput : parseEntryId(entryIdInput);

  try {
    const [profile, bootstrap] = await Promise.all([
      getEntryProfile(entryId).catch((e) => {
        if (e instanceof FplError && e.status === 404) notFound();
        throw e;
      }),
      getBootstrap(),
    ]);

    const currentEvent = await resolveCurrentEvent(profile.current_event);
    let picks = null;
    try {
      picks = await getEntryPicks(entryId, currentEvent);
    } catch {
      if (currentEvent > 1) picks = await getEntryPicks(entryId, currentEvent - 1).catch(() => null);
    }
    if (!picks) return null;

    // Games played ≈ finished gameweeks (good enough across the league).
    const gamesPlayed = Math.max(1, bootstrap.events.filter((e) => e.finished).length);
    const teamShortById = new Map(bootstrap.teams.map((t) => [t.id, t.short_name]));
    const elById = new Map(bootstrap.elements.map((e) => [e.id, e]));

    const players = picks.picks.map((p) => {
      const el = elById.get(p.element);
      const report = computeNailedness({
        status: el?.status,
        chanceNext: el?.chance_of_playing_next_round ?? null,
        minutes: el?.minutes ?? 0,
        starts: el?.starts ?? 0,
        gamesPlayed,
      });
      return {
        name: el?.web_name ?? "—",
        position: positionOf(el?.element_type ?? 0),
        teamShort: el ? teamShortById.get(el.team) ?? "—" : "—",
        isCaptain: p.is_captain,
        isStarter: p.position <= 11,
        report,
      };
    });

    // Starters first, riskiest (lowest startProb) on top; bench after.
    players.sort((a, b) => {
      if (a.isStarter !== b.isStarter) return a.isStarter ? -1 : 1;
      return a.report.startProb - b.report.startProb;
    });

    const risks = players.filter(
      (p) => p.isStarter && (p.report.tier === "unavailable" || p.report.tier === "doubt" || p.report.tier === "rotation"),
    ).length;

    const nextDeadline = calculateNextDeadline(bootstrap.events);

    return {
      entryId,
      teamName: profile.name,
      managerName: `${profile.player_first_name} ${profile.player_last_name}`.trim(),
      nextEvent: nextDeadline?.nextGameweek ?? null,
      players,
      risks,
    };
  } catch (error) {
    if (error instanceof FplError && error.status === 404) notFound();
    console.error("loadSquadNailedness failed:", error);
    return null;
  }
}

export type SeasonPlanDTO = {
  entryId: number;
  teamName: string;
  managerName: string;
  fromGw: number;
  gws: number[];
  rows: HorizonRow[];
} | null;

/**
 * Season Planner — each squad player's projected xP across the next N gameweeks
 * over their real fixtures (neutral base × per-GW FDR). Zero AI. Returns null
 * when picks or projections aren't available (off-season / pre-precompute).
 */
export async function loadSeasonPlan(
  entryIdInput: string | number,
  horizon = 6,
): Promise<SeasonPlanDTO> {
  const entryId =
    typeof entryIdInput === "number" ? entryIdInput : parseEntryId(entryIdInput);

  try {
    const [profile, bootstrap] = await Promise.all([
      getEntryProfile(entryId).catch((e) => {
        if (e instanceof FplError && e.status === 404) notFound();
        throw e;
      }),
      getBootstrap(),
    ]);

    const currentEvent = await resolveCurrentEvent(profile.current_event);
    let picks = null;
    try {
      picks = await getEntryPicks(entryId, currentEvent);
    } catch {
      if (currentEvent > 1) picks = await getEntryPicks(entryId, currentEvent - 1).catch(() => null);
    }
    if (!picks) return null;

    // Neutral (fixture-free) base xP from the precomputed projections.
    const squadIds = picks.picks.map((p) => p.element);
    const projections = await prisma.playerProjection
      .findMany({ where: { playerId: { in: squadIds } }, orderBy: { event: "desc" } })
      .catch(() => []);
    if (projections.length === 0) return null;
    const baseXpById = new Map<number, number>();
    for (const pr of projections) if (!baseXpById.has(pr.playerId)) baseXpById.set(pr.playerId, pr.xPoints);

    const fromGw = bootstrap.events.find((e) => !e.finished)?.id ?? currentEvent + 1;
    const gwRange = Array.from({ length: horizon }, (_, i) => fromGw + i);
    const fixtureArrays = await Promise.all(gwRange.map((gw) => getFixtures(gw).catch(() => [])));
    const fixtures = fixtureArrays.flat().map((f) => ({
      event: f.event ?? 0,
      teamH: f.team_h,
      teamA: f.team_a,
      fdrH: f.team_h_difficulty ?? 3,
      fdrA: f.team_a_difficulty ?? 3,
    }));
    // Off-season / pre-schedule: no upcoming fixtures → hide the planner rather
    // than render an all-blank grid.
    if (fixtures.length === 0) return null;

    const teamShortById = new Map(bootstrap.teams.map((t) => [t.id, t.short_name]));
    const elById = new Map(bootstrap.elements.map((e) => [e.id, e]));

    const squad: HorizonPlayer[] = picks.picks
      .map((p): HorizonPlayer | null => {
        const el = elById.get(p.element);
        if (!el) return null;
        return {
          element: p.element,
          name: el.web_name,
          position: positionOf(el.element_type),
          teamId: el.team,
          teamShort: teamShortById.get(el.team) ?? "?",
          price: (el.now_cost ?? 0) / 10,
          baseXp: baseXpById.get(p.element) ?? 0,
        };
      })
      .filter((p): p is HorizonPlayer => p !== null);

    const { gws, rows } = buildSquadHorizon({
      squad,
      fixtures,
      teamShortById,
      fromGw,
      horizon,
    });

    // Group by position (GK→FWD), best horizon total first within a line.
    const posOrder: Record<string, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
    rows.sort((a, b) => (posOrder[a.position] - posOrder[b.position]) || b.total - a.total);

    return {
      entryId,
      teamName: profile.name,
      managerName: `${profile.player_first_name} ${profile.player_last_name}`.trim(),
      fromGw,
      gws,
      rows,
    };
  } catch (error) {
    if (error instanceof FplError && error.status === 404) notFound();
    console.error("loadSeasonPlan failed:", error);
    return null;
  }
}

export type RivalsWatchDTO = {
  entryId: number;
  leagueId: number;
  leagueName: string;
  event: number;
  fieldSize: number;
  myCaptainName: string | null;
  captaincy: Array<{ name: string; teamShort: string; count: number; pct: number; isMine: boolean }>;
  differentials: Array<{ name: string; teamShort: string; position: string; rivalPct: number }>;
  templateGaps: Array<{ name: string; teamShort: string; position: string; rivalPct: number }>;
  rivals: Array<{ name: string; manager: string; rank: number | null; overlap: number; captainName: string | null; differsCaptain: boolean }>;
} | null;

const RIVALS_FIELD = 12; // managers analysed (incl. you)

/**
 * Rivals Watch — mini-league intelligence for the selected league: captaincy
 * board, your differentials, template gaps and per-rival head-to-head. Zero AI.
 * Fetches each manager's current squad; null when no league / data.
 */
export async function loadRivalsWatch(
  entryIdInput: string | number,
  leagueId: number,
): Promise<RivalsWatchDTO> {
  const entryId =
    typeof entryIdInput === "number" ? entryIdInput : parseEntryId(entryIdInput);

  try {
    const [profile, bootstrap] = await Promise.all([
      getEntryProfile(entryId).catch((e) => {
        if (e instanceof FplError && e.status === 404) notFound();
        throw e;
      }),
      getBootstrap(),
    ]);

    const event = await resolveCurrentEvent(profile.current_event);

    const standings = await getClassicLeagueStandings(leagueId, { page: 1 }).catch(() => null);
    if (!standings) return null;
    const view = mapClassicLeagueStandings(standings, { gameweek: event });
    const leagueName = view.leagueName ?? "Your league";

    // Top managers + you (if outside the top slice).
    const top = view.entries.slice(0, RIVALS_FIELD);
    if (!top.some((e) => e.entryId === entryId)) {
      const mine = view.entries.find((e) => e.entryId === entryId);
      if (mine) top.unshift(mine);
      else top.unshift({ entryId, entryName: profile.name, playerName: `${profile.player_first_name} ${profile.player_last_name}`.trim(), rank: null } as (typeof view.entries)[number]);
    }

    // Resolve ONE comparison gameweek for the whole field, so we never compare
    // squads from different gameweeks. Probe the user's picks at the current
    // event; if they aren't recorded yet (the brief post-deadline window), fall
    // the entire field back a gameweek.
    let compareEvent = event;
    const myProbe = await getEntryPicks(entryId, event).catch(() => null);
    if (!myProbe && event > 1) compareEvent = event - 1;

    const squads = await Promise.all(
      top.map(async (e) => {
        const picks =
          e.entryId === entryId && compareEvent === event && myProbe
            ? myProbe
            : await getEntryPicks(e.entryId, compareEvent).catch(() => null);
        if (!picks) return null; // skip — keeps the whole field on one gameweek
        return {
          entryId: e.entryId,
          name: e.entryName,
          manager: e.playerName,
          rank: e.rank ?? null,
          squad: picks.picks.map((p) => p.element),
          captain: picks.picks.find((p) => p.is_captain)?.element ?? null,
        } satisfies RivalSquad;
      }),
    );
    const valid = squads.filter((s): s is RivalSquad => s !== null);
    const me = valid.find((s) => s.entryId === entryId);
    if (!me || valid.length < 2) return null;
    const rivals = valid.filter((s) => s.entryId !== entryId);

    const analysis = computeRivalsAnalysis({ me, rivals });

    // Resolve element ids → display.
    const elById = new Map(bootstrap.elements.map((e) => [e.id, e]));
    const teamShortById = new Map(bootstrap.teams.map((t) => [t.id, t.short_name]));
    const nameOf = (id: number | null) => (id != null ? elById.get(id)?.web_name ?? null : null);
    const resolve = (id: number) => {
      const el = elById.get(id);
      return {
        name: el?.web_name ?? "—",
        teamShort: el ? teamShortById.get(el.team) ?? "?" : "?",
        position: positionOf(el?.element_type ?? 0),
      };
    };

    return {
      entryId,
      leagueId,
      leagueName,
      event: compareEvent,
      fieldSize: analysis.fieldSize,
      myCaptainName: nameOf(analysis.myCaptain),
      captaincy: analysis.captaincy.slice(0, 6).map((c) => ({ ...resolve(c.element), count: c.count, pct: c.pct, isMine: c.isMine })),
      differentials: analysis.differentials.slice(0, 6).map((d) => ({ ...resolve(d.element), rivalPct: d.rivalPct })),
      templateGaps: analysis.templateGaps.slice(0, 6).map((g) => ({ ...resolve(g.element), rivalPct: g.rivalPct })),
      rivals: analysis.rivals.slice(0, 10).map((r) => ({
        name: r.name,
        manager: r.manager,
        rank: r.rank,
        overlap: r.overlap,
        captainName: nameOf(r.captain),
        differsCaptain: r.differsCaptain,
      })),
    };
  } catch (error) {
    if (error instanceof FplError && error.status === 404) notFound();
    console.error("loadRivalsWatch failed:", error);
    return null;
  }
}
