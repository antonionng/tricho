"use server";

import { prisma } from "@/lib/prisma";

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
  "Something else",
] as const;

function field(formData: FormData, name: string, max: number) {
  return String(formData.get(name) ?? "").trim().slice(0, max);
}

/**
 * Partnership and sponsorship enquiries from /partners. Stored as a Draft so it
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

  const fields = { company, name, email, role, interest, budget, message };

  if (!company || !name) {
    return { ok: false, message: "Please tell us your name and your company.", fields };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Please check your email address.", fields };
  }
  if (message.length < 10) {
    return { ok: false, message: "Please add a few words about what you have in mind.", fields };
  }

  const safeInterest = (INTERESTS as readonly string[]).includes(interest) ? interest : "Something else";

  const body = [
    `Company: ${company}`,
    `Name: ${name}${role ? ` (${role})` : ""}`,
    `Email: ${email}`,
    `Interested in: ${safeInterest}`,
    budget ? `Budget: ${budget}` : null,
    "",
    message,
  ]
    .filter((line) => line !== null)
    .join("\n");

  try {
    await prisma.draft.create({
      data: {
        agent: "website",
        kind: "partner_enquiry",
        title: company,
        summary: `${name} · ${safeInterest}`,
        body,
        payload: { company, name, email, role, interest: safeInterest, budget, message },
      },
    });
  } catch (error) {
    console.error("[PARTNER_ENQUIRY]", error);
    return {
      ok: false,
      message: "Something went wrong sending your enquiry. Please try again, or email us instead.",
      fields,
    };
  }

  return {
    ok: true,
    message: `Thank you, ${name.split(" ")[0]}. Your enquiry has reached us, and we'll reply by email within a few working days.`,
  };
}
