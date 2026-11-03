import type { Prisma } from "@prisma/client";
import { CONCERNS, type ConcernId } from "@/config/consumer";

/**
 * Listings that mention a concern in their specialism, headline, bio or services.
 * Only the category the visitor chose is used: nothing about them is stored.
 */
export function concernWhere(concern: ConcernId | undefined): Prisma.DirectoryListingWhereInput {
  const c = CONCERNS.find((x) => x.id === concern);
  if (!c) return {};
  return {
    OR: c.terms.flatMap((term) => [
      { specialization: { contains: term, mode: "insensitive" as const } },
      { headline: { contains: term, mode: "insensitive" as const } },
      { bio: { contains: term, mode: "insensitive" as const } },
      // Services are a list of short labels, so match the common capitalisations exactly.
      { services: { hasSome: [term, term[0].toUpperCase() + term.slice(1)] } },
    ]),
  };
}
