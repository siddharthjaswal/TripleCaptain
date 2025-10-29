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
  LeaguesViewDTO,
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
      totals: mapTotals(profile, summaryEvent),
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
    return {
      entryId,
      teamName,
      managerName,
      currentEvent,
      leagues,
      selectedLeagueId,
      selectedLeague: mapClassicLeagueStandings(standings, {
        gameweek: currentEvent ?? undefined,
      }),
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
    let event: number;
    if (options.event !== undefined && options.event !== null) {
      event = typeof options.event === "number"
        ? options.event
        : Number.parseInt(String(options.event), 10);
      if (Number.isNaN(event) || event <= 0) {
        event = await resolveCurrentEvent(profile.current_event);
      }
    } else {
      event = await resolveCurrentEvent(profile.current_event);
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
