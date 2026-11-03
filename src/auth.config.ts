import type { NextAuthConfig } from "next-auth";
import { areaRedirect, isHubArea, isProfessionalArea } from "@/lib/account-type";

/**
 * Edge-safe auth config. This is consumed by the middleware, so it must NOT
 * import Node-only modules (Prisma, the Stripe SDK, etc). Heavy providers and
 * the database adapter are added in `auth.ts`.
 */
export const authConfig = {
  // Vercel sits in front of the app. Without this, Auth.js can reject the host
  // the member actually landed on (www vs the bare domain).
  trustHost: true,
  providers: [],
  pages: {
    signIn: "/login",
    // Branded pages inside the site, instead of Auth.js's default screens.
    verifyRequest: "/login/check-email",
    error: "/login/error",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Consumers and professionals each have their own area. The pages and /api routes check again.
      if (isLoggedIn) {
        const elsewhere = areaRedirect(pathname, auth.user.accountType);
        if (elsewhere) return Response.redirect(new URL(elsewhere, nextUrl));
      }
      if (isProfessionalArea(pathname) || isHubArea(pathname)) {
        return isLoggedIn;
      }
      return true;
    },
    // Edge-safe, so the middleware sees the account type too. The jwt callback in auth.ts fills the token.
    session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.role && session.user) {
        session.user.role = token.role as never;
      }
      if (session.user) {
        // Hints for the interface and the middleware. Studio, members and /api re-check the database.
        session.user.staffRole = (token.staffRole ?? null) as never;
        session.user.accountType = (token.accountType ?? "professional") as never;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
