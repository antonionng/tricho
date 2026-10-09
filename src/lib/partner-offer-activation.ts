import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { activatePremiumPartner } from "@/lib/partners";
import { upsertOrganisationFromIntake } from "@/lib/crm-intake";
import { alertOwners, deliverOnce } from "@/lib/mail/send";
import { partnerLiveEmail, partnerPaidAlert } from "@/lib/mail/templates/partner-offers";
import { tierById } from "@/config/subscriptions";
import { markOfferPaid } from "@/lib/partner-offer-payments";
import { offerPriceLabel } from "@/lib/partner-offers";

/**
 * A signed offer has been paid, by card or by invoice: the Premium partner page opens in the
 * brand's colours, their account becomes a Business account, the CRM record becomes a customer,
 * and the brand and the team are told. Safe to run more than once (webhook retries, the return page).
 */
export async function activatePaidOffer(p: { offerId: string; subscriptionId?: string | null; customerId?: string | null }) {
  await markOfferPaid({ offerId: p.offerId, subscriptionId: p.subscriptionId, customerId: p.customerId });
  const offer = await prisma.partnerOffer.findUnique({ where: { id: p.offerId } });
  if (!offer || offer.status !== "accepted" || !offer.accountEmail) return null;
  const email = offer.accountEmail.toLowerCase();

  const partner = await activatePremiumPartner({
    ownerEmail: email,
    name: offer.businessName,
    category: offer.category,
    website: offer.website,
    isFounding: offer.isFounding,
  });
  // The page starts in the brand's colours, with their logo and tagline, wherever they are still empty.
  await prisma.partner.update({
    where: { id: partner.id },
    data: {
      accentColor: partner.accentColor ?? offer.accentColor,
      tagline: partner.tagline ?? offer.tagline,
      logoUrl: partner.logoUrl ?? offer.logoUrl,
      coverUrl: partner.coverUrl ?? offer.heroUrl,
    },
  });
  if (offer.partnerId !== partner.id) await prisma.partnerOffer.update({ where: { id: offer.id }, data: { partnerId: partner.id } });

  // Their account is billed by this subscription and has everything in Business.
  const business = tierById("business");
  await prisma.user.updateMany({
    where: { email },
    data: {
      plan: "business",
      ...(p.subscriptionId ? { stripeSubscriptionId: p.subscriptionId } : {}),
      ...(p.customerId ? { stripeCustomerId: p.customerId } : {}),
    },
  });
  if (business) await prisma.user.updateMany({ where: { email, role: { not: "admin" } }, data: { role: business.grantsRole } });

  // Not allowed while a page is rendering (the return from card payment); the webhook refreshes them too.
  try {
    revalidatePath("/partners");
    revalidatePath("/for-business");
    revalidatePath("/members/business");
  } catch {}

  try {
    await upsertOrganisationFromIntake({
      name: offer.businessName,
      category: offer.category,
      website: offer.website,
      email,
      contactName: offer.signerName,
      contactTitle: offer.signerRole,
      source: "partner-offer",
      interest: "premium",
      stage: "customer",
      accountEmail: email,
      partnerId: partner.id,
      note: null,
    });
  } catch (error) {
    console.error("[PARTNER_OFFER_CRM]", error);
  }

  const facts = {
    businessName: offer.businessName,
    signerName: offer.signerName,
    accountEmail: email,
    price: offerPriceLabel(offer),
    method: offer.paymentMethod === "invoice" ? ("invoice" as const) : ("card" as const),
    firstFeature: offer.firstFeature,
    firstMasterclass: offer.firstMasterclass,
  };
  const live = partnerLiveEmail(facts);
  await deliverOnce(`partner-offer:${offer.id}:live`, email, live.subject, live.content, { tag: "partner-live" });
  // The team hears once, however many times this runs.
  const first = await prisma.emailLog
    .create({ data: { ref: `partner-offer:${offer.id}:paid-owners` } })
    .then(() => true)
    .catch(() => false);
  if (first) await alertOwners(partnerPaidAlert(facts));

  return partner;
}
