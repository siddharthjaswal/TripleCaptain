import { NextRequest, NextResponse } from "next/server";
import { getRatings } from "@/lib/data/ratings";
import { predictMatch } from "@/lib/data/predict";

/** GET /api/predict?home=<code>&away=<code> → deterministic match forecast. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const home = Number(searchParams.get("home"));
  const away = Number(searchParams.get("away"));
  if (!home || !away || home === away) {
    return NextResponse.json({ error: "home and away team codes required" }, { status: 400 });
  }
  const ratings = await getRatings();
  const forecast = predictMatch(home, away, ratings);
  if (!forecast) {
    return NextResponse.json({ error: "Not enough data for these teams" }, { status: 404 });
  }
  return NextResponse.json({ forecast });
}
