import { NextRequest, NextResponse } from "next/server";
import { getEntryProfile } from "@/lib/fpl/client";
import { mapProfile } from "@/lib/fpl/mappers";
import { parseEntryId } from "@/lib/fpl/service";
import { FplError } from "@/lib/fpl/client";

export async function GET(request: NextRequest) {
  let entryId: number;
  try {
    entryId = parseEntryId(request.nextUrl.searchParams.get("entryId"));
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }

  try {
    const rawProfile = await getEntryProfile(entryId);
    const profile = mapProfile(rawProfile);
    return NextResponse.json(profile, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    if (error instanceof FplError) {
      if (error.status === 404) {
        return NextResponse.json({ error: "Entry not found" }, { status: 404 });
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
