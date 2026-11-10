import type Stripe from "stripe";

/**
 * VAT for event prices. Most of the site prices VAT-inclusive. An event can
 * instead price everything before VAT (Event.pricesExcludeVat), for the
 * in-person conference sold to clinics and brands. Then checkout adds UK VAT
 * at 20% on top with a Stripe TaxRate on each line item, so Stripe shows the
 * VAT and the total, and every amount we store is what was actually charged.
 *
 * Stripe Tax (automatic_tax) is not used: the account has no head office or
 * registrations set up for it.
 */

export const UK_VAT_PERCENT = 20;

/** The VAT on a net amount in pence, rounded as Stripe rounds a line's tax. */
export function vatOn(netPence: number) {
  return Math.round((Math.max(0, netPence) * UK_VAT_PERCENT) / 100);
}

/** What a line costs: the net, the VAT added on top (zero for VAT-inclusive events) and the total charged. */
export function lineTotal(unitPence: number, quantity: number, excludesVat: boolean) {
  const net = Math.max(0, Math.round(unitPence)) * Math.max(0, Math.round(quantity));
  const vat = excludesVat ? vatOn(net) : 0;
  return { net, vat, gross: net + vat };
}

/** "£125" or "£125.50". */
export function poundsText(pence: number) {
  return pence % 100 === 0 ? `£${(pence / 100).toLocaleString("en-GB")}` : `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** A price as shown to buyers: "£125 + VAT" on a VAT-on-top event, "£125" otherwise. */
export function priceText(pence: number, excludesVat: boolean) {
  return excludesVat ? `${poundsText(pence)} + VAT` : poundsText(pence);
}

/** Our own VAT number for invoices, when it has been set. */
export function ourVatNumber() {
  return process.env.TRICHOLLECTIVE_VAT_NUMBER?.trim() || null;
}

/**
 * The invoice footer naming the seller's VAT number. Returns null until
 * TRICHOLLECTIVE_VAT_NUMBER is set.
 * TODO: set TRICHOLLECTIVE_VAT_NUMBER in Vercel so VAT invoices carry it.
 */
export function sellerVatLine() {
  const vat = ourVatNumber();
  return vat ? `Trichollective VAT number: ${vat}` : null;
}

let cachedRate: string | null = null;

/**
 * The Stripe TaxRate for UK VAT at 20% added on top. Uses
 * STRIPE_TAX_RATE_UK_VAT when set; otherwise finds an active matching rate
 * on the account, or creates one, and remembers it for this instance.
 */
export async function ukVatTaxRateId(stripe: Pick<Stripe, "taxRates">): Promise<string> {
  const fromEnv = process.env.STRIPE_TAX_RATE_UK_VAT?.trim();
  if (fromEnv) return fromEnv;
  if (cachedRate) return cachedRate;
  const list = await stripe.taxRates.list({ active: true, inclusive: false, limit: 100 });
  const found = list.data.find((r) => r.percentage === UK_VAT_PERCENT && r.country === "GB" && /vat/i.test(r.display_name));
  if (found) return (cachedRate = found.id);
  const created = await stripe.taxRates.create({
    display_name: "VAT",
    description: "UK VAT at 20%, added to event prices",
    percentage: UK_VAT_PERCENT,
    inclusive: false,
    country: "GB",
    jurisdiction: "GB",
    tax_type: "vat",
  });
  console.warn("[VAT] created a Stripe tax rate; set STRIPE_TAX_RATE_UK_VAT to keep using it", { id: created.id });
  return (cachedRate = created.id);
}

/** For tests. */
export function resetVatCache() {
  cachedRate = null;
}
