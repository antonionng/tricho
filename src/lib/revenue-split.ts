/**
 * How a course sale is split between the educator and Trichollective, in
 * whole pence. Kept free of the database so the arithmetic can be tested.
 *
 * The educator's share is rounded down to the penny, so the two parts always
 * add up to exactly what the learner paid and Trichollective never promises
 * more than it received. Stripe's processing fee comes out of
 * Trichollective's part (destination charges).
 *
 * VAT: the share is worked out on the price the learner pays, VAT included,
 * until our accountant confirms otherwise. Change it here, in one place.
 */

export type Split = { gross: number; sharePct: number; educatorAmount: number; platformAmount: number };

export function splitSale(gross: number, sharePct: number): Split {
  const pence = Math.max(0, Math.round(gross));
  const pct = Math.min(100, Math.max(0, Math.round(sharePct)));
  const educatorAmount = Math.floor((pence * pct) / 100);
  return { gross: pence, sharePct: pct, educatorAmount, platformAmount: pence - educatorAmount };
}

/**
 * How much of the educator's share a refund takes back: the same proportion
 * as the refund is of the sale, capped at what hasn't already been taken back.
 * A full refund always takes back everything that is left.
 */
export function reversalFor(sale: { gross: number; educatorAmount: number; reversedAmount: number }, refundedTotal: number) {
  if (sale.gross <= 0 || sale.educatorAmount <= 0) return 0;
  const refunded = Math.min(sale.gross, Math.max(0, Math.round(refundedTotal)));
  const owedBack = refunded >= sale.gross ? sale.educatorAmount : Math.floor((sale.educatorAmount * refunded) / sale.gross);
  return Math.max(0, owedBack - sale.reversedAmount);
}

export type SaleTotals = { sales: number; gross: number; educator: number; platform: number; stripeFees: number; refunded: number; reversed: number; net: number };

/** Adds up sales for a dashboard or report. Net is what Trichollective keeps after fees, refunds and reversals. */
export function totals(
  sales: { gross: number; educatorAmount: number; platformAmount: number; stripeFee: number | null; refundedAmount: number; reversedAmount: number }[]
): SaleTotals {
  const t = sales.reduce(
    (a, s) => ({
      sales: a.sales + 1,
      gross: a.gross + s.gross,
      educator: a.educator + s.educatorAmount - s.reversedAmount,
      platform: a.platform + s.platformAmount,
      stripeFees: a.stripeFees + (s.stripeFee ?? 0),
      refunded: a.refunded + s.refundedAmount,
      reversed: a.reversed + s.reversedAmount,
    }),
    { sales: 0, gross: 0, educator: 0, platform: 0, stripeFees: 0, refunded: 0, reversed: 0 }
  );
  // What Trichollective keeps: its part, less Stripe's fees, less the part of refunds the educator didn't bear.
  return { ...t, net: t.platform - t.stripeFees - (t.refunded - t.reversed) };
}
