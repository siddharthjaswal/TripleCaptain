import { NextRequest, NextResponse } from "next/server";
import { loadEntrySummary, parseEntryId } from "@/lib/fpl/service";
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
    const summary = await loadEntrySummary(entryId);
    return NextResponse.json(summary, {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=180",
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
