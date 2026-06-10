import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

/**
 * Auth.js (NextAuth v5) — Google sign-in with the Prisma adapter.
 *
 * Required env: AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET.
 * When Google credentials are missing the app still runs — the sign-in UI is
 * hidden (see isAuthConfigured) and auth() simply returns no session.
 */

export function isAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  trustHost: true,
  providers: isAuthConfigured()
    ? [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
      ]
    : [],
  callbacks: {
    session({ session, user }) {
      // Expose plan info to the UI.
      session.user.id = user.id;
      const u = user as typeof user & {
        isPro?: boolean;
        credits?: number;
        entryId?: number | null;
      };
      const sessionUser = session.user as unknown as Record<string, unknown>;
      sessionUser.isPro = u.isPro ?? false;
      sessionUser.credits = u.credits ?? 0;
      sessionUser.entryId = u.entryId ?? null;
      return session;
    },
  },
});
