import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { site } from "@/config/site";
import { tierById } from "@/config/subscriptions";
import { SYSTEM_USER_EMAIL } from "@/agents/publish";
import { createDraft, draftRefExists } from "@/agents/runtime";
import { appUrl, firstName } from "@/agents/util";
import {
  RETENTION_SEGMENTS,
  SEGMENT_INFO,
  keyDate,
  mayEmail,
  needsAttention,
  nudgeEmail,
  nudgeSummary,
  retentionRef,
  segmentsFor,
  type RetentionSegment,
} from "@/lib/retention";

/** The agent name on retention drafts in the inbox. */
export const RETENTION_AGENT = "retention";

/** Most nudges drafted in one go, so the inbox stays reviewable. */
export const NUDGE_CAP = 50;

const DAY = 24 * 60 * 60 * 1000;

const SELECT = {
  id: true,
  name: true,
  email: true,
  emailUpdates: true,
  createdAt: true,
  onboardedAt: true,
  plan: true,
  compPlan: true,
  compUntil: true,
  stripeCurrentPeriodEnd: true,
  cancelAtPeriodEnd: true,
  lastPaymentFailedAt: true,
  lastSeenAt: true,
} satisfies Prisma.UserSelect;

export type RetentionRow = Prisma.UserGetPayload<{ select: typeof SELECT }> & { segments: RetentionSegment[] };

/**
 * A database pre-filter that is wider than or equal to the rules in segmentsFor,
 * so the rules stay in one tested place. The team and the system account are never listed.
 */
function candidateWhere(now: Date): Prisma.UserWhereInput {
  const t = now.getTime();
  return {
    email: { not: null },
    staffRole: null,
    role: { not: "admin" },
    NOT: { email: SYSTEM_USER_EMAIL },
    OR: [
      { cancelAtPeriodEnd: true },
      { lastPaymentFailedAt: { gt: new Date(t - 14 * DAY) } },
      { stripeCurrentPeriodEnd: { gt: new Date(t - 30 * DAY), lte: new Date(t + 14 * DAY) } },
      { onboardedAt: null, createdAt: { lte: new Date(t - 3 * DAY) } },
      {
        plan: { not: null },
        stripeCurrentPeriodEnd: { gt: now },
        OR: [{ lastSeenAt: { lt: new Date(t - 21 * DAY) } }, { lastSeenAt: null, createdAt: { lte: new Date(t - 21 * DAY) } }],
      },
    ],
  };
}

/** Everyone in at least one retention segment, with the segments they are in. */
export async function loadRetention(now = new Date()) {
  const users = await prisma.user.findMany({
    where: candidateWhere(now),
    select: SELECT,
    orderBy: { createdAt: "desc" },
    take: 5000,
  });
  const rows: RetentionRow[] = users.map((u) => ({ ...u, segments: segmentsFor(u, now) })).filter((u) => u.segments.length > 0);
  const counts = Object.fromEntries(RETENTION_SEGMENTS.map((s) => [s, rows.filter((r) => r.segments.includes(s)).length])) as Record<
    RetentionSegment,
    number
  >;
  return { rows, counts };
}

/** For the overview: members in any segment except routine renewals. */
export async function countNeedingAttention(now = new Date()) {
  try {
    const users = await prisma.user.findMany({ where: candidateWhere(now), select: SELECT, take: 5000 });
    return users.filter((u) => needsAttention(u, now)).length;
  } catch (error) {
    console.error("[RETENTION_COUNT]", error);
    return 0;
  }
}

function longDate(d: Date | null) {
  return d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" }) : null;
}

export type NudgeOutcome = { created: number; existing: number; optedOut: number; notInSegment: number };

/**
 * Draft retention emails for the inbox. Nothing is sent until someone approves
 * each one. One per member, per segment, per month; optional emails skip
 * members who have opted out of updates.
 */
export async function draftRetentionNudges(segment: RetentionSegment, userIds: string[], now = new Date()): Promise<NudgeOutcome> {
  const ids = [...new Set(userIds)].slice(0, NUDGE_CAP);
  const users = await prisma.user.findMany({ where: { ...candidateWhere(now), id: { in: ids } }, select: SELECT });
  const outcome: NudgeOutcome = { created: 0, existing: 0, optedOut: 0, notInSegment: ids.length - users.length };

  for (const u of users) {
    if (!u.email || !segmentsFor(u, now).includes(segment)) {
      outcome.notInSegment++;
      continue;
    }
    if (!mayEmail(segment, u.emailUpdates)) {
      outcome.optedOut++;
      continue;
    }
    const ref = retentionRef(segment, u.id, now);
    // The membership agent's own onboarding nudge counts too, so nobody gets two.
    if ((await draftRefExists(ref)) || (segment === "not_onboarded" && (await draftRefExists(`onboarding-nudge:${u.id}`)))) {
      outcome.existing++;
      continue;
    }
    const plan = tierById(u.plan ?? u.compPlan)?.name ?? null;
    const email = nudgeEmail(segment, {
      firstName: firstName(u.name),
      planName: plan,
      date: longDate(keyDate(segment, u)),
      links: {
        members: appUrl("/members"),
        billing: appUrl("/members/billing"),
        pricing: appUrl("/pricing"),
        onboarding: appUrl("/members/onboarding"),
      },
      signOff: `${site.founder}, Trichollective`,
    });
    const created = await createDraft({
      agent: RETENTION_AGENT,
      runId: null,
      agentRisk: "high",
      kind: "email",
      title: email.subject,
      summary: `${SEGMENT_INFO[segment].label}: ${nudgeSummary(segment, u.name ?? u.email)}`,
      body: email.body,
      payload: { to: u.email, subject: email.subject, userId: u.id, segment },
      ref,
    });
    if (created) outcome.created++;
    else outcome.existing++;
  }
  return outcome;
}
