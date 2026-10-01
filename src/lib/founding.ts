import { prisma } from "@/lib/prisma";
import { FOUNDING_MEMBER_PLACES, premiumBusiness } from "@/config/subscriptions";

/** Pure maths, so it can be tested: never negative, never more than the total. */
export function placesLeft(total: number, taken: number) {
  return Math.min(total, Math.max(0, total - taken));
}

/** Founding places for individual members that are still genuinely available. */
export async function foundingMemberPlacesLeft() {
  const taken = await prisma.user.count({ where: { isFounding: true, plan: { not: null } } });
  return placesLeft(FOUNDING_MEMBER_PLACES, taken);
}

/** Founding Premium Business places still available. */
export async function foundingPartnerPlacesLeft() {
  const taken = await prisma.partner.count({ where: { tier: "premium", isFounding: true } }).catch(() => 0);
  return placesLeft(premiumBusiness.foundingPlaces, taken);
}
