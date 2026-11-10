import type { EducatorStatus } from "@prisma/client";

/** Educator rules with no database, so they can be tested on their own. */

/** A renewal can take a moment to process, so access lasts a day past the period end. */
const GRACE_MS = 24 * 60 * 60 * 1000;

type Educator = { status: EducatorStatus; currentPeriodEnd: Date | null };

/** Paid up: their membership period hasn't ended. */
export function isPaidUp(e: Educator, now = new Date()) {
  return !!e.currentPeriodEnd && e.currentPeriodEnd.getTime() + GRACE_MS > now.getTime();
}

/** Has the member benefits of an Educator: paid up, and not rejected or suspended. */
export function hasEducatorAccess(e: Educator | null | undefined, now = new Date()) {
  return !!e && (e.status === "pending_review" || e.status === "approved") && isPaidUp(e, now);
}

/** Why they can't send a course for review, or null when they can. */
export function submitCoursesBlocker(e: Educator | null | undefined, now = new Date()): string | null {
  if (!e) return "Only Educator members can send courses for review.";
  if (e.status === "pending_review") return "You can send courses for review once the team has approved your Educator membership.";
  if (e.status === "rejected") return "Your Educator application wasn't approved.";
  if (e.status === "suspended") return "Your Educator membership is suspended. Please contact the team.";
  if (e.status === "lapsed" || !isPaidUp(e, now)) return "Your Educator membership has ended. Renew it to send courses for review.";
  return null;
}

/** The educator's share of a course sale, in percent: the course's own rate, else theirs, else the default. */
export function sharePctFor(course: { sharePct: number | null }, educator: { sharePct: number } | null, fallback = 70) {
  const pct = course.sharePct ?? educator?.sharePct ?? fallback;
  return Math.min(100, Math.max(0, Math.round(pct)));
}

/** A tidy web address for an educator's public page. */
export function educatorSlugBase(name: string) {
  return (
    name
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "educator"
  );
}

/**
 * An educator's courses can be sold only while they're approved, paid up and
 * able to receive their share. Otherwise the course is shown as not taking
 * enrolments, and nobody is charged for a share we couldn't pay.
 */
export function educatorCanSell(
  e: (Educator & { stripeAccountId: string | null; transfersActive: boolean }) | null | undefined,
  now = new Date()
) {
  return !!e && e.status === "approved" && isPaidUp(e, now) && !!e.stripeAccountId && e.transfersActive;
}
