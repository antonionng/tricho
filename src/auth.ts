import NextAuth, { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { isDevOrDemo, isPreviewDemo } from "@/lib/env";

const providers: NextAuthConfig["providers"] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

if (process.env.AUTH_RESEND_KEY) {
  providers.push(
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.AUTH_EMAIL_FROM || "Trichollective <onboarding@resend.dev>",
    })
  );
}

/**
 * Dev login: lets you sign in with just an email in non-production so the
 * platform is fully usable before OAuth/email credentials are configured.
 * Never enabled in production.
 */
if (isDevOrDemo()) {
  providers.push(
    Credentials({
      id: "dev",
      name: "Dev Login",
      credentials: {
        email: { label: "Email", type: "email" },
        name: { label: "Name", type: "text" },
        passcode: { label: "Passcode", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string)?.toLowerCase().trim();
        if (!email) return null;
        // Public previews need the passcode, so strangers can't sign in as the sample admin.
        if (isPreviewDemo()) {
          const expected = process.env.PREVIEW_PASSCODE;
          if (!expected || credentials?.passcode !== expected) return null;
        }

        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: {
            email,
            name: (credentials?.name as string) || email.split("@")[0],
          },
        });

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    })
  );
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.role && session.user) {
        session.user.role = token.role as never;
      }
      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;

      const existingUser = await prisma.user.findUnique({
        where: { id: token.sub },
      });

      if (!existingUser) return token;

      token.role = existingUser.role;
      return token;
    },
  },
});
