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
import {
  consumerAccountAlert,
  newAccountAlert,
  signInLinkEmail,
  welcomeConsumerEmail,
  welcomeFreeAccountEmail,
} from "@/lib/mail/templates/leads";
import { cookies } from "next/headers";
import { SOURCE_COOKIE, cleanSource } from "@/lib/source";
import { checkoutSignInUser } from "@/lib/signin-email";
import { confirmLinkFor, generateSignInCode } from "@/lib/signin-link";
import { applyPendingSignup } from "@/lib/signup-details";
import { takeSignupName } from "@/lib/signup-name";
import { makeConsumer } from "@/lib/consumer";
import { ACCOUNT_TYPE_COOKIE } from "@/lib/account-cookie";

/** The account type the sign-up page chose in this browser before sending them to Google. */
async function accountTypeFromCookie() {
  try {
    const store = await cookies();
    const value = store.get(ACCOUNT_TYPE_COOKIE)?.value;
    if (value) store.delete(ACCOUNT_TYPE_COOKIE);
    return value === "consumer" ? ("consumer" as const) : null;
  } catch {
    return null;
  }
}

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
      // A short code so a member can type it if the emailed button opens badly on a phone.
      generateVerificationToken: generateSignInCode,
      // Branded magic link. Throws on failure so NextAuth shows the sign-in error.
      // It opens a confirm page first, so mail scanners can't use up the token.
      async sendVerificationRequest({ identifier, url, token }) {
        const { subject, content } = signInLinkEmail({ url: confirmLinkFor(url), code: token });
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
        accountType: { label: "Account type", type: "text" },
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
        // A new account from the consumer sign-up page becomes a consumer, as the email link would.
        if (credentials?.accountType === "consumer" && Date.now() - user.createdAt.getTime() < 10_000) {
          await makeConsumer(user.id);
        }

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
      if (!user.email || !user.id) return;
      // The details from the sign-up form, or Google's name.
      const details = await applyPendingSignup(
        { id: user.id, email: user.email, name: user.name },
        { accountType: await accountTypeFromCookie() }
      );
      const via = details.fromForm ? "the sign-up form" : "Google";
      if (details.accountType === "consumer") {
        const { subject, content } = welcomeConsumerEmail({ name: details.name });
        await Promise.all([
          deliver(user.email, subject, content, { tag: "welcome-consumer" }),
          alertOwners(consumerAccountAlert({ userId: user.id, email: user.email, via })),
        ]);
        return;
      }
      let name = details.name;
      // A link sent before PendingSignup shipped still has its name in the old store.
      if (!name) {
        const typed = await takeSignupName(user.email).catch(() => null);
        if (typed) {
          await prisma.user.update({ where: { id: user.id }, data: { name: typed } });
          name = typed;
        }
      }
      const source = await prisma.user
        .findUnique({ where: { id: user.id }, select: { signupSource: true } })
        .then((u) => u?.signupSource ?? null)
        .catch(() => null);
      const { subject, content } = welcomeFreeAccountEmail({ name });
      await Promise.all([
        deliver(user.email, subject, content, { tag: "welcome-free" }),
        // Without a name (a new email on the sign-in page), owners hear once onboarding asks for it.
        name
          ? alertOwners(
              newAccountAlert({
                ...(details.fromForm ? details : {}),
                name,
                userId: user.id,
                email: user.email,
                source,
                via,
              })
            )
          : null,
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
      token.accountType = existingUser.accountType;
      return token;
    },
  },
});
