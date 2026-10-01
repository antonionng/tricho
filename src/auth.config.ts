import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config. This is consumed by the middleware, so it must NOT
 * import Node-only modules (Prisma, the Stripe SDK, etc). Heavy providers and
 * the database adapter are added in `auth.ts`.
 */
export const authConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isMembersArea = nextUrl.pathname.startsWith("/members");
      const isProArea = nextUrl.pathname.startsWith("/pro");

      if (isMembersArea || isProArea) {
        return isLoggedIn;
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
