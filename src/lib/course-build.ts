import type Stripe from "stripe";
import type { CourseBuildTier, CourseQuoteStatus, CourseRequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { alertOwners, deliverOnce } from "@/lib/mail/send";
import { courseBuildPaidAlert, courseBuildPaidEmail } from "@/lib/mail/templates/educators";
import { buildTierById, courseBuild } from "@/config/course-build";

/**
 * The course-build service: the team quotes for building a course with an
 * educator in Studio, the educator accepts and pays by one-off Stripe
 * Checkout, and only then does the request move to Building (unless the team
 * waives the fee). Stripe events for build fees arrive through
 * handleEducatorWebhook.
 */

export const COURSE_BUILD_KIND = "course_build";

/** Quotes must be between £1 and £50,000, so a typo can't ask for a fortune. */
export const MAX_QUOTE_PENCE = 5_000_000;

type Quoted = { quoteStatus: CourseQuoteStatus; quoteAmount: number | null };

/** The fee is settled: paid, or waived by the team. Work can start. */
export function buildFeeSettled(r: Pick<Quoted, "quoteStatus">) {
  return r.quoteStatus === "paid" || r.quoteStatus === "waived";
}

/** Why a request can't move to this status yet, or null when it can. */
export function statusBlocker(r: Pick<Quoted, "quoteStatus">, next: CourseRequestStatus): string | null {
  if (next === "building" && !buildFeeSettled(r)) {
    return "A request moves to Building once the educator has paid the quote, or the team has waived the fee.";
  }
  return null;
}

/** The educator can accept and pay this quote now. */
export function canPayQuote(r: Quoted) {
  return r.quoteStatus === "sent" && (r.quoteAmount ?? 0) > 0;
}

/** "£1,450", "1450.50" or "1450" to whole pence, or null when it isn't a sensible amount. */
export function poundsToPence(input: string) {
  const cleaned = input.replace(/[£,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const pence = Math.round(Number(cleaned) * 100);
  return pence >= 100 && pence <= MAX_QUOTE_PENCE ? pence : null;
}

export type QuoteInput = { tier: string; amount: string; sharePct: string; note: string };
export type ParsedQuote = { tier: CourseBuildTier; amountPence: number; sharePct: number | null; note: string | null };

/** Checks a quote typed in Studio. */
export function parseQuote(input: QuoteInput): { ok: true; quote: ParsedQuote } | { ok: false; error: string } {
  const tier = buildTierById(input.tier);
  if (!tier) return { ok: false, error: "Please choose the service: Tailor, Build or Build + film." };
  const amountPence = poundsToPence(input.amount);
  if (amountPence === null) return { ok: false, error: "Please give the fee in pounds, including VAT, between £1 and £50,000." };
  let sharePct: number | null = null;
  if (input.sharePct.trim()) {
    const n = Number(input.sharePct.trim().replace("%", ""));
    if (!Number.isInteger(n) || n < 0 || n > 100) return { ok: false, error: "Please give the educator's share as a whole number from 0 to 100, or leave it empty." };
    sharePct = n;
  }
  const note = input.note.trim().slice(0, 4000) || null;
  return { ok: true, quote: { tier: tier.id, amountPence, sharePct, note } };
}

/** The share an educator keeps on a course this request builds: the request's own, the tier's default, then their rate. */
export function requestSharePct(r: { sharePct: number | null; tier: string | null }, educatorSharePct: number) {
  return r.sharePct ?? buildTierById(r.tier)?.defaultSharePct ?? educatorSharePct;
}

export function buildCheckoutMetadata(requestId: string, userId: string) {
  return { kind: COURSE_BUILD_KIND, requestId, userId };
}

/** What the educator sees on their card statement and the Stripe receipt. */
export function buildLineItemName(tierId: string | null, title: string) {
  const tier = buildTierById(tierId);
  return `${courseBuild.name}${tier ? `: ${tier.name}` : ""} for "${title}"`.slice(0, 250);
}

async function claimOnce(ref: string) {
  try {
    await prisma.emailLog.create({ data: { ref } });
    return true;
  } catch {
    return false;
  }
}

function refresh() {
  try {
    revalidatePath("/members/educator");
    revalidatePath("/studio/educators/requests");
  } catch {
    // Outside a request.
  }
}

function paymentIntentOf(session: Stripe.Checkout.Session) {
  const pi = session.payment_intent;
  return typeof pi === "string" ? pi : (pi?.id ?? null);
}

/** A build fee has been paid. Safe to run more than once for the same session. */
async function onBuildPaid(session: Stripe.Checkout.Session) {
  const requestId = session.metadata?.requestId;
  const request = requestId
    ? await prisma.courseRequest.findUnique({
        where: { id: requestId },
        include: { educator: { select: { displayName: true, userId: true, user: { select: { name: true, email: true } } } } },
      })
    : null;
  if (!request) {
    console.error("[COURSE_BUILD] payment for an unknown request", { requestId, session: session.id });
    return;
  }
  const paymentIntentId = paymentIntentOf(session);
  const amountPence = session.amount_total ?? request.quoteAmount ?? 0;
  const tierName = buildTierById(request.tier)?.name ?? courseBuild.name;

  // Only the first delivery changes anything; Stripe may send the same event again.
  const first = await prisma.courseRequest.updateMany({
    where: { id: request.id, paidAt: null },
    data: { quoteStatus: "paid", paidAt: new Date(), stripeCheckoutSessionId: session.id, stripePaymentIntentId: paymentIntentId },
  });
  if (first.count === 0) {
    if (request.stripePaymentIntentId && paymentIntentId && request.stripePaymentIntentId !== paymentIntentId && (await claimOnce(`course-build-double:${session.id}`))) {
      await alertOwners({
        subject: `Course build paid twice: ${request.title}`,
        heading: `${request.educator.displayName} has paid twice for "${request.title}".`,
        body: "Refund the second payment in Stripe. The request already records the first one.",
        facts: [
          ["First payment", request.stripePaymentIntentId],
          ["Second payment", paymentIntentId],
        ],
        cta: { label: "Open the request in Studio", href: `/studio/educators/requests#r-${request.id}` },
      });
    }
    return;
  }
  if (request.quoteAmount !== null && session.amount_total !== null && session.amount_total !== request.quoteAmount) {
    console.warn("[COURSE_BUILD] paid amount differs from the quote", { requestId: request.id, quoted: request.quoteAmount, paid: session.amount_total });
  }
  await prisma.courseRequest.updateMany({ where: { id: request.id, status: { in: ["new", "scoping"] } }, data: { status: "building" } });

  const email = request.educator.user.email;
  if (email) {
    const paid = courseBuildPaidEmail({ name: request.educator.user.name, title: request.title, tierName, amountPence });
    await deliverOnce(`course-build-paid:${session.id}`, email, paid.subject, paid.content, { tag: "course-build" });
  }
  if (await claimOnce(`course-build-paid-alert:${session.id}`)) {
    await prisma.notification.create({
      data: { userId: request.educator.userId, kind: "course", title: `Your payment for "${request.title}" has gone through, and the team has started work.`, href: "/members/educator#tailored" },
    });
    await alertOwners(courseBuildPaidAlert({ educatorName: request.educator.displayName, email, title: request.title, tierName, amountPence, requestId: request.id }));
  }
  refresh();
}

/**
 * Stripe events for course-build fees. Returns true when the event was a
 * build fee and has been handled, so no other handler sees it.
 */
export async function handleCourseBuildWebhook(event: Stripe.Event): Promise<boolean> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "payment" || session.metadata?.kind !== COURSE_BUILD_KIND) return false;
      // A delayed payment method completes later, with checkout.session.async_payment_succeeded.
      if (session.payment_status === "paid") await onBuildPaid(session);
      return true;
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.kind !== COURSE_BUILD_KIND) return false;
      await prisma.courseRequest.updateMany({ where: { stripeCheckoutSessionId: session.id, paidAt: null }, data: { stripeCheckoutSessionId: null } });
      return true;
    }
    default:
      return false;
  }
}
