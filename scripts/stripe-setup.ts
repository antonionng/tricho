/**
 * One-off Stripe setup for Trichollective. Run it yourself, with the key in your own terminal:
 *
 *   STRIPE_SECRET_KEY=sk_test_...  npx tsx scripts/stripe-setup.ts
 *   STRIPE_SECRET_KEY=sk_live_...  npx tsx scripts/stripe-setup.ts
 *
 * Organisation keys (sk_org_...) also need the account to act on:
 *   STRIPE_ACCOUNT=acct_... STRIPE_SECRET_KEY=sk_org_... npx tsx scripts/stripe-setup.ts
 *
 * Safe to run more than once: products are found by name and prices by lookup key, so
 * nothing is created twice. Prices include VAT (tax_behavior "inclusive"), matching the
 * site. Prints the environment variables to add in Vercel.
 *
 * The webhook is not created here: it already exists in test and live mode, pointing at
 * https://www.trichollective.net/api/webhooks/stripe (the bare domain redirects, which Stripe won't follow).
 */
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Usage: STRIPE_SECRET_KEY=sk_... npx tsx scripts/stripe-setup.ts");
  process.exit(1);
}
const account = process.env.STRIPE_ACCOUNT;
if (key.startsWith("sk_org_") && !account) {
  console.error("This is an organisation key. Set STRIPE_ACCOUNT=acct_... for the account that should receive payments.");
  process.exit(1);
}

const stripe = new Stripe(key);
// stripe-node rejects an empty options object, so only pass one when acting on another account.
const opts: [Stripe.RequestOptions] | [] = account ? [{ stripeContext: account }] : [];
const mode = key.includes("_live_") ? "LIVE" : "TEST";

/** Amounts in pence and cents. */
type PriceSpec = { env: string; lookup: string; gbp: number; eur?: number; interval: "month" | "year"; nickname: string };
const PLANS: { product: string; description: string; prices: PriceSpec[] }[] = [
  {
    product: "Trichollective Community",
    description: "The Trichollective community, Trichozette, masterclasses and member prices.",
    prices: [
      { env: "STRIPE_PRICE_ID_COMMUNITY", lookup: "tc_community_month", gbp: 900, eur: 1000, interval: "month", nickname: "Community, monthly" },
      { env: "STRIPE_PRICE_ID_COMMUNITY_FOUNDING", lookup: "tc_community_founding_month", gbp: 600, eur: 700, interval: "month", nickname: "Community, founding" },
      { env: "STRIPE_PRICE_ID_COMMUNITY_ANNUAL", lookup: "tc_community_year", gbp: 9000, eur: 10000, interval: "year", nickname: "Community, annual" },
      { env: "STRIPE_PRICE_ID_COMMUNITY_FOUNDING_ANNUAL", lookup: "tc_community_founding_year", gbp: 6000, eur: 7000, interval: "year", nickname: "Community, founding annual" },
    ],
  },
  {
    product: "Trichollective Professional",
    description: "Everything in Community, plus a full directory profile, enquiries, the Case Room, referrals and the Assistant.",
    prices: [
      { env: "STRIPE_PRICE_ID_PROFESSIONAL", lookup: "tc_professional_month", gbp: 1900, eur: 2200, interval: "month", nickname: "Professional, monthly" },
      { env: "STRIPE_PRICE_ID_PROFESSIONAL_FOUNDING", lookup: "tc_professional_founding_month", gbp: 1400, eur: 1600, interval: "month", nickname: "Professional, founding" },
      { env: "STRIPE_PRICE_ID_PROFESSIONAL_ANNUAL", lookup: "tc_professional_year", gbp: 19000, eur: 22000, interval: "year", nickname: "Professional, annual" },
      { env: "STRIPE_PRICE_ID_PROFESSIONAL_FOUNDING_ANNUAL", lookup: "tc_professional_founding_year", gbp: 14000, eur: 16000, interval: "year", nickname: "Professional, founding annual" },
    ],
  },
  {
    product: "Trichollective Business",
    description: "A business page, five Professional seats, job posts and member perks.",
    prices: [
      { env: "STRIPE_PRICE_ID_BUSINESS", lookup: "tc_business_month", gbp: 9900, eur: 11500, interval: "month", nickname: "Business, monthly" },
      { env: "STRIPE_PRICE_ID_BUSINESS_ANNUAL", lookup: "tc_business_year", gbp: 99000, eur: 115000, interval: "year", nickname: "Business, annual" },
    ],
  },
  {
    // Sold online (yearly, pounds only). Karley can also invoice a brand from these prices in the Dashboard.
    product: "Trichollective Premium Business",
    description: "Everything in Business, plus education, editorial and conference placements with practitioners.",
    prices: [
      { env: "STRIPE_PRICE_ID_PREMIUM", lookup: "tc_premium_year", gbp: 350000, interval: "year", nickname: "Premium Business, annual" },
      { env: "STRIPE_PRICE_ID_PREMIUM_FOUNDING", lookup: "tc_premium_founding_year", gbp: 195000, interval: "year", nickname: "Premium Business, founding partner annual" },
    ],
  },
];

const money = (minor: number, symbol: string) => `${symbol}${(minor / 100).toLocaleString("en-GB")}`;

async function main() {
  console.log(`Setting up Stripe in ${mode} mode${account ? ` for ${account}` : ""}.\n`);
  const env: Record<string, string> = {};
  const products = await stripe.products.list({ active: true, limit: 100 }, ...opts);

  for (const plan of PLANS) {
    let productId = products.data.find((p) => p.name === plan.product)?.id;
    if (!productId) {
      const product = await stripe.products.create({ name: plan.product, description: plan.description }, ...opts);
      productId = product.id;
      console.log(`Created product ${plan.product}`);
    } else {
      console.log(`Found product ${plan.product}`);
    }

    const existing = await stripe.prices.list({ lookup_keys: plan.prices.map((p) => p.lookup), limit: 20 }, ...opts);
    for (const spec of plan.prices) {
      const found = existing.data.find((p) => p.lookup_key === spec.lookup);
      const price =
        found ??
        (await stripe.prices.create(
          {
            product: productId,
            currency: "gbp",
            unit_amount: spec.gbp,
            tax_behavior: "inclusive",
            ...(spec.eur ? { currency_options: { eur: { unit_amount: spec.eur, tax_behavior: "inclusive" } } } : {}),
            recurring: { interval: spec.interval },
            lookup_key: spec.lookup,
            nickname: spec.nickname,
          },
          ...opts
        ));
      env[spec.env] = price.id;
      const amounts = [money(spec.gbp, "£"), spec.eur ? money(spec.eur, "€") : null].filter(Boolean).join(" / ");
      console.log(`  ${found ? "Found" : "Created"} ${spec.nickname}: ${amounts} a ${spec.interval}`);
    }
  }

  console.log(`\nAdd these in Vercel → Settings → Environment Variables (Production), then redeploy:\n`);
  for (const [k, v] of Object.entries(env)) console.log(`${k}=${v}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
