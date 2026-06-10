import { NextResponse } from "next/server";
import { auth, isAuthConfigured } from "@/auth";

export async function GET() {
  if (!isAuthConfigured()) {
    return NextResponse.json({ authConfigured: false, user: null });
  }
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ authConfigured: true, user: null });
  }
  const u = session.user as typeof session.user & {
    isPro?: boolean;
    credits?: number;
    entryId?: number | null;
  };
  return NextResponse.json({
    authConfigured: true,
    user: {
      name: u.name,
      email: u.email,
      image: u.image,
      isPro: u.isPro ?? false,
      credits: u.credits ?? 0,
      entryId: u.entryId ?? null,
    },
  });
}
