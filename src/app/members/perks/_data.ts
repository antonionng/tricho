import "server-only";
import { prisma } from "@/lib/prisma";
import { trackPartners } from "@/lib/partner-tracking";
import { publishedPartners } from "@/lib/partners";

/** Partners with a member perk, in the order the perks page shows them. */
export async function partnersWithPerks() {
  return (await publishedPartners()).filter((p) => p.perk);
}

/** Counts each perk a member has been shown. Ids that are not live perks are ignored. */
export async function countPerkViews(raw: unknown, userAgent: string | null) {
  const ids = Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string").slice(0, 100) : [];
  if (!ids.length) return;
  const partners = await prisma.partner
    .findMany({ where: { id: { in: ids }, published: true, hidden: false, perk: { not: null } }, select: { id: true, ownerEmail: true } })
    .catch(() => []);
  await trackPartners(partners, "perkViews", userAgent);
}
