import { prisma } from "@/lib/prisma";

/** The offer a Stripe payment belongs to, read from the metadata set when its charge was created. */
export function offerIdFrom(metadata: Record<string, string> | null | undefined) {
  const id = metadata?.offerId;
  return typeof id === "string" && /^[a-z0-9]{10,40}$/i.test(id) ? id : null;
}

/** The email that manages the page for an offer, so a payment never makes a second partner page. */
export async function offerOwnerEmail(offerId: string | null) {
  if (!offerId) return null;
  const offer = await prisma.partnerOffer.findUnique({ where: { id: offerId }, select: { accountEmail: true } });
  return offer?.accountEmail?.toLowerCase() ?? null;
}

/**
 * Marks an offer paid. A payment made from the onboarding page carries the offer id; an older
 * payment link only has the payer's email, so that is the fallback. Safe to repeat.
 */
export async function markOfferPaid(p: {
  offerId: string | null;
  email?: string | null;
  subscriptionId?: string | null;
  customerId?: string | null;
}) {
  const ids = {
    ...(p.subscriptionId ? { stripeSubscriptionId: p.subscriptionId } : {}),
    ...(p.customerId ? { stripeCustomerId: p.customerId } : {}),
  };
  if (p.offerId) {
    const done = await prisma.partnerOffer.updateMany({ where: { id: p.offerId, paidAt: null }, data: { paidAt: new Date(), ...ids } });
    return done.count;
  }
  if (!p.email) return 0;
  const email = p.email.toLowerCase();
  const done = await prisma.partnerOffer.updateMany({
    where: { paidAt: null, status: { not: "withdrawn" }, OR: [{ email }, { accountEmail: email }] },
    data: { paidAt: new Date() },
  });
  return done.count;
}
