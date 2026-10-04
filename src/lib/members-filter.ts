import type { Prisma } from "@prisma/client";
import { csvRow } from "@/lib/csv";

/**
 * Pure helpers for finding and exporting members in Studio. No database
 * access here, so the rules can be tested on their own.
 */

export const MEMBER_PLANS = ["community", "professional", "business"] as const;
export type MemberPlanFilter = (typeof MEMBER_PLANS)[number] | "none" | "";

export const MEMBER_STATUSES = ["active", "lapsed", "suspended", "banned", "staff"] as const;
export type MemberStatusFilter = (typeof MEMBER_STATUSES)[number] | "";

export type MemberFilters = {
  q: string;
  plan: MemberPlanFilter;
  status: MemberStatusFilter;
  /** A CRM tag, lower case. Left out when not filtering. */
  tag?: string;
  /** The team member who looks after them, or "none". Left out when not filtering. */
  owner?: string;
  /** "today" lists only people whose account was created today (Irish and UK time). */
  joined?: "today";
};

/**
 * Sign-up sources that mean the same thing. The Trichollective Ireland
 * launch QR codes were first printed as ?src=dublin, so both count as one source.
 */
const SOURCE_ALIASES: Record<string, string> = { dublin: "ireland", ireland: "ireland" };
const SOURCE_LABELS: Record<string, string> = {
  ireland: "Trichollective Ireland",
  direct: "Direct",
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  email: "Email",
  newsletter: "Newsletter",
  google: "Google",
};

/** One key per source, so "dublin" and "ireland" are counted together. Empty means direct. */
export function sourceKey(source: string | null | undefined): string {
  const s = (source ?? "").trim().toLowerCase();
  if (!s) return "direct";
  return SOURCE_ALIASES[s] ?? s;
}

/** How a source reads in Studio. */
export function sourceLabel(source: string | null | undefined): string {
  const key = sourceKey(source);
  return SOURCE_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1).replace(/[-_]+/g, " ");
}

/** Whether a source is the Trichollective Ireland launch event. */
export function isIrelandSource(source: string | null | undefined) {
  return sourceKey(source) === "ireland";
}

/** Midnight at the start of today in Ireland and the UK (they share a clock), as an instant. */
export function startOfToday(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Dublin",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const sinceMidnight = ((n("hour") * 60 + n("minute")) * 60 + n("second")) * 1000 + now.getMilliseconds();
  return new Date(now.getTime() - sinceMidnight);
}

/** Read filters from search params, ignoring anything we don't recognise. */
export function parseMemberFilters(sp: Record<string, string | string[] | undefined>): MemberFilters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v ?? "").trim();
  const plan = one(sp.plan);
  const status = one(sp.status);
  const tag = one(sp.tag).toLowerCase().replace(/\s+/g, " ").slice(0, 40);
  const owner = one(sp.owner);
  const joined = one(sp.joined);
  return {
    q: one(sp.q).slice(0, 120),
    plan: (MEMBER_PLANS as readonly string[]).includes(plan) || plan === "none" ? (plan as MemberPlanFilter) : "",
    status: (MEMBER_STATUSES as readonly string[]).includes(status) ? (status as MemberStatusFilter) : "",
    tag: tag || undefined,
    owner: /^[a-z0-9_-]{1,64}$/i.test(owner) ? owner : undefined,
    joined: joined === "today" ? "today" : undefined,
  };
}

/** The same filters as a query string, for links that keep them (paging, export). */
export function memberFilterQuery(f: Partial<MemberFilters>, extra: Record<string, string> = {}) {
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  if (f.plan) params.set("plan", f.plan);
  if (f.status) params.set("status", f.status);
  if (f.tag) params.set("tag", f.tag);
  if (f.owner) params.set("owner", f.owner);
  if (f.joined) params.set("joined", f.joined);
  for (const [k, v] of Object.entries(extra)) if (v) params.set(k, v);
  const s = params.toString();
  return s ? `?${s}` : "";
}

/** Someone whose complimentary plan is still running. */
function compActive(now: Date): Prisma.UserWhereInput {
  return { compPlan: { not: null }, OR: [{ compUntil: null }, { compUntil: { gt: now } }] };
}

/** Turn Studio filters into a Prisma query. The system account that posts for the team is never listed. */
export function buildMemberWhere(f: MemberFilters, now: Date, systemEmail: string): Prisma.UserWhereInput {
  const and: Prisma.UserWhereInput[] = [{ NOT: { email: systemEmail } }];

  if (f.q) {
    and.push({
      OR: [
        { name: { contains: f.q, mode: "insensitive" } },
        { email: { contains: f.q, mode: "insensitive" } },
        { profile: { location: { contains: f.q, mode: "insensitive" } } },
      ],
    });
  }

  if (f.plan === "none") and.push({ plan: null, compPlan: null });
  else if (f.plan) and.push({ OR: [{ plan: f.plan }, { compPlan: f.plan }] });

  if (f.tag) and.push({ tags: { has: f.tag } });
  if (f.owner === "none") and.push({ crmOwnerId: null });
  else if (f.owner) and.push({ crmOwnerId: f.owner });
  if (f.joined === "today") and.push({ createdAt: { gte: startOfToday(now) } });

  switch (f.status) {
    case "active":
      and.push({ accessStatus: "active", OR: [{ stripeCurrentPeriodEnd: { gt: now } }, compActive(now)] });
      break;
    case "lapsed":
      and.push({
        plan: { not: null },
        OR: [{ stripeCurrentPeriodEnd: null }, { stripeCurrentPeriodEnd: { lte: now } }],
        NOT: compActive(now),
      });
      break;
    case "suspended":
      and.push({ accessStatus: "suspended", OR: [{ accessUntil: null }, { accessUntil: { gt: now } }] });
      break;
    case "banned":
      and.push({ accessStatus: "banned" });
      break;
    case "staff":
      and.push({ staffRole: { not: null } });
      break;
  }

  return { AND: and };
}

export type AccessState = "active" | "suspended" | "banned" | "muted";

/** What someone can do right now. Suspensions and mutes end on their own once the date passes. */
export function accessState(
  u: { accessStatus: string; accessUntil?: Date | null; mutedUntil?: Date | null },
  now = new Date()
): AccessState {
  if (u.accessStatus === "banned") return "banned";
  if (u.accessStatus === "suspended" && (!u.accessUntil || u.accessUntil > now)) return "suspended";
  if (u.mutedUntil && u.mutedUntil > now) return "muted";
  return "active";
}

export const ACCESS_LABEL: Record<AccessState, string> = {
  active: "Active",
  suspended: "Suspended",
  banned: "Banned",
  muted: "Muted",
};

export type MemberCsvSource = {
  name: string | null;
  email: string | null;
  plan: string | null;
  compPlan: string | null;
  compUntil?: Date | null;
  stripeCurrentPeriodEnd: Date | null;
  isFounding: boolean;
  role: string;
  staffRole: string | null;
  accessStatus: string;
  accessUntil?: Date | null;
  mutedUntil?: Date | null;
  createdAt: Date;
  signupSource: string | null;
};

export const MEMBER_CSV_HEADER = [
  "name",
  "email",
  "plan",
  "comp_plan",
  "active_until",
  "founding",
  "role",
  "staff_role",
  "access",
  "joined",
  "source",
];

const isoDay = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");

export function memberCsvRow(u: MemberCsvSource, now = new Date()) {
  return csvRow([
    u.name,
    u.email,
    u.plan,
    u.compPlan,
    isoDay(u.stripeCurrentPeriodEnd),
    u.isFounding ? "yes" : "no",
    u.role,
    u.staffRole,
    accessState(u, now),
    isoDay(u.createdAt),
    u.signupSource,
  ]);
}

export function membersCsv(rows: MemberCsvSource[], now = new Date()) {
  return `${[MEMBER_CSV_HEADER.join(","), ...rows.map((r) => memberCsvRow(r, now))].join("\n")}\n`;
}

/** Durations offered when suspending or muting, in days. Zero means until the team lifts it. */
export function untilFromDays(days: number, now = new Date()): Date | null {
  if (!Number.isFinite(days) || days <= 0) return null;
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}
