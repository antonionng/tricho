"use server";

import { prisma } from "@/lib/prisma";
import { PARTNER_CATEGORIES } from "@/lib/partners";
import { after } from "next/server";
import { alertOwners, deliver } from "@/lib/mail/send";
import { partnerAcknowledgementEmail, partnerAlert, type PartnerEnquiry } from "@/lib/mail/templates/leads";

export type EnquiryState =
  | { ok: true; message: string }
  | { ok: false; message: string; fields?: Record<string, string> }
  | null;

const INTERESTS = [
  "Trichozette",
  "Podcast",
  "Gathering",
  "Masterclass",
  "Product trial",
  "Featured perk",
  "Business membership",
  "Premium Business",
  "Something else",
] as const;

/** Tiers a partner application can ask about. */
const APPLICATION_TIERS = { premium: "Premium Business", business: "Business", unsure: "Not sure yet" } as const;
type ApplicationTier = keyof typeof APPLICATION_TIERS;

function field(formData: FormData, name: string, max: number) {
  return String(formData.get(name) ?? "").trim().slice(0, max);
}

function cleanWebsite(value: string) {
  if (!value) return "";
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

/**
 * Partnership enquiries and partner applications (from /for-business#apply).
 * Applications send form=application with a tier, a product category, what
 * they sell and their website. Stored as a Draft so it
 * lands in the Studio inbox for review.
 */
export async function partnerEnquiry(_prev: EnquiryState, formData: FormData): Promise<EnquiryState> {
  // Honeypot: real people never fill this in.
  if (field(formData, "website", 200)) {
    return { ok: true, message: "Thank you. We'll be in touch." };
  }

  const company = field(formData, "company", 120);
  const name = field(formData, "name", 120);
  const email = field(formData, "email", 160).toLowerCase();
  const role = field(formData, "role", 120);
  const interest = field(formData, "interest", 40);
  const budget = field(formData, "budget", 80);
  const message = field(formData, "message", 4000);

  // Partner applications carry a few extra details. The honeypot above is named
  // "website", so the company's real website arrives as "companyUrl".
  const isApplication = field(formData, "form", 20) === "application";
  const tierRaw = field(formData, "tier", 20);
  const tier: ApplicationTier = tierRaw in APPLICATION_TIERS ? (tierRaw as ApplicationTier) : "unsure";
  const categoryRaw = field(formData, "category", 60);
  const category = (PARTNER_CATEGORIES as readonly string[]).includes(categoryRaw) ? categoryRaw : "";
  const sells = field(formData, "sells", 1000);
  const companyUrlRaw = field(formData, "companyUrl", 300);
  const companyUrl = cleanWebsite(companyUrlRaw);

  const fields: Record<string, string> = isApplication
    ? { company, name, email, role, message, tier, category: categoryRaw, sells, companyUrl: companyUrlRaw }
    : { company, name, email, role, interest, budget, message };

  if (!company || !name) {
    return { ok: false, message: "Please tell us your name and your company.", fields };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Please check your email address.", fields };
  }
  if (isApplication) {
    if (!category) {
      return { ok: false, message: "Please choose the product category that fits you best.", fields };
    }
    if (sells.length < 10) {
      return { ok: false, message: "Please tell us in a sentence or two what you sell.", fields };
    }
    if (companyUrlRaw && !companyUrl) {
      return { ok: false, message: "Please check your website address.", fields };
    }
  } else if (message.length < 10) {
    return { ok: false, message: "Please add a few words about what you have in mind.", fields };
  }

  const safeInterest = isApplication
    ? tier === "premium"
      ? "Premium Business"
      : tier === "business"
        ? "Business membership"
        : "Something else"
    : (INTERESTS as readonly string[]).includes(interest)
      ? interest
      : "Something else";

  const body = [
    isApplication ? "Partner application" : null,
    `Company: ${company}`,
    `Name: ${name}${role ? ` (${role})` : ""}`,
    `Email: ${email}`,
    isApplication ? `Tier: ${APPLICATION_TIERS[tier]}` : `Interested in: ${safeInterest}`,
    isApplication ? `Category: ${category}` : null,
    companyUrl ? `Website: ${companyUrl}` : null,
    budget ? `Budget: ${budget}` : null,
    isApplication ? `What they sell: ${sells}` : null,
    message ? "" : null,
    message || null,
  ]
    .filter((line) => line !== null)
    .join("\n");

  let draftId: string;
  try {
    const draft = await prisma.draft.create({
      data: {
        agent: "website",
        kind: "partner_enquiry",
        title: isApplication ? `${company}: partner application` : company,
        summary: isApplication
          ? `${name} · ${APPLICATION_TIERS[tier]} · ${category}`
          : `${name} · ${safeInterest}`,
        body,
        payload: isApplication
          ? {
              application: true,
              company,
              name,
              email,
              role,
              interest: safeInterest,
              tier,
              category,
              sells,
              website: companyUrl,
              message,
            }
          : { company, name, email, role, interest: safeInterest, budget, message },
      },
      select: { id: true },
    });
    draftId = draft.id;
  } catch (error) {
    console.error("[PARTNER_ENQUIRY]", error);
    return {
      ok: false,
      message: "Something went wrong sending your enquiry. Please try again, or email us instead.",
      fields,
    };
  }

  const enquiry: PartnerEnquiry = isApplication
    ? {
        application: true,
        company,
        name,
        email,
        role,
        tier: APPLICATION_TIERS[tier],
        category,
        sells,
        website: companyUrl,
        message,
      }
    : { application: false, company, name, email, role, interest: safeInterest, budget, message };
  after(async () => {
    const { subject, content } = partnerAcknowledgementEmail(enquiry);
    await Promise.all([
      alertOwners(partnerAlert(enquiry, draftId)),
      deliver(email, subject, content, { tag: isApplication ? "partner-application" : "business-enquiry" }),
    ]);
  });

  return {
    ok: true,
    message: isApplication
      ? `Thank you, ${name.split(" ")[0]}. Your application has reached us. We read every one ourselves and will reply by email within three working days.`
      : `Thank you, ${name.split(" ")[0]}. Your enquiry has reached us, and we'll reply by email within three working days.`,
  };
}
