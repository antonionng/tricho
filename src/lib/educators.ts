import type Stripe from "stripe";
import type { EducatorStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { alertOwners, deliver, deliverOnce } from "@/lib/mail/send";
import { educatorDecisionEmail, educatorWelcomeEmail } from "@/lib/mail/templates/educators";
import { educatorMembership } from "@/config/subscriptions";
import { educatorSlugBase } from "@/lib/educator-rules";

/**
 * Educator membership: a yearly subscription, separate from the member plans,
 * for practitioners who write and sell courses. Educators pay first and the
 * team approves them afterwards. Every Stripe event for an Educator
 * subscription is handled here and never reaches the membership logic, so it
 * can't change or end someone's member plan.
 */

export const EDUCATOR_KIND = "educator";

export function educatorCheckoutMetadata(userId: string, termsVersion: string) {
  return { kind: EDUCATOR_KIND, userId, termsVersion };
}

function periodEnd(subscription: Stripe.Subscription): Date | null {
  const item = subscription.items?.data?.[0] as (Stripe.SubscriptionItem & { current_period_end?: number }) | undefined;
  const ts = item?.current_period_end ?? (subscription as unknown as { current_period_end?: number }).current_period_end;
  return ts ? new Date(ts * 1000) : null;
}

async function claimOnce(ref: string) {
  try {
    await prisma.emailLog.create({ data: { ref } });
    return true;
  } catch {
    return false;
  }
}

async function uniqueSlug(name: string) {
  const base = educatorSlugBase(name);
  const taken = new Set((await prisma.educatorProfile.findMany({ where: { slug: { startsWith: base } }, select: { slug: true } })).map((e) => e.slug));
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
}

function refresh() {
  try {
    revalidatePath("/members/educator", "layout");
    revalidatePath("/studio/educators");
    revalidatePath("/educators", "layout");
  } catch {
    // Outside a request.
  }
}

/** checkout.session.completed for the Educator membership. Safe to run more than once. */
async function onEducatorCheckout(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId || !session.subscription) {
    console.error("[EDUCATORS] checkout without a user or subscription", { session: session.id });
    return;
  }
  const [user, subscription] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } }),
    stripe.subscriptions.retrieve(session.subscription as string),
  ]);
  if (!user) {
    console.error("[EDUCATORS] checkout for an unknown user", { userId, session: session.id });
    return;
  }

  const existing = await prisma.educatorProfile.findUnique({ where: { userId } });
  const stripeFields = {
    stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd: periodEnd(subscription),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    termsVersion: session.metadata?.termsVersion ?? null,
    termsAcceptedAt: new Date(),
  };
  // Someone coming back after their membership lapsed keeps their approval; a past rejection is looked at again.
  const status: EducatorStatus = existing?.status === "lapsed" && existing.reviewedAt ? "approved" : existing?.status === "approved" ? "approved" : "pending_review";
  if (existing) {
    await prisma.educatorProfile.update({ where: { id: existing.id }, data: { ...stripeFields, status } });
  } else {
    const displayName = user.name?.trim() || user.email?.split("@")[0] || "Educator";
    await prisma.educatorProfile.create({
      data: { userId, displayName, slug: await uniqueSlug(displayName), sharePct: educatorMembership.defaultSharePct, status, ...stripeFields },
    });
  }

  if (user.email) {
    const email = educatorWelcomeEmail({ name: user.name });
    await deliverOnce(`educator-welcome:${session.id}`, user.email, email.subject, email.content, { tag: "educator" });
  }
  if (await claimOnce(`educator-joined:${session.id}`)) {
    await prisma.notification.create({ data: { userId, kind: "course", title: "Your Educator membership has started. Complete your profile while the team reviews your application.", href: "/members/educator" } });
    await alertOwners({
      subject: `New Educator member: ${user.name || user.email}`,
      heading: `${user.name || user.email} has joined as an Educator and is waiting for approval.`,
      body: "They have paid for the year. Review their profile and approve or reject them in Studio. Rejecting them refunds the fee.",
      facts: [
        ["Name", user.name || "Not given"],
        ["Email", user.email || ""],
        ["Status", status === "approved" ? "Already approved (returning)" : "Waiting for approval"],
      ],
      cta: { label: "Review in Studio", href: "/studio/educators" },
      replyTo: user.email ?? undefined,
    });
  }
  refresh();
}

/** Renewals and changes: keep the period end in step with Stripe. */
async function syncSubscription(subscription: Stripe.Subscription) {
  await prisma.educatorProfile.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: { currentPeriodEnd: periodEnd(subscription), cancelAtPeriodEnd: subscription.cancel_at_period_end },
  });
  refresh();
}

/** The subscription has ended: their courses come off sale, and learners keep access. */
async function onSubscriptionEnded(subscription: Stripe.Subscription) {
  const profile = await prisma.educatorProfile.findUnique({ where: { stripeSubscriptionId: subscription.id }, select: { id: true, status: true } });
  if (!profile) return;
  await prisma.$transaction([
    prisma.educatorProfile.update({
      where: { id: profile.id },
      data: { currentPeriodEnd: periodEnd(subscription), cancelAtPeriodEnd: false, ...(profile.status === "approved" || profile.status === "pending_review" ? { status: "lapsed" } : {}) },
    }),
    prisma.course.updateMany({ where: { educatorId: profile.id, status: "published" }, data: { status: "unlisted" } }),
  ]);
  refresh();
}

function subscriptionIdOfInvoice(invoice: Stripe.Invoice) {
  const i = invoice as Stripe.Invoice & { subscription?: string | { id: string } | null; parent?: { subscription_details?: { subscription?: string; metadata?: Stripe.Metadata } } };
  const sub = i.subscription ?? i.parent?.subscription_details?.subscription;
  return { id: typeof sub === "string" ? sub : sub?.id ?? null, metadata: i.parent?.subscription_details?.metadata ?? null };
}

/** True when an invoice belongs to an Educator subscription. Asks Stripe only when the invoice doesn't say. */
async function isEducatorInvoice(invoice: Stripe.Invoice) {
  const { id, metadata } = subscriptionIdOfInvoice(invoice);
  if (!id) return null;
  if (metadata?.kind === EDUCATOR_KIND) return id;
  if (await prisma.educatorProfile.findUnique({ where: { stripeSubscriptionId: id }, select: { id: true } })) return id;
  if (metadata) return null;
  const subscription = await stripe.subscriptions.retrieve(id).catch(() => null);
  return subscription?.metadata?.kind === EDUCATOR_KIND ? id : null;
}

/**
 * The Stripe webhook's entry point for Educator memberships. Returns true when
 * the event belonged to an Educator subscription and has been handled, so the
 * membership logic never sees it.
 */
export async function handleEducatorWebhook(event: Stripe.Event): Promise<boolean> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription" || session.metadata?.kind !== EDUCATOR_KIND) return false;
      await onEducatorCheckout(session);
      return true;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      if (subscription.metadata?.kind !== EDUCATOR_KIND) return false;
      await syncSubscription(subscription);
      return true;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      if (subscription.metadata?.kind !== EDUCATOR_KIND) return false;
      await onSubscriptionEnded(subscription);
      return true;
    }
    case "invoice.payment_succeeded":
    case "invoice.payment_failed": {
      const id = await isEducatorInvoice(event.data.object as Stripe.Invoice);
      if (!id) return false;
      if (event.type === "invoice.payment_succeeded") {
        const subscription = await stripe.subscriptions.retrieve(id);
        await syncSubscription(subscription);
      }
      // Stripe emails the educator about a failed card; the subscription ends only if every retry fails.
      return true;
    }
    default:
      return false;
  }
}

/** The educator profile for a user, if any. Never throws, e.g. before the tables exist. */
export async function educatorFor(userId: string) {
  return prisma.educatorProfile.findUnique({ where: { userId } }).catch(() => null);
}

export type EducatorDecision = "approve" | "reject" | "suspend" | "reinstate";

const DECISION_STATUS: Record<EducatorDecision, EducatorStatus> = {
  approve: "approved",
  reject: "rejected",
  suspend: "suspended",
  reinstate: "approved",
};

/** Approves, rejects, suspends or reinstates an educator, and tells them. */
export async function decideEducator(input: { id: string; decision: EducatorDecision; note: string; reviewerId: string }) {
  const profile = await prisma.educatorProfile.findUnique({ where: { id: input.id }, include: { user: { select: { id: true, name: true, email: true } } } });
  if (!profile) return { ok: false as const, error: "We couldn't find that educator." };
  if ((input.decision === "reject" || input.decision === "suspend") && input.note.trim().length < 10) {
    return { ok: false as const, error: "Please write a note of at least a sentence explaining why." };
  }
  if (input.decision === "approve" && profile.status !== "pending_review") return { ok: false as const, error: "Only an educator waiting for approval can be approved." };
  if (input.decision === "reinstate" && profile.status !== "suspended") return { ok: false as const, error: "Only a suspended educator can be reinstated." };

  await prisma.$transaction([
    prisma.educatorProfile.update({
      where: { id: profile.id },
      data: { status: DECISION_STATUS[input.decision], reviewNote: input.note.trim() || null, reviewedById: input.reviewerId, reviewedAt: new Date() },
    }),
    // Rejected or suspended: nothing of theirs stays on sale. Learners with a place keep access.
    ...(input.decision === "reject" || input.decision === "suspend"
      ? [prisma.course.updateMany({ where: { educatorId: profile.id, status: "published" }, data: { status: "unlisted" } })]
      : []),
  ]);

  if (profile.user.email) {
    const email = educatorDecisionEmail({ name: profile.user.name, decision: input.decision, note: input.note });
    await deliver(profile.user.email, email.subject, email.content, { tag: "educator-decision" });
  }
  await prisma.notification.create({
    data: { userId: profile.user.id, kind: "course", title: decisionNotice(input.decision), href: "/members/educator" },
  });
  refresh();
  return { ok: true as const, profile };
}

function decisionNotice(decision: EducatorDecision) {
  return {
    approve: "You're approved as an Educator. You can now send courses for review.",
    reject: "Your Educator application wasn't approved. Your fee is being refunded.",
    suspend: "Your Educator membership is suspended. Check your email for details.",
    reinstate: "Your Educator membership is active again.",
  }[decision];
}

/** Refunds the latest Educator membership payment and cancels the subscription, after a rejection. */
export async function refundEducatorMembership(profileId: string) {
  const profile = await prisma.educatorProfile.findUnique({ where: { id: profileId }, select: { stripeSubscriptionId: true } });
  if (!profile?.stripeSubscriptionId || !process.env.STRIPE_SECRET_KEY) return { ok: false as const, error: "There's no Stripe subscription to refund." };
  const invoices = await stripe.invoices.list({ subscription: profile.stripeSubscriptionId, status: "paid", limit: 1 });
  const invoice = invoices.data[0] as (Stripe.Invoice & { payment_intent?: string | { id: string } | null }) | undefined;
  const paymentIntent = invoice?.payment_intent;
  if (paymentIntent) {
    await stripe.refunds.create({ payment_intent: typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id, reason: "requested_by_customer" });
  }
  await stripe.subscriptions.cancel(profile.stripeSubscriptionId);
  return { ok: true as const, refunded: !!paymentIntent };
}
