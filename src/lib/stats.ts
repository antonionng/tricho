import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PROFESSIONAL_ACCOUNTS } from "@/lib/account-type";

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
      prisma.user
        .count({ where: { ...PROFESSIONAL_ACCOUNTS, stripeCurrentPeriodEnd: { gt: new Date() } } })
        // Hidden below the threshold anyway, so a database without the latest migration (a preview build) still renders.
        .catch((error) => {
          console.error("[stats] couldn't count members", error);
          return 0;
        }),
    ]);
    return { listings, cities: cities.length, members };
  },
  ["public-stats"],
  { revalidate: 600 }
);

export const STAT_THRESHOLDS = { listings: 25, cities: 5, members: 50 };
