import { notFound } from "next/navigation";
import {
  FplError,
  getBootstrap,
  getEntryHistory,
  getEntryPicks,
  getEntryProfile,
} from "./client";
import type { SummaryDTO } from "./dto";
import { mapLatestGameweek, mapProfile, mapTotals } from "./mappers";

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
