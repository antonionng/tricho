import type { Organisation, OrgStage, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Brings every way a business reaches us (applications, enquiries, checkouts and the
 * brand portal) into one Organisation record for the CRM. The pure helpers at the top
 * decide what changes; upsertOrganisationFromIntake applies them.
 */

export const ORGANISATION_KINDS = [
  { id: "brand", label: "Brand or manufacturer" },
  { id: "clinic", label: "Clinic" },
  { id: "salon", label: "Salon or head spa" },
  { id: "supplier", label: "Supplier or distributor" },
  { id: "education", label: "Education or training provider" },
  { id: "other", label: "Something else" },
] as const;
export type OrganisationKind = (typeof ORGANISATION_KINDS)[number]["id"];

export function isOrganisationKind(value: unknown): value is OrganisationKind {
  return ORGANISATION_KINDS.some((k) => k.id === value);
}

export const ORGANISATION_SIZES = ["1", "2-10", "11-50", "51-200", "200+"] as const;

/** The pipeline, in order. Lost and churned sit outside it and are only ever set on purpose. */
export const PIPELINE_STAGES = ["lead", "contacted", "proposal", "won", "customer"] as const satisfies readonly OrgStage[];

/**
 * The stage after an intake. Pipeline stages only move forward, so a new enquiry never pulls a
 * customer back to lead. Lost and churned are applied when asked for, and a business that was
 * lost or churned and comes back (applies again, or pays) re-enters the pipeline at the new stage.
 */
export function nextStage(current: OrgStage | null | undefined, incoming: OrgStage | null | undefined): OrgStage {
  if (!incoming) return current ?? "lead";
  if (!current) return incoming;
  if (incoming === "lost" || incoming === "churned") return incoming;
  if (current === "lost" || current === "churned") return incoming;
  const order = PIPELINE_STAGES as readonly OrgStage[];
  return order.indexOf(incoming) > order.indexOf(current) ? incoming : current;
}

/** Hosts that say nothing about who a business is, so they are never used to match records. */
const SHARED_HOSTS = new Set([
  "instagram.com",
  "facebook.com",
  "linkedin.com",
  "tiktok.com",
  "youtube.com",
  "linktr.ee",
  "x.com",
  "twitter.com",
  "etsy.com",
  "amazon.co.uk",
  "amazon.com",
  "shopify.com",
  "wixsite.com",
  "google.com",
]);

/** "https://www.Example.com/shop" -> "example.com". Null for links that can't identify a business. */
export function websiteHost(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (!host.includes(".") || SHARED_HOSTS.has(host)) return null;
    return host;
  } catch {
    return null;
  }
}

export type IntakeAddress = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  region?: string | null;
  postcode?: string | null;
  country?: string | null;
};

export type OrganisationIntake = {
  name: string;
  kind?: string | null;
  category?: string | null;
  website?: string | null;
  /** The contact's email. Also the organisation's email if it has none yet. */
  email?: string | null;
  contactName?: string | null;
  contactTitle?: string | null;
  phone?: string | null;
  address?: IntakeAddress | null;
  /** Where it came from, e.g. "application", "enquiry", "business-checkout", "premium-checkout", "brand-portal". */
  source: string;
  /** What they asked for or bought, e.g. "premium", "business". */
  interest?: string | null;
  stage?: OrgStage | null;
  /** The original submission, kept as it arrived. */
  intake?: Prisma.InputJsonValue | null;
  /** The sign-in email of the account that manages the business. */
  accountEmail?: string | null;
  partnerId?: string | null;
  /** A line for the record's timeline, e.g. "Partner application received". Skipped when empty. */
  note?: string | null;
};

type MergeTarget = Pick<
  Organisation,
  | "name"
  | "kind"
  | "category"
  | "website"
  | "email"
  | "phone"
  | "addressLine1"
  | "addressLine2"
  | "city"
  | "region"
  | "postcode"
  | "country"
  | "stage"
  | "source"
  | "interest"
  | "accountEmail"
  | "partnerId"
  | "intake"
>;

function clean(value: string | null | undefined, max = 300) {
  const v = (value ?? "").trim().slice(0, max);
  return v || null;
}

/** Only http(s) websites are stored, with a scheme added when someone types "example.com". */
export function cleanWebsite(value: string | null | undefined) {
  const v = clean(value, 500);
  if (!v) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * The fields an intake writes. A new record takes everything offered. An existing record only
 * gains fields that are still empty, so anything the team has already filled in is kept, and
 * its stage only moves as nextStage allows.
 */
export function mergeIntake(existing: Partial<MergeTarget> | null, input: OrganisationIntake) {
  const email = clean(input.email, 160)?.toLowerCase() ?? null;
  const offered = {
    name: clean(input.name, 160),
    kind: clean(input.kind, 20),
    category: clean(input.category, 80),
    website: cleanWebsite(input.website),
    email,
    phone: clean(input.phone, 40),
    addressLine1: clean(input.address?.line1, 200),
    addressLine2: clean(input.address?.line2, 200),
    city: clean(input.address?.city, 120),
    region: clean(input.address?.region, 120),
    postcode: clean(input.address?.postcode, 20),
    country: clean(input.address?.country, 80),
    source: clean(input.source, 40),
    interest: clean(input.interest, 80),
    accountEmail: clean(input.accountEmail, 160)?.toLowerCase() ?? null,
    partnerId: clean(input.partnerId, 64),
  };

  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(offered)) {
    if (value === null) continue;
    const current = existing?.[key as keyof MergeTarget];
    if (current === null || current === undefined || current === "") data[key] = value;
  }
  if (input.intake !== undefined && input.intake !== null && (existing?.intake === null || existing?.intake === undefined)) {
    data.intake = input.intake;
  }

  const stage = nextStage(existing?.stage ?? null, input.stage ?? null);
  if (!existing || stage !== existing.stage) data.stage = stage;
  if (!existing) {
    data.name = offered.name ?? email ?? "Unnamed business";
    data.kind = offered.kind && isOrganisationKind(offered.kind) ? offered.kind : "brand";
  } else if (data.kind && !isOrganisationKind(data.kind)) {
    delete data.kind;
  }
  return data as Partial<Omit<MergeTarget, "intake">> & { intake?: Prisma.InputJsonValue };
}

/**
 * Finds the record an intake belongs to: by partner page, then by the managing account, then
 * by website host, then by name (ignoring case).
 */
async function findMatch(input: OrganisationIntake, db: Prisma.TransactionClient | typeof prisma) {
  const partnerId = clean(input.partnerId, 64);
  if (partnerId) {
    const byPartner = await db.organisation.findUnique({ where: { partnerId } });
    if (byPartner) return byPartner;
  }
  const accountEmail = clean(input.accountEmail, 160)?.toLowerCase();
  if (accountEmail) {
    const byAccount = await db.organisation.findFirst({
      where: { accountEmail: { equals: accountEmail, mode: "insensitive" } },
      orderBy: { createdAt: "asc" },
    });
    if (byAccount) return byAccount;
  }
  const host = websiteHost(input.website);
  if (host) {
    const candidates = await db.organisation.findMany({
      where: { website: { contains: host, mode: "insensitive" } },
      orderBy: { createdAt: "asc" },
      take: 20,
    });
    const byHost = candidates.find((o) => websiteHost(o.website) === host);
    if (byHost) return byHost;
  }
  const name = clean(input.name, 160);
  if (name) {
    const byName = await db.organisation.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
      orderBy: { createdAt: "asc" },
    });
    if (byName) return byName;
  }
  return null;
}

/**
 * Creates or updates the Organisation for an application, enquiry, checkout or portal save,
 * makes sure the person who got in touch is its primary contact, and returns it.
 */
export async function upsertOrganisationFromIntake(input: OrganisationIntake): Promise<Organisation> {
  const existing = await findMatch(input, prisma);
  const data = mergeIntake(existing, input);

  // A partner page belongs to one record; if another record already holds it, leave the link alone.
  if (data.partnerId) {
    const holder = await prisma.organisation.findUnique({ where: { partnerId: data.partnerId }, select: { id: true } });
    if (holder && holder.id !== existing?.id) delete data.partnerId;
  }

  const org = existing
    ? Object.keys(data).length
      ? await prisma.organisation.update({ where: { id: existing.id }, data })
      : existing
    : await prisma.organisation.create({ data: { ...data, name: data.name ?? "Unnamed business" } });

  const email = clean(input.email, 160)?.toLowerCase();
  if (email) await ensurePrimaryContact(org.id, { email, name: input.contactName, title: input.contactTitle, phone: input.phone });

  const note = clean(input.note, 4000);
  if (note) {
    await prisma.organisationNote.create({ data: { organisationId: org.id, kind: "note", body: note } });
  }
  return org;
}

/** The contact for this email, filled in where empty; primary when the record has no primary contact yet. */
async function ensurePrimaryContact(
  organisationId: string,
  c: { email: string; name?: string | null; title?: string | null; phone?: string | null }
) {
  const [contact, primary, user] = await Promise.all([
    prisma.organisationContact.findFirst({ where: { organisationId, email: { equals: c.email, mode: "insensitive" } } }),
    prisma.organisationContact.findFirst({ where: { organisationId, isPrimary: true }, select: { id: true } }),
    prisma.user.findUnique({ where: { email: c.email }, select: { id: true } }),
  ]);
  const name = clean(c.name, 120);
  const title = clean(c.title, 120);
  const phone = clean(c.phone, 40);
  if (!contact) {
    await prisma.organisationContact.create({
      data: {
        organisationId,
        email: c.email,
        name: name ?? c.email.split("@")[0],
        title,
        phone,
        userId: user?.id ?? null,
        isPrimary: !primary,
      },
    });
    return;
  }
  const update: Prisma.OrganisationContactUncheckedUpdateInput = {};
  if (name && (!contact.name || contact.name === c.email.split("@")[0] || contact.name === c.email)) update.name = name;
  if (title && !contact.title) update.title = title;
  if (phone && !contact.phone) update.phone = phone;
  if (user && !contact.userId) update.userId = user.id;
  if (!primary) update.isPrimary = true;
  if (Object.keys(update).length) await prisma.organisationContact.update({ where: { id: contact.id }, data: update });
}

/** Links a record to its partner page. False when another record already holds that page. */
export async function linkOrganisationToPartner(orgId: string, partnerId: string) {
  const holder = await prisma.organisation.findUnique({ where: { partnerId }, select: { id: true } });
  if (holder) return holder.id === orgId;
  await prisma.organisation.update({ where: { id: orgId }, data: { partnerId } });
  return true;
}
