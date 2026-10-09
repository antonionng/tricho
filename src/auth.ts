import NextAuth, { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { isDevOrDemo, isPreviewDemo } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { renderEmail } from "@/lib/mail/layout";
import { alertOwners, deliver } from "@/lib/mail/send";
import { newAccountAlert, signInLinkEmail, welcomeFreeAccountEmail } from "@/lib/mail/templates/leads";
import { cookies } from "next/headers";
import { SOURCE_COOKIE, cleanSource } from "@/lib/source";
import { checkoutSignInUser } from "@/lib/signin-email";
import { takeSignupName } from "@/lib/signup-name";

/** Where a new free account came from (the tc_src cookie), saved only if nothing is recorded yet. */
async function recordSignupSource(userId: string | undefined) {
  if (!userId) return;
  try {
    const source = cleanSource((await cookies()).get(SOURCE_COOKIE)?.value);
    if (!source) return;
    await prisma.user.updateMany({ where: { id: userId, signupSource: null }, data: { signupSource: source } });
  } catch {
    // Events can run outside a request, where there are no cookies. Attribution is a nice-to-have.
  }
}

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
      // Branded magic link. Throws on failure so NextAuth shows the sign-in error.
      async sendVerificationRequest({ identifier, url }) {
        const { subject, content } = signInLinkEmail({ url });
        const { html, text } = renderEmail(content);
        await sendEmail({ to: identifier, subject, html, text, tag: "sign-in" });
      },
    })
  );
}

/**
 * Straight in after paying: the welcome page passes the Stripe Checkout Session
 * id, which works once, within an hour, for the email that paid.
 */
providers.push(
  Credentials({
    id: "checkout",
    name: "Checkout",
    credentials: { sessionId: { label: "Session", type: "text" } },
    async authorize(credentials) {
      return checkoutSignInUser(credentials?.sessionId);
    },
  })
);

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
  events: {
    // Fires only when the adapter creates a user (first sign-in by email link or
    // Google). Paid sign-ups created by the Stripe webhook and dev logins are
    // written directly with Prisma, so they don't get this free-account welcome.
    async createUser({ user }) {
      await recordSignupSource(user.id);
      if (!user.email) return;
      // An email link brings no name, so use the one typed on /signup.
      let name = user.name;
      try {
        const typed = await takeSignupName(user.email);
        if (typed && !name && user.id) {
          await prisma.user.update({ where: { id: user.id }, data: { name: typed } });
          name = typed;
        }
      } catch (error) {
        console.error("[SIGNUP_NAME]", error);
      }
      const { subject, content } = welcomeFreeAccountEmail({ name });
      await Promise.all([
        deliver(user.email, subject, content, { tag: "welcome-free" }),
        alertOwners(newAccountAlert({ name, email: user.email })),
      ]);
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      if (!user?.email) return true;
      const existing = await prisma.user.findUnique({
        where: { email: user.email.toLowerCase() },
        select: { accessStatus: true },
      });
      return existing?.accessStatus !== "banned";
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.role && session.user) {
        session.user.role = token.role as never;
      }
      if (session.user) {
        // A hint for the interface only. Studio always re-checks the database.
        session.user.staffRole = (token.staffRole ?? null) as never;
      }
      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;

      const existingUser = await prisma.user.findUnique({
        where: { id: token.sub },
      });

      if (!existingUser) return token;
      // A banned account is signed out on its next request.
      if (existingUser.accessStatus === "banned") return null;

      token.role = existingUser.role;
      token.staffRole = existingUser.staffRole;
      return token;
    },
  },
});
