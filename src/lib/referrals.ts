import type Stripe from "stripe";
import type { ReferralReward, RewardStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { site } from "@/config/site";
import { subscriptionTiers, type PlanId } from "@/config/subscriptions";
import { deliverOnce } from "@/lib/mail/send";
import { formatMoney } from "@/lib/mail/templates/billing";
import { firstNameOf } from "@/lib/mail/templates/directory";
import { referralBankedEmail, referralCreditedEmail } from "@/lib/mail/templates/referrals";

/**
 * Invite colleagues. Every account has a code such as "AOIFE-7K2". A colleague who joins with it
 * pays half of one month for their first invoice, and once their first payment clears the person
 * who shared the code gets one month of their own membership free, as credit on their Stripe bill.
 * Someone without a paid membership has the reward banked and credited when they start paying.
 */

/* ------------------------------------------------------------------ */
/* Pure helpers                                                         */
/* ------------------------------------------------------------------ */

export const REFERRAL_COOKIE = "tc_ref";
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/** No 0/O, 1/I/L, so a code read aloud or from a slide is typed correctly. */
const SUFFIX_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_PATTERN = /^[A-Z]{1,12}-[A-Z0-9]{3,6}$/;

/** "Aoife Kelly" -> "AOIFE-7K2". Letters from the first name only, at most eight. */
export function makeReferralCode(name: string | null | undefined, random: () => number = Math.random) {
  const parts = (name ?? "").trim().split(/\s+/);
  const titled = parts.length > 1 && /^(dr|mr|mrs|ms|miss|mx|prof|professor)\.?$/i.test(parts[0]);
  const first = (titled ? parts[1] : parts[0]) ?? "";
  const letters = first
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 8);
  const stem = letters.length >= 2 ? letters : "MEMBER";
  let suffix = "";
  for (let i = 0; i < 3; i++) suffix += SUFFIX_CHARS[Math.floor(random() * SUFFIX_CHARS.length) % SUFFIX_CHARS.length];
  return `${stem}-${suffix}`;
}

/** Tidy what someone typed or pasted; null if it can't be a code. */
export function normaliseCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const code = input.trim().toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9-]/g, "");
  return CODE_PATTERN.test(code) ? code : null;
}

export type Currency = "gbp" | "eur";

export function asCurrency(value: string | null | undefined): Currency {
  return value?.toLowerCase() === "eur" ? "eur" : "gbp";
}

/** One month of a plan in the smallest unit, at the founding price when they are founding. */
export function monthlyPriceMinor(plan: string | null | undefined, isFounding: boolean, currency: string | null | undefined) {
  const tier = subscriptionTiers.find((t) => t.id === plan);
  if (!tier) return null;
  const major =
    asCurrency(currency) === "eur" && tier.eur
      ? (isFounding && tier.eur.foundingPrice) || tier.eur.price
      : (isFounding && tier.foundingPrice) || tier.price;
  return Math.round(major * 100);
}

/** The reward: one month of the referrer's own membership, in their currency. Null without a plan. */
export function rewardAmountFor(referrer: { plan: string | null | undefined; isFounding: boolean; currency?: string | null }) {
  const amount = monthlyPriceMinor(referrer.plan, referrer.isFounding, referrer.currency);
  return amount ? { amount, currency: asCurrency(referrer.currency) } : null;
}

/** The new member's discount: half of one month of the plan they chose, taken off their first invoice. */
export function halfMonthDiscount(plan: string | null | undefined, founding: boolean, currency: string | null | undefined) {
  const month = monthlyPriceMinor(plan, founding, currency);
  return month ? Math.round(month / 2) : null;
}

type Party = { id?: string | null; email?: string | null; stripeCustomerId?: string | null };

/** Same account, same email address or same Stripe customer. */
export function isSelfReferral(referrer: Party, buyer: Party) {
  const same = (a?: string | null, b?: string | null) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
  return same(referrer.id, buyer.id) || same(referrer.email, buyer.email) || same(referrer.stripeCustomerId, buyer.stripeCustomerId);
}

/** The share link, e.g. https://trichollective.net/r/AOIFE-7K2. */
export function referralLink(code: string) {
  return `${site.url.replace(/\/$/, "")}/r/${encodeURIComponent(code)}`;
}

/** The prefilled message for email and WhatsApp. Carries the code and nothing else personal. */
export function shareMessage(code: string) {
  return `I am a member of Trichollective, the community for cosmetic, clinical and medical hair and scalp professionals. If you join with my link, your first month is half price: ${referralLink(code)}`;
}

export const SHARE_SUBJECT = "An invitation to Trichollective, with your first month at half price";

/** Totals per currency, e.g. "£28.00" or "£14.00 and €16.00". */
export function sumByCurrency(rows: { amount: number; currency: string }[]) {
  const totals = new Map<string, number>();
  for (const r of rows) if (r.amount > 0) totals.set(r.currency, (totals.get(r.currency) ?? 0) + r.amount);
  if (!totals.size) return formatMoney(0, "gbp")!;
  return [...totals.entries()].map(([c, a]) => formatMoney(a, c)).join(" and ");
}

export const REWARD_STATUS_LABEL: Record<RewardStatus, string> = {
  pending: "Waiting for their first payment",
  banked: "Kept until you start paying",
  credited: "Credited to your bill",
  void: "Withdrawn",
};

/* ------------------------------------------------------------------ */
/* Codes                                                                */
/* ------------------------------------------------------------------ */

/** The member's code, created the first time it is needed. */
export async function ensureReferralCode(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true, name: true } });
  if (!user) throw new Error("That account no longer exists.");
  if (user.referralCode) return user.referralCode;
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = makeReferralCode(attempt < 6 ? user.name : null);
    try {
      const updated = await prisma.user.updateMany({ where: { id: userId, referralCode: null }, data: { referralCode: code } });
      if (updated.count) return code;
      // Set by a parallel request in the meantime.
      const again = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
      if (again?.referralCode) return again.referralCode;
    } catch {
      // Unique clash with someone else's code: try another.
    }
  }
  throw new Error("Could not create an invitation code.");
}

/** The account behind a code, if it can still invite people. */
export async function findReferrer(code: string | null | undefined) {
  const clean = normaliseCode(code);
  if (!clean) return null;
  const user = await prisma.user.findUnique({
    where: { referralCode: clean },
    select: { id: true, name: true, email: true, stripeCustomerId: true, accessStatus: true },
  });
  if (!user || user.accessStatus === "banned" || user.accessStatus === "suspended") return null;
  return { ...user, code: clean };
}

/* ------------------------------------------------------------------ */
/* Checkout                                                             */
/* ------------------------------------------------------------------ */

/**
 * A Stripe coupon for half of one month, reused by id. Stripe allows our own coupon ids, so the
 * same plan, currency and amount always share one coupon.
 */
export async function ensureReferralCoupon(plan: PlanId, currency: Currency, amount: number) {
  const id = `ref-half-${plan}-${currency}-${amount}`;
  try {
    const existing = await stripe.coupons.retrieve(id);
    if (existing.valid) return existing.id;
  } catch (error) {
    if ((error as { code?: string }).code !== "resource_missing") throw error;
  }
  try {
    const created = await stripe.coupons.create({
      id,
      amount_off: amount,
      currency,
      duration: "once",
      name: "Invited by a colleague: half off your first month",
      metadata: { kind: "referral", plan, currency, amount: String(amount) },
    });
    return created.id;
  } catch (error) {
    // Created by a parallel checkout a moment ago.
    if ((error as { code?: string }).code === "resource_already_exists") return id;
    throw error;
  }
}

/**
 * What a checkout should add for a referral code, or null when none applies: unknown code,
 * self-referral, Premium Business, or a buyer who has paid for a membership before.
 */
export async function referralForCheckout(opts: {
  code: string | null | undefined;
  plan: PlanId | "premium";
  founding: boolean;
  currency: Currency;
  buyer: { id: string; email: string | null; stripeCustomerId: string | null; hasPaidBefore: boolean } | null;
}) {
  if (opts.plan === "premium") return null;
  const referrer = await findReferrer(opts.code);
  if (!referrer) return null;
  if (opts.buyer && (opts.buyer.hasPaidBefore || isSelfReferral(referrer, opts.buyer))) return null;
  if (opts.buyer) {
    const already = await prisma.referralReward.findFirst({
      where: { status: { not: "void" }, OR: [{ referredId: opts.buyer.id }, ...(opts.buyer.email ? [{ referredEmail: opts.buyer.email.toLowerCase() }] : [])] },
      select: { id: true },
    });
    if (already) return null;
  }
  const amount = halfMonthDiscount(opts.plan, opts.founding, opts.currency);
  if (!amount) return null;
  const coupon = await ensureReferralCoupon(opts.plan, opts.currency, amount);
  return { coupon, metadata: { referralCode: referrer.code, referrerId: referrer.id } };
}

/* ------------------------------------------------------------------ */
/* Webhook                                                              */
/* ------------------------------------------------------------------ */

export type PriorState = { userId: string | null; hadPaid: boolean; referredById: string | null };

/**
 * Read before the webhook updates the account, so a returning member who used a code is not
 * counted as a new paying member.
 */
export async function referralPriorState(session: Stripe.Checkout.Session): Promise<PriorState | null> {
  if (!session.metadata?.referralCode) return null;
  const email = (session.customer_details?.email || session.customer_email || "").toLowerCase();
  const user = session.metadata.userId
    ? await prisma.user.findUnique({ where: { id: session.metadata.userId }, select: priorSelect })
    : email
      ? await prisma.user.findUnique({ where: { email }, select: priorSelect })
      : null;
  return {
    userId: user?.id ?? null,
    hadPaid: !!(user?.stripeSubscriptionId || user?.stripeCurrentPeriodEnd),
    referredById: user?.referredById ?? null,
  };
}
const priorSelect = { id: true, stripeSubscriptionId: true, stripeCurrentPeriodEnd: true, referredById: true } as const;

/**
 * checkout.session.completed with a referral code: record the reward as pending (once per
 * checkout session), link the new member to whoever referred them, and settle straight away
 * when the first payment has already been taken.
 */
export async function recordReferralCheckout(session: Stripe.Checkout.Session, prior: PriorState | null) {
  const code = normaliseCode(session.metadata?.referralCode);
  const referrerId = session.metadata?.referrerId;
  if (!code || !referrerId) return null;

  const existing = await prisma.referralReward.findUnique({ where: { checkoutSessionId: session.id } });
  if (existing) return existing;

  const email = (session.customer_details?.email || session.customer_email || "").toLowerCase();
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  const [referrer, buyer] = await Promise.all([
    prisma.user.findUnique({ where: { id: referrerId }, select: { id: true, email: true, stripeCustomerId: true } }),
    session.metadata?.userId
      ? prisma.user.findUnique({ where: { id: session.metadata.userId }, select: { id: true, email: true, referredById: true } })
      : email
        ? prisma.user.findUnique({ where: { email }, select: { id: true, email: true, referredById: true } })
        : null,
  ]);
  if (!referrer) return null;

  let voidReason: string | null = null;
  if (isSelfReferral(referrer, { id: buyer?.id, email: email || buyer?.email, stripeCustomerId: customerId })) {
    voidReason = "The code belongs to the person who paid.";
  } else if (prior?.hadPaid) {
    voidReason = "They had paid for a membership before, so they are not a new member.";
  } else if (prior?.referredById && prior.referredById !== referrerId) {
    voidReason = "They had already joined with someone else's code.";
  } else {
    const already = await prisma.referralReward.findFirst({
      where: { status: { not: "void" }, OR: [...(buyer ? [{ referredId: buyer.id }] : []), ...(email ? [{ referredEmail: email }] : [])] },
      select: { id: true },
    });
    if (already) voidReason = "A reward has already been recorded for this new member.";
  }

  const plan = session.metadata?.plan ?? null;
  let reward: ReferralReward;
  try {
    reward = await prisma.referralReward.create({
      data: {
        referrerId: referrer.id,
        referredId: buyer?.id ?? null,
        referredEmail: email || buyer?.email?.toLowerCase() || "unknown",
        code,
        plan,
        checkoutSessionId: session.id,
        status: voidReason ? "void" : "pending",
        note: voidReason,
      },
    });
  } catch {
    // A retried event created it in the meantime.
    return prisma.referralReward.findUnique({ where: { checkoutSessionId: session.id } });
  }

  if (!voidReason && buyer && !buyer.referredById) {
    await prisma.user.updateMany({
      where: { id: buyer.id, referredById: null },
      data: { referredById: referrer.id, referredByCode: code },
    });
  }

  // Card payments clear at checkout; slower methods wait for invoice.payment_succeeded.
  if (!voidReason && session.payment_status === "paid" && (session.amount_total ?? 0) > 0) {
    return earnReward(reward.id);
  }
  return reward;
}

/**
 * invoice.payment_succeeded: a paid invoice from someone who joined with a code earns the
 * reward, and a paid invoice from anyone credits rewards they have banked.
 */
export async function settleReferralForPayment(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? null;
  const payer = customerId
    ? await prisma.user.findUnique({ where: { stripeCustomerId: customerId }, select: { id: true, email: true } })
    : null;

  if ((invoice.amount_paid ?? 0) > 0) {
    const email = (invoice.customer_email || payer?.email || "").toLowerCase();
    const pending = await prisma.referralReward.findMany({
      where: {
        status: "pending",
        OR: [...(payer ? [{ referredId: payer.id }] : []), ...(email ? [{ referredEmail: email }] : [])],
      },
      select: { id: true },
    });
    if (pending.length) {
      for (const r of pending) await earnReward(r.id);
    }
  }

  if (payer) await creditBankedRewards(payer.id);
}

/** The first payment cleared: credit the referrer now, or bank it until they pay. */
export async function earnReward(rewardId: string) {
  const claimed = await prisma.referralReward.updateMany({
    where: { id: rewardId, status: "pending" },
    data: { status: "banked", earnedAt: new Date() },
  });
  const reward = await prisma.referralReward.findUnique({ where: { id: rewardId } });
  if (!reward || !claimed.count) return reward;

  let result: CreditResult;
  try {
    result = await creditReward(reward.id);
  } catch (error) {
    // Left banked: credited when they next pay, or by the team from Studio.
    console.error("[REFERRALS] credit", error);
    return prisma.referralReward.findUnique({ where: { id: rewardId } });
  }
  if (result.status === "banked") {
    // Show an estimate of its value, from their current plan if they have one.
    const referrer = await prisma.user.findUnique({ where: { id: reward.referrerId }, select: { plan: true, isFounding: true } });
    const estimate = referrer ? rewardAmountFor({ plan: referrer.plan, isFounding: referrer.isFounding, currency: reward.currency }) : null;
    if (estimate) await prisma.referralReward.update({ where: { id: reward.id }, data: { amount: estimate.amount, currency: estimate.currency } });
    await notify(reward.id, "banked");
  }
  return prisma.referralReward.findUnique({ where: { id: rewardId } });
}

/** Credit every banked reward a member has, now that they may be paying. */
export async function creditBankedRewards(userId: string) {
  const banked = await prisma.referralReward.findMany({
    where: { referrerId: userId, status: "banked", stripeBalanceTxnId: null },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  const results = [];
  for (const r of banked) results.push(await creditReward(r.id));
  return results;
}

type CreditResult =
  | { status: "credited"; amount: number; currency: string }
  | { status: "banked"; reason: string }
  | { status: "skipped"; reason: string };

/**
 * Take one month off the referrer's next bill with a negative customer balance transaction.
 * Only for a banked reward with no transaction yet, and with a Stripe idempotency key, so a
 * retried webhook or a double click never credits twice. The value is the referrer's own monthly
 * price in their Stripe customer's currency, so nothing is ever converted.
 */
export async function creditReward(rewardId: string): Promise<CreditResult> {
  const reward = await prisma.referralReward.findUnique({
    where: { id: rewardId },
    include: {
      referrer: {
        select: { id: true, plan: true, isFounding: true, stripeCustomerId: true, stripeSubscriptionId: true, stripeCurrentPeriodEnd: true },
      },
    },
  });
  if (!reward) return { status: "skipped", reason: "That reward no longer exists." };
  if (reward.status !== "banked" || reward.stripeBalanceTxnId) return { status: "skipped", reason: "This reward is not waiting to be credited." };

  const r = reward.referrer;
  const paying = !!r.stripeCustomerId && !!r.stripeSubscriptionId && !!r.plan && !!r.stripeCurrentPeriodEnd && r.stripeCurrentPeriodEnd.getTime() > Date.now();
  if (!paying || !r.stripeCustomerId) return { status: "banked", reason: "They do not have a paid membership yet." };

  const customer = await stripe.customers.retrieve(r.stripeCustomerId);
  if ((customer as Stripe.DeletedCustomer).deleted) return { status: "banked", reason: "Their Stripe customer has been deleted." };
  const currency = asCurrency((customer as Stripe.Customer).currency);
  const value = rewardAmountFor({ plan: r.plan, isFounding: r.isFounding, currency });
  if (!value) return { status: "banked", reason: "Their plan has no monthly price." };

  const referred = reward.referredId
    ? await prisma.user.findUnique({ where: { id: reward.referredId }, select: { name: true } })
    : null;
  const txn = await stripe.customers.createBalanceTransaction(
    r.stripeCustomerId,
    {
      amount: -value.amount,
      currency: value.currency,
      description: `Referral reward: one month free for inviting ${firstNameOf(referred?.name, "a colleague")}`,
      metadata: { kind: "referral", rewardId: reward.id, code: reward.code },
    },
    { idempotencyKey: `referral-reward-${reward.id}` }
  );

  const updated = await prisma.referralReward.updateMany({
    where: { id: reward.id, status: "banked", stripeBalanceTxnId: null },
    data: { status: "credited", stripeBalanceTxnId: txn.id, amount: value.amount, currency: value.currency, creditedAt: new Date() },
  });
  if (updated.count) await notify(reward.id, "credited");
  return { status: "credited", amount: value.amount, currency: value.currency };
}

/**
 * Withdraw a reward. A credited one is reversed with a positive balance transaction of the same
 * amount, which Stripe adds to their next bill.
 */
export async function voidReward(rewardId: string, reason: string) {
  const reward = await prisma.referralReward.findUnique({
    where: { id: rewardId },
    include: { referrer: { select: { stripeCustomerId: true } } },
  });
  if (!reward) throw new Error("That reward no longer exists.");
  if (reward.status === "void") return { reward, reversed: null as string | null, before: reward.status };

  let reversed: string | null = null;
  if (reward.status === "credited" && reward.stripeBalanceTxnId && reward.amount > 0) {
    if (!reward.referrer.stripeCustomerId) throw new Error("The referrer no longer has a Stripe customer, so the credit cannot be reversed.");
    const txn = await stripe.customers.createBalanceTransaction(
      reward.referrer.stripeCustomerId,
      {
        amount: reward.amount,
        currency: reward.currency,
        description: "Referral reward withdrawn",
        metadata: { kind: "referral-void", rewardId: reward.id, reversing: reward.stripeBalanceTxnId },
      },
      { idempotencyKey: `referral-void-${reward.id}` }
    );
    reversed = txn.id;
  }
  const note = [reward.note, `Withdrawn: ${reason}`, reversed ? `Reversed with ${reversed}.` : null].filter(Boolean).join(" ");
  const updated = await prisma.referralReward.update({ where: { id: reward.id }, data: { status: "void", note: note.slice(0, 1000) } });
  return { reward: updated, reversed, before: reward.status };
}

async function notify(rewardId: string, kind: "credited" | "banked") {
  const reward = await prisma.referralReward.findUnique({
    where: { id: rewardId },
    include: { referrer: { select: { email: true, name: true } }, referred: { select: { name: true } } },
  });
  if (!reward?.referrer.email) return;
  const facts = {
    name: reward.referrer.name,
    referredName: reward.referred?.name ?? null,
    amount: reward.amount > 0 ? formatMoney(reward.amount, reward.currency) : null,
  };
  const email = kind === "credited" ? referralCreditedEmail(facts) : referralBankedEmail(facts);
  await deliverOnce(`referral:${reward.id}:${kind}`, reward.referrer.email, email.subject, email.content, { tag: `referral-${kind}` });
}

/* ------------------------------------------------------------------ */
/* Webhook entry points                                                 */
/* ------------------------------------------------------------------ */

/** Never throws: a referral problem must never fail a payment webhook. */
export async function onReferralCheckout(session: Stripe.Checkout.Session, prior: PriorState | null) {
  try {
    await recordReferralCheckout(session, prior);
  } catch (error) {
    console.error("[REFERRALS] checkout", error);
  }
  // Someone who just started paying may have rewards banked from before.
  try {
    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
    const payer = customerId ? await prisma.user.findUnique({ where: { stripeCustomerId: customerId }, select: { id: true } }) : null;
    if (payer) await creditBankedRewards(payer.id);
  } catch (error) {
    console.error("[REFERRALS] banked", error);
  }
}

/** Never throws. */
export async function onReferralInvoicePaid(invoice: Stripe.Invoice) {
  try {
    await settleReferralForPayment(invoice);
  } catch (error) {
    console.error("[REFERRALS] invoice", error);
  }
}

/** Never throws; for the line before the webhook updates the account. */
export async function referralPriorStateSafe(session: Stripe.Checkout.Session) {
  try {
    return await referralPriorState(session);
  } catch (error) {
    console.error("[REFERRALS] prior", error);
    return null;
  }
}
