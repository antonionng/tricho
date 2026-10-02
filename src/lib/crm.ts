import type { OrgStage, Prisma } from "@prisma/client";
import { csvRow } from "@/lib/csv";

/**
 * Pure helpers for the business CRM in Studio. No database access here, so
 * the rules can be tested on their own.
 */

export const ORG_STAGES = ["lead", "contacted", "proposal", "won", "customer", "lost", "churned"] as const satisfies readonly OrgStage[];
export type OrgStageId = (typeof ORG_STAGES)[number];

/** Stages where a deal is still being worked on. Their values make up the open pipeline. */
export const OPEN_STAGES: readonly OrgStageId[] = ["lead", "contacted", "proposal"];

export const STAGE_LABEL: Record<OrgStageId, { label: string; description: string }> = {
  lead: { label: "Lead", description: "A lead is a business we have heard from or found, but have not spoken to yet." },
  contacted: { label: "Contacted", description: "Contacted means someone on the team has been in touch and a conversation has started." },
  proposal: { label: "Proposal", description: "Proposal means we have sent them a price or a plan and are waiting for their answer." },
  won: { label: "Won", description: "Won means they have said yes, and their page or plan is being set up." },
  customer: { label: "Customer", description: "A customer is live on the platform and paying for a plan or a partner page." },
  lost: { label: "Lost", description: "Lost means they decided not to go ahead, so they stay on record for a later conversation." },
  churned: { label: "Churned", description: "Churned means they were a customer and have since cancelled." },
};

export function isStage(value: unknown): value is OrgStageId {
  return typeof value === "string" && (ORG_STAGES as readonly string[]).includes(value);
}

export const ORG_KINDS = ["brand", "clinic", "salon", "supplier", "education", "other"] as const;
export type OrgKind = (typeof ORG_KINDS)[number];
export const KIND_LABEL: Record<OrgKind, string> = {
  brand: "Brand",
  clinic: "Clinic",
  salon: "Salon",
  supplier: "Supplier",
  education: "Education",
  other: "Other",
};
export function kindLabel(kind: string) {
  return KIND_LABEL[kind as OrgKind] ?? kind;
}

export const ORG_SIZES = ["1", "2-10", "11-50", "51-200", "200+"] as const;

export const NOTE_KINDS = ["note", "call", "email", "meeting"] as const;
export type NoteKind = (typeof NOTE_KINDS)[number];
export const NOTE_KIND_LABEL: Record<NoteKind, string> = { note: "Note", call: "Call", email: "Email", meeting: "Meeting" };

export const SOCIAL_KEYS = ["instagram", "tiktok", "linkedin", "facebook", "youtube"] as const;
export type SocialKey = (typeof SOCIAL_KEYS)[number];
export const SOCIAL_LABEL: Record<SocialKey, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  youtube: "YouTube",
};

/** Read a socials JSON value safely, keeping only known keys with text values. */
export function readSocials(value: unknown): Partial<Record<SocialKey, string>> {
  const out: Partial<Record<SocialKey, string>> = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return out;
  for (const key of SOCIAL_KEYS) {
    const v = (value as Record<string, unknown>)[key];
    if (typeof v === "string" && v.trim()) out[key] = v.trim().slice(0, 300);
  }
  return out;
}

/** "Scalp care, Devices, scalp care" -> ["scalp care", "devices"]. Lower case, de-duplicated, at most 20. */
export function parseTags(input: string | null | undefined): string[] {
  if (!input) return [];
  const seen = new Set<string>();
  for (const raw of input.split(/[,\n]/)) {
    const tag = raw.trim().replace(/\s+/g, " ").toLowerCase().slice(0, 40);
    if (tag) seen.add(tag);
    if (seen.size >= 20) break;
  }
  return [...seen];
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Only http(s) links are stored, so nothing else can reach an href. */
export function cleanUrl(value: string | null | undefined) {
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** "£12,500" or "12500" -> 12500. Empty -> null. Anything else -> undefined (invalid). */
export function parseGBP(value: string | null | undefined): number | null | undefined {
  const v = (value ?? "").replace(/[£,\s]/g, "");
  if (!v) return null;
  if (!/^\d{1,9}$/.test(v)) return undefined;
  return Number(v);
}

/** "2026-10-14" -> a Date at midday UK time. Empty -> null. Anything else -> undefined (invalid). */
export function parseDay(value: string | null | undefined): Date | null | undefined {
  const v = (value ?? "").trim();
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
  const d = new Date(`${v}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function formatGBP(value: number | null | undefined) {
  if (value === null || value === undefined) return "";
  return `£${value.toLocaleString("en-GB")}`;
}

/** "Ada Lovelace" -> "AL", "ada@example.com" -> "A". */
export function initials(name: string | null | undefined) {
  const clean = (name ?? "").replace(/@.*$/, "").trim();
  if (!clean) return "?";
  const parts = clean.split(/[\s._-]+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

// ---------- Filters ----------

export type CrmView = "table" | "board";

export type CrmFilters = {
  q: string;
  stage: OrgStageId | "open" | "";
  kind: OrgKind | "";
  tag: string;
  /** A team member's user id, or "none" for businesses nobody looks after yet. */
  owner: string;
  due: boolean;
  view: CrmView;
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v ?? "").trim();

/** Read filters from search params, ignoring anything we don't recognise. */
export function parseCrmFilters(sp: Record<string, string | string[] | undefined>): CrmFilters {
  const stage = one(sp.stage);
  const kind = one(sp.kind);
  const owner = one(sp.owner);
  return {
    q: one(sp.q).slice(0, 120),
    stage: isStage(stage) || stage === "open" ? (stage as CrmFilters["stage"]) : "",
    kind: (ORG_KINDS as readonly string[]).includes(kind) ? (kind as OrgKind) : "",
    tag: parseTags(one(sp.tag))[0] ?? "",
    owner: /^[a-z0-9_-]{1,64}$/i.test(owner) ? owner : "",
    due: one(sp.due) === "1",
    view: one(sp.view) === "board" ? "board" : "table",
  };
}

/** The same filters as a query string, for links that keep them. */
export function crmFilterQuery(f: Partial<CrmFilters>, extra: Record<string, string> = {}) {
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  if (f.stage) params.set("stage", f.stage);
  if (f.kind) params.set("kind", f.kind);
  if (f.tag) params.set("tag", f.tag);
  if (f.owner) params.set("owner", f.owner);
  if (f.due) params.set("due", "1");
  if (f.view === "board") params.set("view", "board");
  for (const [k, v] of Object.entries(extra)) {
    if (v) params.set(k, v);
    else params.delete(k);
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

/** Turn CRM filters into a Prisma query. */
export function buildOrgWhere(f: Partial<CrmFilters>, now = new Date()): Prisma.OrganisationWhereInput {
  const and: Prisma.OrganisationWhereInput[] = [];
  if (f.q) {
    const contains = { contains: f.q, mode: "insensitive" as const };
    and.push({
      OR: [
        { name: contains },
        { email: contains },
        { website: contains },
        { accountEmail: contains },
        { contacts: { some: { OR: [{ email: contains }, { name: contains }] } } },
      ],
    });
  }
  if (f.stage === "open") and.push({ stage: { in: [...OPEN_STAGES] } });
  else if (f.stage) and.push({ stage: f.stage });
  if (f.kind) and.push({ kind: f.kind });
  if (f.tag) and.push({ tags: { has: f.tag } });
  if (f.owner === "none") and.push({ ownerStaffId: null });
  else if (f.owner) and.push({ ownerStaffId: f.owner });
  if (f.due) and.push({ followUpAt: { lte: now } });
  return and.length ? { AND: and } : {};
}

// ---------- Pipeline ----------

export type StageTotal = { count: number; value: number };

export function pipelineTotals(rows: { stage: string; valueGBP: number | null }[]) {
  const byStage = Object.fromEntries(ORG_STAGES.map((s) => [s, { count: 0, value: 0 }])) as Record<OrgStageId, StageTotal>;
  for (const r of rows) {
    if (!isStage(r.stage)) continue;
    byStage[r.stage].count++;
    byStage[r.stage].value += r.valueGBP ?? 0;
  }
  const open = OPEN_STAGES.reduce((acc, s) => ({ count: acc.count + byStage[s].count, value: acc.value + byStage[s].value }), {
    count: 0,
    value: 0,
  });
  return { byStage, open, total: rows.length };
}

/** A follow-up date that has arrived or passed. */
export function isFollowUpDue(followUpAt: Date | null | undefined, now = new Date()) {
  return !!followUpAt && followUpAt <= now;
}

// ---------- Timeline ----------

export type TimelineItem =
  | { type: "note"; id: string; at: Date; kind: string; body: string; author: string | null }
  | { type: "audit"; id: string; at: Date; action: string; summary: string | null; actor: string }
  | { type: "intake"; id: string; at: Date; source: string | null; fields: [string, string][] };

/** Turn an intake JSON value into readable label/value pairs, skipping empty and nested values. */
export function intakeFields(intake: unknown): [string, string][] {
  if (!intake || typeof intake !== "object" || Array.isArray(intake)) return [];
  const out: [string, string][] = [];
  for (const [key, value] of Object.entries(intake as Record<string, unknown>)) {
    if (value === null || value === undefined || value === "") continue;
    let text: string;
    if (typeof value === "string") text = value;
    else if (typeof value === "number") text = String(value);
    else if (typeof value === "boolean") text = value ? "Yes" : "No";
    else if (Array.isArray(value) && value.every((v) => typeof v === "string")) text = value.join(", ");
    else continue;
    const label = key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .toLowerCase()
      .replace(/^./, (c) => c.toUpperCase());
    out.push([label, text.slice(0, 2000)]);
  }
  return out;
}

/** Notes, team changes and the original application, newest first. */
export function mergeTimeline(input: {
  notes: { id: string; createdAt: Date; kind: string; body: string; author?: string | null }[];
  audits: { id: string; createdAt: Date; action: string; summary: string | null; actorEmail: string }[];
  intake?: { at: Date; source: string | null; value: unknown } | null;
}): TimelineItem[] {
  const items: TimelineItem[] = [
    ...input.notes.map((n) => ({ type: "note" as const, id: n.id, at: n.createdAt, kind: n.kind, body: n.body, author: n.author ?? null })),
    // Notes are already shown in full, so their audit rows would only repeat them.
    ...input.audits
      .filter((a) => a.action !== "organisation.note")
      .map((a) => ({ type: "audit" as const, id: a.id, at: a.createdAt, action: a.action, summary: a.summary, actor: a.actorEmail })),
  ];
  if (input.intake) {
    const fields = intakeFields(input.intake.value);
    if (fields.length) items.push({ type: "intake", id: "intake", at: input.intake.at, source: input.intake.source, fields });
  }
  return items.sort((a, b) => b.at.getTime() - a.at.getTime() || (a.type === "intake" ? 1 : b.type === "intake" ? -1 : 0));
}

/** What changed between two plain records, for audit before/after. */
export function changedFields<T extends Record<string, unknown>>(before: T, after: Partial<T>) {
  const b: Partial<T> = {};
  const a: Partial<T> = {};
  for (const key of Object.keys(after) as (keyof T)[]) {
    if (JSON.stringify(before[key] ?? null) !== JSON.stringify(after[key] ?? null)) {
      b[key] = before[key];
      a[key] = after[key];
    }
  }
  return { before: b, after: a, changed: Object.keys(a) as (keyof T)[] };
}

const FIELD_LABEL: Record<string, string> = {
  name: "name",
  kind: "kind",
  category: "category",
  website: "website",
  email: "email",
  phone: "phone",
  addressLine1: "address",
  addressLine2: "address",
  city: "town",
  region: "region",
  postcode: "postcode",
  country: "country",
  companyNumber: "company number",
  vatNumber: "VAT number",
  size: "team size",
  description: "description",
  logoFileId: "logo",
  socials: "social links",
  accountEmail: "account email",
  valueGBP: "value",
  followUpAt: "follow-up date",
  interest: "interest",
};

/** Changed fields as a readable list, e.g. "logo, website and VAT number". */
export function describeChanges(fields: readonly (string | number | symbol)[]) {
  const names = [...new Set(fields.map((f) => FIELD_LABEL[String(f)] ?? String(f).replace(/([A-Z])/g, " $1").toLowerCase()))];
  if (names.length <= 1) return names[0] ?? "nothing";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

// ---------- Export ----------

export const ORG_CSV_HEADER = [
  "name",
  "kind",
  "stage",
  "interest",
  "value_gbp",
  "follow_up",
  "owner",
  "tags",
  "email",
  "phone",
  "website",
  "city",
  "country",
  "account_email",
  "primary_contact",
  "primary_contact_email",
  "source",
  "created",
];

export type OrgCsvSource = {
  name: string;
  kind: string;
  stage: string;
  interest: string | null;
  valueGBP: number | null;
  followUpAt: Date | null;
  owner: string | null;
  tags: string[];
  email: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  country: string | null;
  accountEmail: string | null;
  primaryName: string | null;
  primaryEmail: string | null;
  source: string | null;
  createdAt: Date;
};

const isoDay = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");

export function organisationsCsv(rows: OrgCsvSource[]) {
  const lines = rows.map((r) =>
    csvRow([
      r.name,
      r.kind,
      r.stage,
      r.interest,
      r.valueGBP,
      isoDay(r.followUpAt),
      r.owner,
      r.tags.join("; "),
      r.email,
      r.phone,
      r.website,
      r.city,
      r.country,
      r.accountEmail,
      r.primaryName,
      r.primaryEmail,
      r.source,
      isoDay(r.createdAt),
    ])
  );
  return `${[ORG_CSV_HEADER.join(","), ...lines].join("\n")}\n`;
}
