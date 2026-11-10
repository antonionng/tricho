import { attendeeRows, type AttendeeInput } from "@/lib/attendees";
import { typeAvailability, type TicketTypeRule, type TypeAvailability } from "@/lib/tickets";

/**
 * Exhibitor and sponsor packages for in-person events. Pure helpers, so the
 * checkout, the webhook, Studio and tests share the same rules.
 *
 *  - A package is an EventTicketType with kind "package". It is bought one at a
 *    time, and its capacity is its stock: how many of that package exist.
 *  - Each package includes a number of places (which can be 0). The places are
 *    EventAttendee rows; the buyer names them at checkout or later on the
 *    self-service page, and each named person gets their own e-ticket.
 *  - Stands and stage slots can also be limited across packages, with the
 *    event's standSpaces and stageSlots. Both are checked in the same lock as
 *    the package's own stock.
 *  - Extra places are an EventTicketType with kind "addon". Package holders of
 *    the types it lists can add up to its maxPerOrder places per package, in
 *    total across all their orders.
 *  - Exhibitor places do not count towards the event's Places, which is for
 *    delegates.
 */

export type TicketKind = "attendee" | "package" | "addon";

export function kindOf(type: { kind?: string | null } | null | undefined): TicketKind {
  return type?.kind === "package" || type?.kind === "addon" ? type.kind : "attendee";
}

/** The most extra places an add-on can ever offer per package. */
export const MAX_EXTRAS_LIMIT = 20;
export const DEFAULT_EXTRAS_PER_PACKAGE = 5;

export type PackageRule = TicketTypeRule & {
  kind?: string | null;
  placesIncluded: number;
  includesStand: boolean;
  includesStageSlot: boolean;
  addonForTypeIds?: string[];
};

export type PackageDefault = {
  name: string;
  pricePence: number;
  placesIncluded: number;
  includesStand: boolean;
  includesStageSlot: boolean;
  /** One benefit per line, shown as a list on the event page and in the confirmation email. */
  description: string;
  sortOrder: number;
};

/**
 * Karley's packages for TRICHOLLECTIVE UK, used to fill Studio with a starting
 * point. Everything can be changed in Studio afterwards.
 */
export const DEFAULT_PACKAGES: PackageDefault[] = [
  {
    name: "Sponsor",
    pricePence: 15_000,
    placesIncluded: 0,
    includesStand: false,
    includesStageSlot: false,
    description: "Your company listed in the event booklet that every delegate receives.",
    sortOrder: 100,
  },
  {
    name: "Exhibit",
    pricePence: 25_000,
    placesIncluded: 1,
    includesStand: false,
    includesStageSlot: false,
    description: ["Your brand included in our promotion of the event.", "Your company listed in the event booklet.", "This package does not include a stand."].join("\n"),
    sortOrder: 110,
  },
  {
    name: "Elevate",
    pricePence: 50_000,
    placesIncluded: 1,
    includesStand: true,
    includesStageSlot: false,
    description: ["A standard stand space in the exhibition area.", "Enhanced promotion of your brand before the event.", "Your company listed in the event booklet."].join("\n"),
    sortOrder: 120,
  },
  {
    name: "Evolve",
    pricePence: 75_000,
    placesIncluded: 3,
    includesStand: true,
    includesStageSlot: true,
    description: [
      "A stand space with priority positioning.",
      "A 15-minute slot on the main stage.",
      "Your company in the event booklet and in our online promotion.",
    ].join("\n"),
    sortOrder: 130,
  },
  {
    name: "Elite",
    pricePence: 100_000,
    placesIncluded: 5,
    includesStand: true,
    includesStageSlot: true,
    description: [
      "A prime stand space in the exhibition area.",
      "A 15-minute slot on the main stage.",
      "Your company in the event booklet and in our online promotion.",
      "Enhanced exposure in our social media and emails to the profession.",
    ].join("\n"),
    sortOrder: 140,
  },
];

export const DEFAULT_EXTRA_PLACES = {
  name: "Extra exhibitor ticket",
  pricePence: 10_000,
  maxPerOrder: DEFAULT_EXTRAS_PER_PACKAGE,
  description: "A place for another member of your team, with their own e-ticket.",
  sortOrder: 150,
};

/** A package or add-on order that is paid or still held, for counting stock. */
export type PackageOrder = {
  ticketTypeId: string | null;
  quantity: number;
  packageTicketId?: string | null;
  includesStand: boolean;
  includesStageSlot: boolean;
};

export type SharedStock = { standSpaces?: number | null; stageSlots?: number | null };

function minLeft(...values: (number | null)[]) {
  const set = values.filter((v): v is number => v != null);
  return set.length ? Math.max(0, Math.min(...set)) : null;
}

/** Stands and stage slots still free across the event, or null when the event sets no limit. */
export function sharedLeft(event: SharedStock, orders: PackageOrder[]) {
  const stands = orders.filter((o) => o.includesStand).length;
  const stage = orders.filter((o) => o.includesStageSlot).length;
  return {
    stands: event.standSpaces == null ? null : Math.max(0, event.standSpaces - stands),
    stage: event.stageSlots == null ? null : Math.max(0, event.stageSlots - stage),
  };
}

/**
 * Whether a package can be bought right now, and how many are left: the
 * package's own stock, and the event's stands and stage slots when it
 * includes them.
 */
export function packageAvailability(
  type: PackageRule,
  event: SharedStock & { startsAt: Date },
  orders: PackageOrder[],
  opts: { now?: Date; isMember?: boolean } = {}
): TypeAvailability {
  const taken = orders.filter((o) => o.ticketTypeId === type.id).length;
  const shared = sharedLeft(event, orders);
  const eventLeft = minLeft(type.includesStand ? shared.stands : null, type.includesStageSlot ? shared.stage : null);
  return typeAvailability(type, { now: opts.now, eventStartsAt: event.startsAt, taken, eventLeft, isMember: opts.isMember ?? true });
}

/** Why a package cannot be bought, in a sentence, or null when it can. */
export function packageBlocked(type: PackageRule, a: TypeAvailability): string | null {
  switch (a.state) {
    case "not_yet":
      return `The ${type.name} package is not on sale yet.`;
    case "closed":
      return `The ${type.name} package is no longer on sale.`;
    case "sold_out":
      return `The ${type.name} package has sold out.`;
    case "members_only":
      return `The ${type.name} package is for members. Please sign in as a member to buy it.`;
    default:
      return null;
  }
}

/** Extra places this package can still add with an add-on: its limit less what it already has, and never more than the add-on's own stock. */
export function extrasLeft(
  addon: Pick<TicketTypeRule, "id" | "maxPerOrder" | "capacity">,
  packageTicketId: string,
  orders: PackageOrder[]
) {
  const mine = orders.filter((o) => o.ticketTypeId === addon.id && o.packageTicketId === packageTicketId).reduce((s, o) => s + Math.max(0, o.quantity), 0);
  const all = orders.filter((o) => o.ticketTypeId === addon.id).reduce((s, o) => s + Math.max(0, o.quantity), 0);
  const perPackage = Math.max(0, Math.min(MAX_EXTRAS_LIMIT, addon.maxPerOrder) - mine);
  return addon.capacity == null ? perPackage : Math.max(0, Math.min(perPackage, addon.capacity - all));
}

/** The add-ons a holder of this package type can buy. */
export function addonsFor<T extends { kind?: string | null; addonForTypeIds?: string[] | null; active?: boolean }>(types: T[], packageTypeId: string) {
  return types.filter((t) => kindOf(t) === "addon" && t.active !== false && (t.addonForTypeIds ?? []).includes(packageTypeId));
}

/** What a package includes, as sentences for the event page and emails. */
export function packageIncludes(type: Pick<PackageRule, "placesIncluded" | "includesStand" | "includesStageSlot"> & { description?: string | null }) {
  const lines: string[] = [];
  const places = Math.max(0, type.placesIncluded);
  lines.push(places === 0 ? "No delegate places are included." : places === 1 ? "One delegate place, with its own e-ticket." : `${places} delegate places, each with its own e-ticket.`);
  const described = (type.description ?? "")
    .split(/\n+/)
    .map((l) => l.trim().replace(/^[-•*]\s*/, ""))
    .filter(Boolean);
  const mentions = (re: RegExp) => described.some((l) => re.test(l));
  if (type.includesStand && !mentions(/\bstand\b/i)) lines.push("A stand space in the exhibition area.");
  if (type.includesStageSlot && !mentions(/\bstage\b/i)) lines.push("A slot on the main stage.");
  return [...lines, ...described];
}

/* ------------------------------------------------------------------ */
/* What the buyer gives at checkout                                     */
/* ------------------------------------------------------------------ */

export type ExhibitorDetails = {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string | null;
  invoiceAddress: string;
  vatNumber: string | null;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function line(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "";
}

/** "acme.co.uk" becomes "https://acme.co.uk"; anything that is not a web address is refused. */
export function normaliseWebsite(value: unknown): string | null | false {
  const v = line(value, 300);
  if (!v) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    if (!/^https?:$/.test(url.protocol) || !url.hostname.includes(".")) return false;
    return url.toString().replace(/\/$/, "");
  } catch {
    return false;
  }
}

/** A UK VAT number such as "GB 123 4567 89", kept as typed but tidied. Other countries' numbers are accepted too. */
export function normaliseVat(value: unknown): string | null | false {
  const v = line(value, 40).toUpperCase().replace(/[\s.-]/g, "");
  if (!v) return null;
  if (!/^[A-Z]{0,2}[0-9A-Z]{5,15}$/.test(v)) return false;
  return v;
}

/** The company and contact details for a package. Sent in the POST body, never in a URL. */
export function exhibitorDetails(raw: unknown): { ok: true; data: ExhibitorDetails } | { ok: false; error: string } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const companyName = line(r.companyName, 120);
  const contactName = line(r.contactName, 120);
  const contactEmail = line(r.contactEmail, 200).toLowerCase();
  const contactPhone = line(r.contactPhone, 40);
  const invoiceAddress =
    typeof r.invoiceAddress === "string"
      ? r.invoiceAddress
          .split(/\n/)
          .map((l) => l.trim().replace(/\s+/g, " "))
          .filter(Boolean)
          .join("\n")
          .slice(0, 500)
      : "";
  if (!companyName) return { ok: false, error: "Please give your company's name, as it should appear on the invoice and in the booklet." };
  if (!contactName) return { ok: false, error: "Please give the name of the person we should speak to." };
  if (!EMAIL.test(contactEmail)) return { ok: false, error: "Please give an email address for the contact, so we can send the confirmation." };
  if (contactPhone.replace(/\D/g, "").length < 7) return { ok: false, error: "Please give a phone number we can reach the contact on." };
  if (!invoiceAddress) return { ok: false, error: "Please give the address the invoice should be made out to." };
  const website = normaliseWebsite(r.website);
  if (website === false) return { ok: false, error: "Please check the website address, for example www.yourbrand.co.uk." };
  const vatNumber = normaliseVat(r.vatNumber);
  if (vatNumber === false) return { ok: false, error: "Please check the VAT number, for example GB123456789, or leave it blank." };
  return { ok: true, data: { companyName, contactName, contactEmail, contactPhone, website, invoiceAddress, vatNumber } };
}

export type PackagePlace = AttendeeInput & { awaitingName: boolean };

/**
 * The places a package includes. The buyer may name some or all of them at
 * checkout; the rest wait to be named on the self-service page, under the
 * contact's email so the team can always reach someone.
 */
export function packagePlaces(
  raw: unknown,
  placesIncluded: number,
  company: { companyName: string; contactName: string; contactEmail: string }
): { ok: true; rows: PackagePlace[] } | { ok: false; error: string } {
  const places = Math.max(0, Math.round(placesIncluded) || 0);
  if (places === 0) return { ok: true, rows: [] };
  const given = (Array.isArray(raw) ? raw : [])
    .slice(0, places)
    .filter((item) => {
      const r = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
      return r.isBuyer === true || line(r.name, 120) !== "";
    });
  let named: AttendeeInput[] = [];
  if (given.length) {
    const checked = attendeeRows(given, given.length, { name: company.contactName, email: company.contactEmail });
    if (!checked.ok) return checked;
    named = checked.rows;
  }
  const waiting: PackagePlace[] = Array.from({ length: places - named.length }, (_, i) => ({
    name: `${company.companyName}, place ${named.length + i + 1}`,
    email: company.contactEmail,
    dietary: null,
    accessNeeds: null,
    isBuyer: false,
    awaitingName: true,
  }));
  return { ok: true, rows: [...named.map((r) => ({ ...r, awaitingName: false })), ...waiting] };
}

/** Booklet text: plain, short enough for a printed page. */
export const BOOKLET_BLURB_MAX = 600;

export function bookletBlurb(value: unknown) {
  if (typeof value !== "string") return null;
  const v = value
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((p) => p.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .join("\n\n");
  return v ? v.slice(0, BOOKLET_BLURB_MAX) : null;
}

/** The path of an exhibitor's self-service page. */
export function exhibitorPath(slug: string, code: string) {
  return `/events/${slug}/exhibitor/${code}`;
}

/** Stripe allows four invoice custom fields, a 40-character name and a 140-character value. */
export function invoiceFields(d: Pick<ExhibitorDetails, "companyName" | "vatNumber" | "contactName">) {
  const fields = [{ name: "Company", value: d.companyName }];
  if (d.vatNumber) fields.push({ name: "VAT number", value: d.vatNumber });
  fields.push({ name: "Contact", value: d.contactName });
  return fields.map((f) => ({ name: f.name.slice(0, 40), value: f.value.slice(0, 140) }));
}

export type BookletRow = {
  company: string;
  packageName: string;
  blurb: string | null;
  logoUrl: string | null;
  website: string | null;
  standNumber: string | null;
};

/** The columns of the booklet CSV, in order. */
export function bookletCsvRows(rows: BookletRow[], absolute: (url: string) => string) {
  return [
    ["Company", "Package", "Booklet text", "Logo URL", "Website", "Stand"],
    ...rows.map((r) => [r.company, r.packageName, r.blurb ?? "", r.logoUrl ? absolute(r.logoUrl) : "", r.website ?? "", r.standNumber ?? ""]),
  ];
}
