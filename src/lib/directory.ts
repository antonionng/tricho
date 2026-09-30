import { prisma } from "@/lib/prisma";
import { publicListingWhere } from "@/lib/stats";
import type { DisciplineId } from "@/content/disciplines";

export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** A stable, unique, readable slug: "jane-doe-dublin", then "-2", "-3"… */
export async function uniqueListingSlug(name: string, city: string) {
  const base = slugify(`${name} ${city}`) || "listing";
  let slug = base;
  for (let i = 2; await prisma.directoryListing.findUnique({ where: { slug }, select: { id: true } }); i++) {
    slug = `${base}-${i}`;
  }
  return slug;
}

export const cityKey = (city: string) => slugify(city);

export type PublicListing = Awaited<ReturnType<typeof searchListings>>[number];

const listingSelect = {
  id: true,
  slug: true,
  name: true,
  profession: true,
  city: true,
  country: true,
  specialization: true,
  headline: true,
  bio: true,
  website: true,
  services: true,
  photoUrl: true,
  isFounding: true,
  isVerified: true,
  acceptsReferrals: true,
  kind: true,
  freeUntil: true,
  createdAt: true,
} as const;

/** Claimed (paid) listings first, then verified, then newest. */
export async function searchListings({
  q,
  discipline,
  city,
  take = 60,
}: {
  q?: string;
  discipline?: DisciplineId;
  city?: string;
  take?: number;
}) {
  const query = q?.trim();
  return prisma.directoryListing.findMany({
    where: {
      AND: [
        publicListingWhere(),
        discipline ? { profession: discipline } : {},
        city ? { city: { equals: city, mode: "insensitive" } } : {},
        query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { city: { contains: query, mode: "insensitive" } },
                { specialization: { contains: query, mode: "insensitive" } },
                { headline: { contains: query, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    },
    orderBy: [{ kind: "desc" }, { isVerified: "desc" }, { createdAt: "desc" }],
    take,
    select: listingSelect,
  });
}

export async function listingBySlug(slug: string) {
  return prisma.directoryListing.findFirst({
    where: { AND: [{ slug }, publicListingWhere()] },
    select: listingSelect,
  });
}

/** Discipline + city pairs with real listings, for SEO landing pages and the sitemap. */
export async function listingCityPairs(minimum = 1) {
  const rows = await prisma.directoryListing.groupBy({
    by: ["profession", "city"],
    where: publicListingWhere(),
    _count: { _all: true },
  });
  return rows
    .filter((r) => r.profession !== "brand" && r._count._all >= minimum)
    .map((r) => ({ discipline: r.profession as DisciplineId, city: r.city, count: r._count._all }));
}

export const isClaimed = (l: { kind: string }) => l.kind === "member";
