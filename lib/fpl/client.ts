import "server-only";

import { cache } from "react";
import {
  BootstrapStaticSchema,
  ClassicLeagueStandingsSchema,
  EntryHistorySchema,
  EntryPicksSchema,
  EntryProfileSchema,
  EventLiveSchema,
  type BootstrapStatic,
  type ClassicLeagueStandings,
  type EntryHistory,
  type EntryPicks,
  type EntryProfile,
  type EventLive,
} from "./schemas";

const API_BASE = "https://fantasy.premierleague.com/api";
const shouldLogRequests = process.env.FPL_DEBUG_LOGS === "true";

function logDebug(message: string, details?: Record<string, unknown>) {
  if (!shouldLogRequests) return;
  if (details) {
    console.info(`[FPL] ${message}`, details);
  } else {
    console.info(`[FPL] ${message}`);
  }
}

type FetchParams<T> = {
  path: string;
  schema: { parse(data: unknown): T };
  revalidate?: number;
};

export class FplError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "FplError";
  }
}

async function fetchFromFpl<T>({
  path,
  schema,
  revalidate = 300,
}: FetchParams<T>): Promise<T> {
  logDebug("Request", { path, revalidate });

  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "User-Agent":
        "triple-captain-app/0.1 (+https://github.com/siddharthjaswal/TripleCaptain)",
      Accept: "application/json",
    },
    next: {
      revalidate,
    },
  });

  if (!response.ok) {
    const reason = `${response.status} ${response.statusText}`.trim();
    logDebug("Response error", {
      path,
      status: response.status,
      statusText: response.statusText,
    });
    throw new FplError(
      `FPL request failed (${reason}) for ${path}`,
      response.status,
    );
  }

  const json = await response.json();
  logDebug("Response success", { path });
  return schema.parse(json);
}

export const getBootstrap = cache(async (): Promise<BootstrapStatic> => {
  return fetchFromFpl({
    path: "/bootstrap-static/",
    schema: BootstrapStaticSchema,
    revalidate: 3600,
  });
});

export async function getEntryProfile(entryId: number): Promise<EntryProfile> {
  return fetchFromFpl({
    path: `/entry/${entryId}/`,
    schema: EntryProfileSchema,
    revalidate: 300,
  });
}

export async function getEntryHistory(entryId: number): Promise<EntryHistory> {
  return fetchFromFpl({
    path: `/entry/${entryId}/history/`,
    schema: EntryHistorySchema,
    revalidate: 300,
  });
}

export async function getEntryPicks(
  entryId: number,
  event: number,
): Promise<EntryPicks> {
  return fetchFromFpl({
    path: `/entry/${entryId}/event/${event}/picks/`,
    schema: EntryPicksSchema,
    revalidate: 90,
  });
}

export async function getEventLive(event: number): Promise<EventLive> {
  return fetchFromFpl({
    path: `/event/${event}/live/`,
    schema: EventLiveSchema,
    revalidate: 60,
  });
}

export async function getClassicLeagueStandings(
  leagueId: number,
): Promise<ClassicLeagueStandings> {
  return fetchFromFpl({
    path: `/leagues-classic/${leagueId}/standings/`,
    schema: ClassicLeagueStandingsSchema,
    revalidate: 600,
  });
}
