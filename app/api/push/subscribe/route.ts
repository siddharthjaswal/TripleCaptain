import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPushConfigured, isAllowedPushEndpoint } from "@/lib/push";

/**
 * Store a Web Push subscription for an FPL entry.
 * POST { subscription: PushSubscriptionJSON, entryId: number }
 */
export async function POST(req: NextRequest) {
  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push not configured" }, { status: 501 });
  }

  const body = await req.json().catch(() => null);
  const sub = body?.subscription;
  const entryId = Number.parseInt(String(body?.entryId), 10);

  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }
  // Reject anything that isn't a real browser push service (anti-SSRF).
  if (!isAllowedPushEndpoint(sub.endpoint)) {
    return NextResponse.json({ error: "Unsupported push endpoint" }, { status: 400 });
  }
  if (!Number.isInteger(entryId) || entryId <= 0) {
    return NextResponse.json({ error: "Valid entryId required" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    update: { p256dh: sub.keys.p256dh, auth: sub.keys.auth, entryId },
    create: {
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      entryId,
    },
  });

  return NextResponse.json({ ok: true });
}
