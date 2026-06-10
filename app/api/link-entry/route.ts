import { NextRequest, NextResponse } from "next/server";
import { auth, isAuthConfigured } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getEntryProfile } from "@/lib/fpl/client";

/**
 * Link an FPL entry (team) to the signed-in user's profile.
 * POST { entryId } — validates the entry exists, then claims it.
 */
export async function POST(req: NextRequest) {
  if (!isAuthConfigured()) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 501 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const entryId = Number.parseInt(String(body.entryId), 10);
  if (!Number.isInteger(entryId) || entryId <= 0) {
    return NextResponse.json({ error: "Valid entryId required" }, { status: 400 });
  }

  // Verify the team exists on FPL before claiming it.
  try {
    await getEntryProfile(entryId);
  } catch {
    return NextResponse.json({ error: "FPL team not found" }, { status: 404 });
  }

  // One team per account; one account per team.
  const existing = await prisma.user.findUnique({ where: { entryId } });
  if (existing && existing.id !== session.user.id) {
    return NextResponse.json(
      { error: "This team is already linked to another account" },
      { status: 409 },
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { entryId },
  });

  return NextResponse.json({ success: true, entryId });
}

/** Unlink the current user's team. */
export async function DELETE() {
  if (!isAuthConfigured()) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 501 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  await prisma.user.update({
    where: { id: session.user.id },
    data: { entryId: null },
  });
  return NextResponse.json({ success: true });
}
