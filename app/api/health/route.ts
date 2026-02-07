import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    version: "V2.2.2-PREMIUM",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
}
