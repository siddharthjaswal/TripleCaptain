import { NextRequest, NextResponse } from "next/server";
import { getBootstrap, getEntryHistory, getEntryPicks, getEventLive } from "@/lib/fpl/client";
import { mapLatestGameweek } from "@/lib/fpl/mappers";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ entryId: string; event: string }> }
) {
  try {
    const { entryId: entryIdStr, event: eventStr } = await context.params;

    const entryId = Number.parseInt(entryIdStr, 10);
    const event = Number.parseInt(eventStr, 10);

    if (Number.isNaN(entryId) || Number.isNaN(event)) {
      return NextResponse.json(
        { error: "Invalid entry ID or event" },
        { status: 400 }
      );
    }

    // Fetch picks, history, bootstrap data, and live data in parallel
    const [picks, history, bootstrap, liveData] = await Promise.all([
      getEntryPicks(entryId, event),
      getEntryHistory(entryId),
      getBootstrap(),
      getEventLive(event).catch(() => null),
    ]);

    const currentEventMeta = bootstrap.events.find((e) => e.id === event);
    const isLive = Boolean(currentEventMeta?.is_current && !currentEventMeta?.finished);
    const isFinished = currentEventMeta?.finished ?? true;

    // Map to LatestGwDTO
    const teamPicks = mapLatestGameweek({
      entryId,
      currentEvent: event,
      history,
      picks,
      isLive,
      isFinished,
      liveData: liveData ?? undefined,
      elements: bootstrap.elements,
    });

    // Extract captain info
    const captain = teamPicks.players.find((p) => p.isCaptain);
    const captainInfo = captain ? {
      playerId: captain.elementId,
      playerName: captain.name,
      playerPhoto: captain.photo,
    } : null;

    return NextResponse.json({
      captain: captainInfo,
      teamPicks,
    });
  } catch (error) {
    console.error("Error fetching team picks:", error);
    return NextResponse.json(
      { error: "Failed to fetch team picks" },
      { status: 500 }
    );
  }
}
