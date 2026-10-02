import type { Partner, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";
import { premiumBusiness } from "@/config/subscriptions";
import { slugify } from "@/lib/directory";

export type PartnerTier = "premium" | "business";

export const PARTNER_TIERS: { id: PartnerTier; label: string }[] = [
  { id: "premium", label: "Premium partner" },
  { id: "business", label: "Business partner" },
];

/** Product categories, shown on partner pages and asked for at the Premium checkout. */
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
 * The Premium Business rule, checked against everything else already saved: at most six
 * founding premium partners. Returns a friendly message when it would be broken.
 */
export async function partnerCapError(
  tx: Pick<Prisma.TransactionClient, "partner">,
  data: { id?: string; tier: string; isFounding: boolean }
) {
  if (data.tier !== "premium" || !data.isFounding) return null;
  const others = data.id ? { id: { not: data.id } } : {};
  const founding = await tx.partner.count({ where: { ...others, tier: "premium", isFounding: true } });
  if (founding >= premiumBusiness.foundingPlaces) {
    return `All ${premiumBusiness.foundingPlaces} founding Premium places are taken. Untick Founding partner to save this partner at the standard price.`;
  }
  return null;
}

/** Checkout dropdown keys must be letters and numbers only, e.g. "Scalp care" -> "scalpcare". */
export function categoryKey(category: string) {
  return category.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** What the Premium checkout asks for, so the partner page can go live the moment it is paid. */
export function premiumCheckoutFields(): Stripe.Checkout.SessionCreateParams.CustomField[] {
  return [
    { key: "brand", label: { type: "custom", custom: "Brand or company name" }, type: "text", text: { maximum_length: 120 } },
    {
      key: "category",
      label: { type: "custom", custom: "What you make or offer" },
      type: "dropdown",
      dropdown: { options: PARTNER_CATEGORIES.map((c) => ({ label: c, value: categoryKey(c) })) },
    },
    { key: "website", label: { type: "custom", custom: "Website" }, type: "text", optional: true, text: { maximum_length: 200 } },
  ];
}

/** Reads the brand's answers back from a completed Premium checkout. */
export function premiumCheckoutAnswers(fields: Stripe.Checkout.Session.CustomField[] | null | undefined) {
  const value = (key: string) => {
    const f = fields?.find((x) => x.key === key);
    return (f?.text?.value ?? f?.dropdown?.value ?? "").trim();
  };
  const category = PARTNER_CATEGORIES.find((c) => categoryKey(c) === value("category")) ?? "Something else";
  const raw = value("website");
  const website = raw ? safeHttpUrl(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`) : null;
  return { name: value("brand").slice(0, 120), category, website };
}

async function uniquePartnerSlug(tx: Prisma.TransactionClient, name: string) {
  const base = slugify(name).slice(0, 60) || "partner";
  for (let i = 1; i < 50; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    if (!(await tx.partner.findUnique({ where: { slug }, select: { id: true } }))) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/**
 * A brand paid for Premium online: their partner page goes live straight away and they manage it
 * from "Your business". A page they already have keeps its words and logo, and a page the Studio
 * has taken down stays down.
 */
export async function activatePremiumPartner(p: {
  ownerEmail: string;
  name: string;
  category: string;
  website: string | null;
  isFounding: boolean;
}) {
  const name = p.name || p.ownerEmail.split("@")[0];
  return prisma.$transaction(async (tx) => {
    const existing = await tx.partner.findUnique({ where: { ownerEmail: p.ownerEmail } });
    if (existing) {
      return tx.partner.update({
        where: { id: existing.id },
        data: { tier: "premium", published: !existing.hidden, isFounding: existing.isFounding || p.isFounding },
      });
    }
    return tx.partner.create({
      data: {
        slug: await uniquePartnerSlug(tx, name),
        name,
        tier: "premium",
        category: p.category,
        blurb: `${name} supports hair and scalp professionals as a Premium partner of Trichollective.`,
        website: p.website,
        contactEmail: p.ownerEmail,
        ownerEmail: p.ownerEmail,
        isFounding: p.isFounding,
        published: true,
      },
    });
  });
}

/** Premium ended: the page comes down and the brand loses Premium, Business seats included. */
export async function endPremiumPartner(ownerEmail: string) {
  return prisma.partner.updateMany({
    where: { ownerEmail, tier: "premium" },
    data: { tier: "business", published: false },
  });
}
