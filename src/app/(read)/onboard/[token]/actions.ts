"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { upsertOrganisationFromIntake } from "@/lib/crm-intake";
import { alertOwners, deliverOnce } from "@/lib/mail/send";
import { longDate } from "@/lib/mail/templates/directory";
import { partnerAcceptedAlert, partnerAgreementEmail } from "@/lib/mail/templates/partner-offers";
import { LEGAL_UPDATED } from "@/lib/legal";
import { site } from "@/config/site";
import { PARTNER_TERMS_VERSION, partnerTerms } from "@/content/partner-terms";
import {
  contractText,
  inclusionsFrom,
  offerPath,
  offerPriceLabel,
  offerPriceNote,
  parseAcceptance,
  sha256,
  type ContractFacts,
} from "@/lib/partner-offers";
import { buildContractPdf } from "@/lib/contract-pdf";
import { storeUpload } from "@/lib/storage";
import { createOfferCheckout, createOfferInvoice } from "@/lib/partner-offer-billing";
import { SIGNIN_EMAIL_COOKIE, signinEmailCookieOptions } from "@/lib/signin-email";

export type AcceptState = { error: string; fields: Record<string, string> } | null;

const FIELDS = ["signerName", "signerRole", "legalName", "companyNumber", "address", "accountEmail", "signature"] as const;

const COUNTERSIGNED_BY = `${site.founderFull}, Founder, for ${site.company.name}`;

/**
 * The brand signs: the acceptance is recorded exactly as shown, the countersigned PDF is made and
 * stored privately, the CRM record is marked won, and both sides get an email. The partner page opens
 * only once the payment arrives (src/lib/partner-offer-activation.ts). A second submit does nothing.
 */
export async function acceptPartnerOffer(token: string, _prev: AcceptState, form: FormData): Promise<AcceptState> {
  const offer = await prisma.partnerOffer.findUnique({ where: { token } });
  if (!offer || offer.status === "withdrawn") {
    return { error: "This link is no longer active. Please contact us and we will send you a new one.", fields: {} };
  }
  if (offer.status === "accepted") redirect(`${offerPath(token)}#payment`);

  const fields = Object.fromEntries(FIELDS.map((k) => [k, String(form.get(k) ?? "")]));
  const parsed = parseAcceptance((k) => form.get(k));
  if (!parsed.ok) return { error: parsed.error, fields };
  const a = parsed.value;

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || null;
  const inclusions = inclusionsFrom(offer.inclusions);
  const signedAt = new Date();
  const facts: ContractFacts = {
    offerId: offer.id,
    businessName: offer.businessName,
    legalName: a.legalName,
    companyNumber: a.companyNumber,
    address: a.address,
    signerName: a.signerName,
    signerRole: a.signerRole,
    signature: a.signature,
    accountEmail: a.accountEmail,
    price: offerPriceLabel(offer),
    priceNote: offerPriceNote(offer),
    inclusions,
    specialTerms: offer.specialTerms,
    firstMasterclass: offer.firstMasterclass,
    firstFeature: offer.firstFeature,
    termsVersion: PARTNER_TERMS_VERSION,
    terms: partnerTerms,
    signedAt,
    ip: ip?.slice(0, 64) ?? null,
    countersignedBy: COUNTERSIGNED_BY,
  };
  const text = contractText(facts);
  const fingerprint = sha256(text);

  // Claimed with a conditional update, so two submits can't both go through.
  const claimed = await prisma.partnerOffer.updateMany({
    where: { id: offer.id, status: "sent" },
    data: {
      status: "accepted",
      acceptedAt: signedAt,
      termsVersion: PARTNER_TERMS_VERSION,
      ...a,
      acceptedIp: facts.ip,
      userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
      contractSha256: fingerprint,
      snapshot: {
        offer: {
          businessName: offer.businessName,
          price: facts.price,
          priceNote: facts.priceNote,
          fixedPrice: offer.fixedPrice,
          isFounding: offer.isFounding,
          inclusions,
          specialTerms: offer.specialTerms,
          firstMasterclass: offer.firstMasterclass,
          firstFeature: offer.firstFeature,
        },
        termsVersion: PARTNER_TERMS_VERSION,
        terms: partnerTerms,
        generalTerms: { url: "/terms", updated: LEGAL_UPDATED },
        countersignedBy: COUNTERSIGNED_BY,
        contractText: text,
      },
    },
  });
  if (!claimed.count) redirect(`${offerPath(token)}#payment`);

  // Their account, so the contract has an owner and they can sign straight in later.
  const user = await prisma.user.upsert({
    where: { email: a.accountEmail },
    update: {},
    create: { email: a.accountEmail, name: a.signerName },
    select: { id: true },
  });

  // The countersigned PDF, stored privately. Signing still counts if storage fails; the text is kept above.
  try {
    const bytes = await buildContractPdf({ ...facts, sha256: fingerprint });
    const safeName = offer.businessName.replace(/[^\w-]+/g, "-").replace(/^-|-$/g, "") || "Partner";
    const stored = await storeUpload({
      kind: "document",
      file: new File([new Uint8Array(bytes)], `Trichollective-Premium-Agreement-${safeName}.pdf`, { type: "application/pdf" }),
      ownerId: user.id,
      isPublic: false,
    });
    if (stored?.ok) await prisma.partnerOffer.update({ where: { id: offer.id }, data: { contractFileId: stored.file.id } });
    else console.error("[PARTNER_OFFER_PDF]", stored);
  } catch (error) {
    console.error("[PARTNER_OFFER_PDF]", error);
  }

  try {
    await upsertOrganisationFromIntake({
      name: offer.businessName,
      category: offer.category,
      website: offer.website,
      email: a.accountEmail,
      contactName: a.signerName,
      contactTitle: a.signerRole,
      source: "partner-offer",
      interest: "premium",
      // Won: signed. It becomes a customer when the payment arrives.
      stage: "won",
      accountEmail: a.accountEmail,
      intake: { offerId: offer.id, legalName: a.legalName, companyNumber: a.companyNumber, address: a.address, termsVersion: PARTNER_TERMS_VERSION, contractSha256: fingerprint },
      note: `${a.signerName} signed the Premium partner agreement (terms version ${PARTNER_TERMS_VERSION}) at ${facts.price}.`,
    });
  } catch (error) {
    console.error("[PARTNER_OFFER_CRM]", error);
  }

  const mail = {
    businessName: offer.businessName,
    legalName: a.legalName,
    signerName: a.signerName,
    signerRole: a.signerRole,
    accountEmail: a.accountEmail,
    price: facts.price,
    priceNote: facts.priceNote,
    inclusions,
    specialTerms: offer.specialTerms,
    termsVersion: PARTNER_TERMS_VERSION,
    acceptedAt: longDate(signedAt),
    offerPath: offerPath(token),
    paid: !!offer.paidAt,
  };
  const copy = partnerAgreementEmail(mail);
  await deliverOnce(`partner-offer:${offer.id}:agreement`, a.accountEmail, copy.subject, copy.content, { tag: "partner-agreement" });
  if (offer.email.toLowerCase() !== a.accountEmail) {
    await deliverOnce(`partner-offer:${offer.id}:agreement-contact`, offer.email, copy.subject, copy.content, { tag: "partner-agreement" });
  }
  await alertOwners(partnerAcceptedAlert({ ...mail, companyNumber: a.companyNumber, address: a.address }));

  // The sign-in page fills in the email they chose.
  (await cookies()).set(SIGNIN_EMAIL_COOKIE, a.accountEmail, signinEmailCookieOptions);
  redirect(`${offerPath(token)}#payment`);
}

async function signedOffer(token: string) {
  const offer = await prisma.partnerOffer.findUnique({ where: { token } });
  if (!offer || offer.status !== "accepted" || !offer.accountEmail) return null;
  return offer;
}

/** Card: an embedded Checkout session for this offer. Only once signed, and never twice once paid. */
export async function startOfferCheckout(token: string): Promise<{ clientSecret: string } | { url: string } | { error: string }> {
  const offer = await signedOffer(token);
  if (!offer) return { error: "Please sign the agreement first." };
  if (offer.paidAt) return { error: "This partnership has already been paid. Thank you." };
  try {
    const session = await createOfferCheckout(offer);
    await prisma.partnerOffer.update({ where: { id: offer.id }, data: { checkoutSessionId: session.id, paymentMethod: "card" } });
    if (session.client_secret) return { clientSecret: session.client_secret };
    if (session.url) return { url: session.url };
    return { error: "Payment could not be started. Please try again in a moment." };
  } catch (error) {
    console.error("[OFFER_CHECKOUT]", error);
    return { error: "Payment could not be started. Please try again in a moment, or ask us for an invoice." };
  }
}

/** Invoice: Stripe emails an invoice, payable by card or bank transfer. The page opens when it is paid. */
export async function requestOfferInvoice(token: string) {
  const offer = await signedOffer(token);
  if (!offer || offer.paidAt || offer.stripeSubscriptionId) redirect(`${offerPath(token)}#payment`);
  const { customerId, subscription, invoiceUrl } = await createOfferInvoice(offer, {
    name: offer.legalName ?? offer.businessName,
    address: offer.address ?? "",
  });
  await prisma.partnerOffer.update({
    where: { id: offer.id },
    data: { paymentMethod: "invoice", stripeCustomerId: customerId, stripeSubscriptionId: subscription.id, invoiceUrl },
  });
  // The account is tied to the subscription now; it becomes a Business account when the invoice is paid.
  await prisma.user.updateMany({
    where: { email: offer.accountEmail! },
    data: { stripeCustomerId: customerId, stripeSubscriptionId: subscription.id },
  });
  redirect(`${offerPath(token)}#welcome`);
}
