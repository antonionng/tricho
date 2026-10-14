import "server-only";
import type Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { site } from "@/config/site";

/**
 * Educators are paid through Stripe Connect Express accounts. Stripe checks
 * their identity and bank details, and pays their share into their bank. We
 * only ask for the "transfers" capability: Trichollective takes the payment
 * (it stays the seller the learner sees), then Stripe moves the educator's
 * share to their account in the same moment.
 */

export async function ensureConnectAccount(profile: { id: string; stripeAccountId: string | null; displayName: string }, email: string | null) {
  if (profile.stripeAccountId) return profile.stripeAccountId;
  const account = await stripe.accounts.create({
    type: "express",
    country: "GB",
    email: email ?? undefined,
    capabilities: { transfers: { requested: true } },
    business_profile: {
      product_description: `Online courses taught on ${site.name}`,
      mcc: "8299",
    },
    metadata: { educatorId: profile.id },
  });
  // Two quick clicks must not leave two accounts: only the first one is kept.
  const saved = await prisma.educatorProfile.updateMany({ where: { id: profile.id, stripeAccountId: null }, data: { stripeAccountId: account.id } });
  if (saved.count === 0) {
    await stripe.accounts.del(account.id).catch(() => null);
    const current = await prisma.educatorProfile.findUnique({ where: { id: profile.id }, select: { stripeAccountId: true } });
    return current!.stripeAccountId!;
  }
  return account.id;
}

/** A one-time link to Stripe's onboarding. It expires after a few minutes, so it's made on demand. */
export async function onboardingLink(accountId: string) {
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${site.url}/api/educators/connect/refresh`,
    return_url: `${site.url}/api/educators/connect/return`,
  });
  return link.url;
}

export function connectFlags(account: Stripe.Account) {
  return {
    transfersActive: account.capabilities?.transfers === "active",
    payoutsEnabled: !!account.payouts_enabled,
    detailsSubmitted: !!account.details_submitted,
  };
}

/** Copies an account's state from Stripe. Courses go on sale or come off it as transfers are switched on or off. */
export async function syncConnectAccount(account: Stripe.Account) {
  const updated = await prisma.educatorProfile.updateMany({
    where: { stripeAccountId: account.id },
    data: { ...connectFlags(account), connectUpdatedAt: new Date() },
  });
  if (updated.count) refresh();
  return updated.count > 0;
}

/** The educator disconnected Trichollective from their Stripe account. */
export async function disconnectAccount(accountId: string) {
  await prisma.educatorProfile.updateMany({
    where: { stripeAccountId: accountId },
    data: { stripeAccountId: null, transfersActive: false, payoutsEnabled: false, detailsSubmitted: false, connectUpdatedAt: new Date() },
  });
  refresh();
}

function refresh() {
  try {
    revalidatePath("/members/educator", "layout");
    revalidatePath("/learn");
    revalidatePath("/courses/[slug]", "page");
    revalidatePath("/studio/educators");
  } catch {
    // Outside a request.
  }
}
