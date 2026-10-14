import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { alertOwners } from "@/lib/mail/send";
import { formatMoney } from "@/lib/mail/templates/billing";
import { reversalFor, splitSale } from "@/lib/revenue-split";

/**
 * The record of what each paid course place earned, and where the money went.
 * Every function here is safe to run more than once for the same Stripe event:
 * CourseSale is one row per enrolment, and each LedgerEntry is unique to the
 * Stripe object it came from.
 */

const idOf = (v: string | { id: string } | null | undefined) => (!v ? null : typeof v === "string" ? v : v.id);

async function entry(saleId: string, type: string, amount: number, currency: string, stripeObjectId: string, note?: string) {
  if (!amount) return;
  await prisma.ledgerEntry.createMany({ data: [{ saleId, type, amount, currency, stripeObjectId, note }], skipDuplicates: true });
}

/** Records a paid place: the split, Stripe's fee and the transfer to the educator. */
export async function recordSale(input: { enrolmentId: string; courseSlug: string; versionId: string | null; priceType: string; paymentIntentId: string; metadata: Stripe.Metadata | null }) {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  const pi = await stripe.paymentIntents.retrieve(input.paymentIntentId, { expand: ["latest_charge.balance_transaction"] });
  const charge = pi.latest_charge && typeof pi.latest_charge !== "string" ? pi.latest_charge : null;
  const balance = charge?.balance_transaction && typeof charge.balance_transaction !== "string" ? charge.balance_transaction : null;
  const gross = pi.amount_received || pi.amount;
  const educatorId = input.metadata?.educatorId || null;
  // What Stripe actually did is the record: the application fee it kept, and the rest transferred.
  const platformAmount = educatorId ? (pi.application_fee_amount ?? splitSale(gross, Number(input.metadata?.sharePct ?? 0)).platformAmount) : gross;
  const sharePct = educatorId ? Number(input.metadata?.sharePct ?? 0) : 0;
  const currency = pi.currency;

  const sale = await prisma.courseSale.upsert({
    where: { enrolmentId: input.enrolmentId },
    create: {
      enrolmentId: input.enrolmentId,
      courseSlug: input.courseSlug,
      versionId: input.versionId,
      educatorId,
      priceType: input.priceType,
      currency,
      gross,
      sharePct,
      platformAmount,
      educatorAmount: gross - platformAmount,
      stripeFee: balance?.fee ?? null,
      stripePaymentIntentId: pi.id,
      stripeChargeId: charge?.id ?? null,
      stripeTransferId: idOf(charge?.transfer as string | { id: string } | null),
    },
    update: {
      stripeFee: balance?.fee ?? undefined,
      stripeChargeId: charge?.id ?? undefined,
      stripeTransferId: idOf(charge?.transfer as string | { id: string } | null) ?? undefined,
    },
  });

  if (charge) await entry(sale.id, "sale", gross, currency, charge.id);
  if (sale.educatorAmount && sale.stripeTransferId) await entry(sale.id, "educator_share", -sale.educatorAmount, currency, sale.stripeTransferId);
  if (balance?.fee) await entry(sale.id, "stripe_fee", -balance.fee, currency, balance.id);
  return sale;
}

/**
 * charge.refunded, full or partial. Records the refund and how much of the
 * educator's share Stripe took back. A refund made in the Stripe dashboard
 * without "reverse transfer" leaves the educator's share with them, so the
 * team is told to reverse it by hand.
 */
export async function recordRefund(charge: Stripe.Charge) {
  const sale = await prisma.courseSale.findFirst({
    where: { OR: [{ stripeChargeId: charge.id }, { stripePaymentIntentId: idOf(charge.payment_intent as string | { id: string } | null) ?? "-" }] },
  });
  if (!sale) return null;
  const refundedTotal = charge.amount_refunded;
  const owed = reversalFor(sale, refundedTotal);

  // What Stripe has really taken back from the educator: transfer reversals less the fee it returned to them.
  let reversedTotal = sale.reversedAmount;
  if (sale.stripeTransferId && process.env.STRIPE_SECRET_KEY) {
    const transfer = await stripe.transfers.retrieve(sale.stripeTransferId).catch(() => null);
    const feeId = idOf(charge.application_fee as string | { id: string } | null);
    const fee = feeId ? await stripe.applicationFees.retrieve(feeId).catch(() => null) : null;
    if (transfer) reversedTotal = Math.max(0, transfer.amount_reversed - (fee?.amount_refunded ?? 0));
  }

  const updated = await prisma.courseSale.update({
    where: { id: sale.id },
    data: {
      refundedAmount: refundedTotal,
      reversedAmount: reversedTotal,
      status: refundedTotal >= sale.gross ? "refunded" : refundedTotal > 0 ? "partially_refunded" : sale.status,
      refundedAt: new Date(),
    },
  });
  for (const r of charge.refunds?.data ?? []) await entry(sale.id, "refund", -r.amount, r.currency, r.id);
  if (reversedTotal > sale.reversedAmount) {
    await entry(sale.id, "share_reversed", reversedTotal - sale.reversedAmount, sale.currency, `${sale.stripeTransferId}:${reversedTotal}`);
  }

  if (sale.educatorId && owed > 0 && reversedTotal < sale.reversedAmount + owed) {
    const missing = sale.reversedAmount + owed - reversedTotal;
    await alertOwners({
      subject: "A course refund didn't take back the educator's share",
      heading: `A refund on ${sale.courseSlug} left ${formatMoney(missing, sale.currency)} with the educator.`,
      body: "The refund was probably made in the Stripe dashboard without ticking \"reverse the transfer\". Reverse that amount from the transfer in Stripe, or refund from Studio > Courses next time, which does it for you.",
      facts: [
        ["Charge", charge.id],
        ["Transfer", sale.stripeTransferId ?? "None"],
        ["Refunded", formatMoney(refundedTotal, sale.currency) ?? ""],
      ],
    });
  }
  return updated;
}

/** charge.dispute.created: the learner's bank is disputing the payment. */
export async function recordDispute(dispute: Stripe.Dispute) {
  const sale = await prisma.courseSale.findFirst({ where: { stripeChargeId: idOf(dispute.charge as string | { id: string } | null) ?? "-" } });
  if (!sale) return false;
  await prisma.courseSale.update({ where: { id: sale.id }, data: { status: "disputed" } });
  await entry(sale.id, "dispute", -dispute.amount, dispute.currency, dispute.id, dispute.reason);
  await alertOwners({
    subject: `A course payment is disputed: ${sale.courseSlug}`,
    heading: `A learner's bank has disputed ${formatMoney(dispute.amount, dispute.currency)} for ${sale.courseSlug}.`,
    body: sale.educatorId
      ? "Respond to the dispute in Stripe. If it's lost, consider reversing the educator's share of this sale from the transfer."
      : "Respond to the dispute in Stripe before the deadline.",
    facts: [
      ["Reason", dispute.reason],
      ["Charge", idOf(dispute.charge as string | { id: string } | null) ?? ""],
    ],
  });
  return true;
}

/** Refunds a sale in full from Studio. For an educator's course this also takes back their share. */
export async function refundSale(saleId: string) {
  const sale = await prisma.courseSale.findUnique({ where: { id: saleId } });
  if (!sale?.stripePaymentIntentId) return { ok: false as const, error: "There's no payment to refund." };
  if (sale.refundedAmount >= sale.gross) return { ok: false as const, error: "This sale has already been refunded." };
  await stripe.refunds.create({
    payment_intent: sale.stripePaymentIntentId,
    reason: "requested_by_customer",
    ...(sale.educatorId ? { reverse_transfer: true, refund_application_fee: true } : {}),
  });
  return { ok: true as const };
}
