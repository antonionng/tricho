import { site } from "@/config/site";

/** True while free listing leads the homepage (launch day to 3 January 2027). */
export function freeListingOfferLive(now = new Date()) {
  const { startsAt, endsAt } = site.freeListingOffer;
  return now >= new Date(startsAt) && now < new Date(endsAt);
}
