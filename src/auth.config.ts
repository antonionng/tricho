import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [], // Add providers here (e.g. Google, GitHub, Email)
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isMembersArea = nextUrl.pathname.startsWith("/members");
      const isProArea = nextUrl.pathname.startsWith("/pro");
      
      if (isMembersArea || isProArea) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
