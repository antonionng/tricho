import type { Partner, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { premiumBusiness } from "@/config/subscriptions";

export type PartnerTier = "premium" | "business";

export const PARTNER_TIERS: { id: PartnerTier; label: string }[] = [
  { id: "premium", label: "Premium partner" },
  { id: "business", label: "Business partner" },
];

/** Product categories. Premium Business allows at most two published partners in each. */
export const PARTNER_CATEGORIES = [
  "Scalp care",
  "Haircare",
  "Devices and diagnostics",
  "Supplements and nutrition",
  "Hair systems and wigs",
  "Salon and head spa equipment",
  "Education and training",
  "Clinic services",
  "Software and booking",
  "Something else",
] as const;

export function partnerTierLabel(tier: string) {
  return tier === "premium" ? "Premium partner" : "Business partner";
}

/** Premium first, then partners currently featured, then by name. */
export function sortPartners<T extends Pick<Partner, "tier" | "featuredUntil" | "name">>(rows: T[], now = new Date()) {
  const featured = (p: T) => (p.featuredUntil && p.featuredUntil > now ? 1 : 0);
  return [...rows].sort(
    (a, b) =>
      (b.tier === "premium" ? 1 : 0) - (a.tier === "premium" ? 1 : 0) ||
      featured(b) - featured(a) ||
      a.name.localeCompare(b.name, "en-GB")
  );
}

/** Published partners for the public showcase and member perks. Empty if the table is unavailable. */
export async function publishedPartners() {
  const rows = await prisma.partner.findMany({ where: { published: true } }).catch((error) => {
    console.error("[PARTNERS]", error);
    return [] as Partner[];
  });
  return sortPartners(rows);
}

export async function publishedPremiumPartners() {
  const rows = await prisma.partner
    .findMany({ where: { published: true, tier: "premium" } })
    .catch(() => [] as Partner[]);
  return sortPartners(rows);
}

/** Only http(s) links are ever rendered, so a stray "javascript:" value can't reach an href or src. */
export function safeHttpUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** A partner's logo: one uploaded in the brand portal (served by us), or an http(s) link set in the Studio. */
export function partnerLogoSrc(value: string | null | undefined) {
  if (value && /^\/api\/partners\/[a-z0-9-]+\/logo(\?v=\d+)?$/.test(value)) return value;
  return safeHttpUrl(value);
}

/** Logo uploads: raster images only (an SVG served from our own origin could carry script). */
export const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const LOGO_MAX_BYTES = 1024 * 1024;

/** A readable host for a website link, e.g. "example.com". */
export function displayHost(value: string | null | undefined) {
  const safe = safeHttpUrl(value);
  if (!safe) return null;
  return new URL(safe).host.replace(/^www\./, "");
}

/**
 * The two Premium Business rules, checked against everything else already saved:
 * at most two published premium partners in a category, and at most six founding premium partners.
 * Returns a friendly message when a rule would be broken.
 */
export async function partnerCapError(
  tx: Pick<Prisma.TransactionClient, "partner">,
  data: { id?: string; tier: string; category: string; published: boolean; isFounding: boolean }
) {
  if (data.tier !== "premium") return null;
  const others = data.id ? { id: { not: data.id } } : {};

  if (data.published) {
    const inCategory = await tx.partner.count({
      where: {
        ...others,
        tier: "premium",
        published: true,
        category: { equals: data.category, mode: "insensitive" },
      },
    });
    if (inCategory >= premiumBusiness.perCategoryLimit) {
      return `${data.category} already has ${premiumBusiness.perCategoryLimit} published Premium partners, which is the most we allow in one category. Save this partner unpublished, choose another category, or unpublish one of the others first.`;
    }
  }

  if (data.isFounding) {
    const founding = await tx.partner.count({ where: { ...others, tier: "premium", isFounding: true } });
    if (founding >= premiumBusiness.foundingPlaces) {
      return `All ${premiumBusiness.foundingPlaces} founding Premium places are taken. Untick Founding partner to save this partner at the standard price.`;
    }
  }
  return null;
}

