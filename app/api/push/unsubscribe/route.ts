import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Remove a Web Push subscription.
 * POST { endpoint: string }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const endpoint = body?.endpoint;
  if (typeof endpoint !== "string" || !endpoint) {
    return NextResponse.json({ error: "endpoint required" }, { status: 400 });
  }
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  return NextResponse.json({ ok: true });
}
