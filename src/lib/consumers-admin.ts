import type { Prisma } from "@prisma/client";
import { CONCERNS } from "@/config/consumer";

/** Consumer accounts in Studio, optionally narrowed by a search on email, name or alias. */
export function consumerWhere(q: string): Prisma.UserWhereInput {
  const term = q.trim().slice(0, 100);
  const base: Prisma.UserWhereInput = { accountType: "consumer" };
  if (!term) return base;
  return {
    ...base,
    OR: [
      { email: { contains: term, mode: "insensitive" } },
      { name: { contains: term, mode: "insensitive" } },
      { consumerProfile: { alias: { contains: term, mode: "insensitive" } } },
    ],
  };
}

/** What a consumer has agreed to, in words for Studio. */
export function consentLines(p: { marketingConsentAt: Date | null; healthDataConsentAt: Date | null }, user: { emailUpdates: boolean; emailActivity: boolean }) {
  return {
    news: !!p.marketingConsentAt && user.emailUpdates,
    enquiryEmails: user.emailActivity,
    health: !!p.healthDataConsentAt,
  };
}

/**
 * The concern labels to show staff. Only while health-data consent stands: a stray value
 * left behind after consent was withdrawn is never shown.
 */
export function concernLabels(p: { concerns: string[]; healthDataConsentAt: Date | null }) {
  if (!p.healthDataConsentAt) return [];
  return CONCERNS.filter((c) => p.concerns.includes(c.id)).map((c) => c.short);
}
