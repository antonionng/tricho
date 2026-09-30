import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const showSamples = process.env.NODE_ENV !== "production";

/** Where clause for listings the public may see. Sample rows never reach production. */
export function publicListingWhere() {
  return {
    status: "listed" as const,
    ...(showSamples ? {} : { isSample: false }),
  };
}

/**
 * Real, live numbers for the marketing site. Each figure is only shown once it
 * passes a threshold, so we never advertise a small or invented number.
 */
export const getPublicStats = unstable_cache(
  async () => {
    const where = publicListingWhere();
    const [listings, cities, members] = await Promise.all([
      prisma.directoryListing.count({ where }),
      prisma.directoryListing.findMany({ where, distinct: ["city"], select: { city: true } }),
      prisma.user.count({ where: { stripeCurrentPeriodEnd: { gt: new Date() } } }),
    ]);
    return { listings, cities: cities.length, members };
  },
  ["public-stats"],
  { revalidate: 600 }
);

export const STAT_THRESHOLDS = { listings: 25, cities: 5, members: 50 };
