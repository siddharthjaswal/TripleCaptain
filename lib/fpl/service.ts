import { notFound } from "next/navigation";
import {
  FplError,
  getBootstrap,
  getEntryHistory,
  getEntryPicks,
  getEntryProfile,
  getClassicLeagueStandings,
} from "./client";
import type { LeaguesViewDTO, SummaryDTO } from "./dto";
import {
  mapClassicLeagueStandings,
  mapClassicLeagueSummaries,
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

    const currentEvent = await resolveCurrentEvent(profile.current_event);

    const [picks, bootstrap] = await Promise.all([
      getEntryPicks(entryId, currentEvent).catch(() => null),
      getBootstrap(),
    ]);

    const currentEventMeta = bootstrap.events.find(
      (event) => event.id === currentEvent,
    );
    const isLive = currentEventMeta?.is_current ?? false;

    return {
      profile: mapProfile(profile),
      totals: mapTotals(profile, currentEvent),
      latest: mapLatestGameweek({
        entryId,
        currentEvent,
        history,
        picks: picks ?? undefined,
        isLive,
      }),
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
  const leagues = mapClassicLeagueSummaries(profile.leagues?.classic);
  const teamName = profile.name;

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
      leagues,
      selectedLeagueId,
      selectedLeague: mapClassicLeagueStandings(standings),
    };
  } catch (error) {
    if (error instanceof FplError && error.status === 404) {
      return {
        entryId,
        teamName,
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
