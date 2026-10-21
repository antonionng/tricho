import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getMembershipByEmail } from "@/lib/subscription";
import { isPremiumSubscription, tierByPriceId } from "@/config/subscriptions";
import { syncMembershipFromStripe } from "@/lib/stripe-sync";

export type MemberRecipient = { email: string; name: string | null };

/**
 * The emails Stripe holds a live membership subscription for. This catches members whose payment
 * the webhook never recorded, who would otherwise be missed by a list built from the database.
 */
export async function stripeMemberEmails(): Promise<Map<string, string | null>> {
  const found = new Map<string, string | null>();
  if (!process.env.STRIPE_SECRET_KEY) return found;
  for (const status of ["active", "trialing", "past_due"] as const) {
    for await (const s of stripe.subscriptions.list({ status, limit: 100, expand: ["data.customer"] })) {
      const priceId = s.items.data[0]?.price.id ?? null;
      if (!isPremiumSubscription(priceId, s.metadata) && !tierByPriceId(priceId)) continue;
      const customer = s.customer as Stripe.Customer | Stripe.DeletedCustomer;
      if (!customer || customer.deleted || !customer.email) continue;
      found.set(customer.email.toLowerCase(), customer.name ?? null);
    }
  }
  return found;
}

async function inBatches<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>) {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  return out;
}

/**
 * Every active member, once per email: paid, complimentary, or on a business seat, plus anyone
 * Stripe shows as paying. Accounts that are suspended or banned are left out. Members Stripe knows
 * about but the account does not are brought up to date on the way.
 */
export async function activeMemberRecipients(): Promise<MemberRecipient[]> {
  const fromStripe = await stripeMemberEmails().catch((error) => {
    console.error("[MEMBER_RECIPIENTS] Stripe lookup failed", error);
    return new Map<string, string | null>();
  });
  const accounts = await prisma.user.findMany({
    where: { email: { not: null } },
    select: { email: true, name: true, accessStatus: true },
  });
  // Every account is known, so a suspended or banned member is never added back from Stripe below.
  const byEmail = new Map(accounts.map((u) => [u.email!.toLowerCase(), u]));
  const users = accounts.filter((u) => u.accessStatus === "active");

  const recipients = new Map<string, MemberRecipient>();
  await inBatches(users, 8, async (u) => {
    const email = u.email!.toLowerCase();
    const paying = fromStripe.has(email);
    if (paying || (await getMembershipByEmail(email)).isActive) {
      recipients.set(email, { email, name: u.name });
      // Record a payment the webhook missed, so the member can get in when they click through.
      if (paying) await syncMembershipFromStripe(email);
    }
  });
  // Paid without ever signing in: no account yet, but still a member.
  for (const [email, name] of fromStripe) {
    if (!byEmail.has(email) && !recipients.has(email)) recipients.set(email, { email, name });
  }
  return [...recipients.values()];
}
