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

export type MemberFilters = { q: string; plan: MemberPlanFilter; status: MemberStatusFilter };

/** Read filters from search params, ignoring anything we don't recognise. */
export function parseMemberFilters(sp: Record<string, string | string[] | undefined>): MemberFilters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v ?? "").trim();
  const plan = one(sp.plan);
  const status = one(sp.status);
  return {
    q: one(sp.q).slice(0, 120),
    plan: (MEMBER_PLANS as readonly string[]).includes(plan) || plan === "none" ? (plan as MemberPlanFilter) : "",
    status: (MEMBER_STATUSES as readonly string[]).includes(status) ? (status as MemberStatusFilter) : "",
  };
}

/** The same filters as a query string, for links that keep them (paging, export). */
export function memberFilterQuery(f: Partial<MemberFilters>, extra: Record<string, string> = {}) {
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  if (f.plan) params.set("plan", f.plan);
  if (f.status) params.set("status", f.status);
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
