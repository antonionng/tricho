import { zonedToDate } from "@/lib/event-input";
import { DEFAULT_EXTRAS_PER_PACKAGE, MAX_EXTRAS_LIMIT, type TicketKind } from "@/lib/packages";

/**
 * Validating the Studio ticket-type form. Pure, so the rules are tested
 * without a database. Prices are typed in pounds and stored in pence.
 */

/** Stripe's smallest card payment in pounds sterling. */
export const MIN_TICKET_PENCE = 30;
export const MAX_PER_ORDER_LIMIT = 20;

export type TicketTypeInput = {
  name: string;
  description: string;
  pricePence: number;
  memberPricePence: number | null;
  membersOnly: boolean;
  capacity: number | null;
  salesStart: Date | null;
  salesEnd: Date | null;
  maxPerOrder: number;
  sortOrder: number;
  active: boolean;
  kind: TicketKind;
  placesIncluded: number;
  includesStand: boolean;
  includesStageSlot: boolean;
  addonForTypeIds: string[];
};

/** The most places one package can include. */
export const MAX_PLACES_INCLUDED = 20;

type Raw = Record<string, string | undefined>;

/** "149.50", "£149" or "149" as pence, or null when blank or not a price. */
export function poundsToPence(value: string | undefined): number | null {
  const v = (value ?? "").trim().replace(/^£/, "").replace(/,/g, "");
  if (!v || !/^\d+(\.\d{1,2})?$/.test(v)) return null;
  return Math.round(Number(v) * 100);
}

/** Pence as the value the price box shows: "149.5" becomes "149.50", "60" stays "60". */
export function penceToPounds(pence: number | null | undefined) {
  if (pence == null) return "";
  return pence % 100 === 0 ? String(pence / 100) : (pence / 100).toFixed(2);
}

function whole(value: string | undefined) {
  const v = (value ?? "").trim();
  if (!v) return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? n : null;
}

/**
 * Packages and add-ons are checked by the same rules, with these differences:
 * a package is bought one at a time, sets how many places it includes and
 * whether it takes a stand or a stage slot, and has no member price; an add-on
 * lists the package types it is offered with, and its "most per order" is the
 * most extra places one package can add in total.
 */
export function validateTicketType(
  raw: Raw,
  tz: string,
  opts: { addonFor?: string[]; packageIds?: string[] } = {}
): { ok: true; data: TicketTypeInput } | { ok: false; error: string } {
  const kind: TicketKind = raw.kind === "package" || raw.kind === "addon" ? raw.kind : "attendee";
  const name = (raw.name ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  if (!name) {
    return {
      ok: false,
      error:
        kind === "package"
          ? "Please give the package a name, such as Elevate."
          : kind === "addon"
            ? "Please give the extra places a name, such as Extra exhibitor ticket."
            : "Please give the ticket type a name, such as Early bird.",
    };
  }

  const pricePence = poundsToPence(raw.price);
  if (pricePence == null || pricePence < MIN_TICKET_PENCE) {
    return { ok: false, error: `Please give ${name} a price of at least £${(MIN_TICKET_PENCE / 100).toFixed(2)}.` };
  }
  let memberPricePence: number | null = null;
  if (kind === "attendee" && (raw.memberPrice ?? "").trim()) {
    memberPricePence = poundsToPence(raw.memberPrice);
    if (memberPricePence == null || memberPricePence < MIN_TICKET_PENCE) {
      return { ok: false, error: `The member price for ${name} must be at least £${(MIN_TICKET_PENCE / 100).toFixed(2)}, or left blank.` };
    }
  }

  const capacityRaw = whole(raw.capacity);
  if (capacityRaw != null && capacityRaw < 1) return { ok: false, error: `Places for ${name} must be at least 1, or left blank for no limit.` };

  const maxRaw = whole(raw.maxPerOrder);
  const maxPerOrder =
    kind === "package"
      ? 1
      : kind === "addon"
        ? Math.min(MAX_EXTRAS_LIMIT, Math.max(1, maxRaw ?? DEFAULT_EXTRAS_PER_PACKAGE))
        : Math.min(MAX_PER_ORDER_LIMIT, Math.max(1, maxRaw ?? 4));

  const placesRaw = whole(raw.placesIncluded);
  if (kind === "package" && (placesRaw == null || placesRaw < 0 || placesRaw > MAX_PLACES_INCLUDED)) {
    return { ok: false, error: `Please say how many delegate places ${name} includes, from 0 to ${MAX_PLACES_INCLUDED}.` };
  }
  const known = new Set(opts.packageIds ?? []);
  const addonForTypeIds = kind === "addon" ? [...new Set(opts.addonFor ?? [])].filter((id) => !opts.packageIds || known.has(id)) : [];

  const salesStart = (raw.salesStart ?? "").trim() ? zonedToDate(raw.salesStart!.trim(), tz) : null;
  const salesEnd = (raw.salesEnd ?? "").trim() ? zonedToDate(raw.salesEnd!.trim(), tz) : null;
  if ((raw.salesStart ?? "").trim() && !salesStart) return { ok: false, error: `Please give a complete date and time for when ${name} goes on sale.` };
  if ((raw.salesEnd ?? "").trim() && !salesEnd) return { ok: false, error: `Please give a complete date and time for when ${name} stops selling.` };
  if (salesStart && salesEnd && salesEnd <= salesStart) return { ok: false, error: `${name} must stop selling after it goes on sale.` };

  return {
    ok: true,
    data: {
      name,
      // A package lists its benefits one per line, so it has room for more.
      description:
        kind === "package"
          ? (raw.description ?? "")
              .replace(/\r/g, "")
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean)
              .join("\n")
              .slice(0, 1200)
          : (raw.description ?? "").trim().slice(0, 300),
      pricePence,
      memberPricePence,
      membersOnly: kind === "attendee" && raw.membersOnly === "on",
      capacity: capacityRaw,
      salesStart,
      salesEnd,
      maxPerOrder,
      sortOrder: whole(raw.sortOrder) ?? 0,
      active: raw.active === "on",
      kind,
      placesIncluded: kind === "package" ? placesRaw! : 1,
      includesStand: kind === "package" && raw.includesStand === "on",
      includesStageSlot: kind === "package" && raw.includesStageSlot === "on",
      addonForTypeIds,
    },
  };
}
