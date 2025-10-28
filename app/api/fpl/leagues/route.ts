import { NextRequest, NextResponse } from "next/server";
import { getClassicLeagueStandings, FplError } from "@/lib/fpl/client";
import { mapClassicLeagueStandings } from "@/lib/fpl/mappers";
import { parseLeagueId } from "@/lib/fpl/service";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const leagueType = (search.get("type") ?? "classic").toLowerCase();

  if (leagueType !== "classic") {
    return NextResponse.json(
      { error: "Only classic leagues are supported right now." },
      { status: 400 },
    );
  }

  let leagueId: number;
  try {
    leagueId = parseLeagueId(search.get("leagueId"));
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }

  const pageParam = search.get("page");
  const pageNumber = pageParam ? Number.parseInt(pageParam, 10) : undefined;

  try {
    const standings = await getClassicLeagueStandings(leagueId, {
      page: Number.isNaN(pageNumber) ? undefined : pageNumber,
    });
    const dto = mapClassicLeagueStandings(standings);
    return NextResponse.json(dto, {
      headers: {
        "Cache-Control": "public, max-age=120, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    if (error instanceof FplError) {
      if (error.status === 404) {
        return NextResponse.json(
          { error: "League not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(
        { error: "FPL upstream error", details: error.message },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 },
    );
  }
}
