import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    version: "V2.2.4-AUTOMATED-GULMARG",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "production",
  });
}
