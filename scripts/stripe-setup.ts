/**
 * One-off Stripe setup for Trichollective. Run it yourself, with the key in your own terminal:
 *
 *   STRIPE_SECRET_KEY=sk_test_...  npx tsx scripts/stripe-setup.ts https://trichollective.com
 *   STRIPE_SECRET_KEY=sk_live_...  npx tsx scripts/stripe-setup.ts https://trichollective.com
 *
 * Organisation keys (sk_org_...) also need the account to act on:
 *   STRIPE_ACCOUNT=acct_... STRIPE_SECRET_KEY=sk_org_... npx tsx scripts/stripe-setup.ts https://...
 *
 * Safe to run more than once: products and prices are found by lookup key, and the
 * webhook is reused if it already exists. Prints the environment variables to add in Vercel.
 */
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
const siteUrl = process.argv[2];
if (!key || !siteUrl || !/^https:\/\//.test(siteUrl)) {
  console.error("Usage: STRIPE_SECRET_KEY=sk_... npx tsx scripts/stripe-setup.ts https://your-domain");
  process.exit(1);
}
const account = process.env.STRIPE_ACCOUNT;
if (key.startsWith("sk_org_") && !account) {
  console.error("This is an organisation key. Set STRIPE_ACCOUNT=acct_... for the account that should receive payments.");
  process.exit(1);
}

const stripe = new Stripe(key);
const opts: Stripe.RequestOptions = account ? { stripeContext: account } : {};
const mode = key.includes("_live_") ? "LIVE" : "TEST";

type PriceSpec = { env: string; lookup: string; amount: number; interval: "month" | "year"; nickname: string };
const PLANS: { product: string; description: string; prices: PriceSpec[] }[] = [
  {
    product: "Trichollective Community",
    description: "The Trichollective community, Trichozette, masterclasses and member prices.",
    prices: [
      { env: "STRIPE_PRICE_ID_COMMUNITY", lookup: "tc_community_month", amount: 900, interval: "month", nickname: "Community, monthly" },
      { env: "STRIPE_PRICE_ID_COMMUNITY_FOUNDING", lookup: "tc_community_founding_month", amount: 600, interval: "month", nickname: "Community, founding" },
      { env: "STRIPE_PRICE_ID_COMMUNITY_ANNUAL", lookup: "tc_community_year", amount: 9000, interval: "year", nickname: "Community, annual" },
    ],
  },
  {
    product: "Trichollective Professional",
    description: "Everything in Community, plus a full directory profile, enquiries, the Case Room, referrals and the Assistant.",
    prices: [
      { env: "STRIPE_PRICE_ID_PROFESSIONAL", lookup: "tc_professional_month", amount: 1900, interval: "month", nickname: "Professional, monthly" },
      { env: "STRIPE_PRICE_ID_PROFESSIONAL_FOUNDING", lookup: "tc_professional_founding_month", amount: 1400, interval: "month", nickname: "Professional, founding" },
      { env: "STRIPE_PRICE_ID_PROFESSIONAL_ANNUAL", lookup: "tc_professional_year", amount: 19000, interval: "year", nickname: "Professional, annual" },
    ],
  },
  {
    product: "Trichollective Business",
    description: "A business page, five Professional seats, job posts and member perks.",
    prices: [
      { env: "STRIPE_PRICE_ID_BUSINESS", lookup: "tc_business_month", amount: 9900, interval: "month", nickname: "Business, monthly" },
      { env: "STRIPE_PRICE_ID_BUSINESS_ANNUAL", lookup: "tc_business_year", amount: 99000, interval: "year", nickname: "Business, annual" },
    ],
  },
];

async function main() {
  console.log(`Setting up Stripe in ${mode} mode${account ? ` for ${account}` : ""}.\n`);
  const env: Record<string, string> = {};

  for (const plan of PLANS) {
    const existing = await stripe.prices.list({ lookup_keys: plan.prices.map((p) => p.lookup), expand: ["data.product"], limit: 20 }, opts);
    let productId = (existing.data[0]?.product as Stripe.Product | undefined)?.id;
    if (!productId) {
      const product = await stripe.products.create({ name: plan.product, description: plan.description }, opts);
      productId = product.id;
      console.log(`Created product ${plan.product}`);
    }
    for (const spec of plan.prices) {
      const found = existing.data.find((p) => p.lookup_key === spec.lookup);
      const price =
        found ??
        (await stripe.prices.create(
          {
            product: productId,
            currency: "gbp",
            unit_amount: spec.amount,
            recurring: { interval: spec.interval },
            lookup_key: spec.lookup,
            nickname: spec.nickname,
          },
          opts
        ));
      env[spec.env] = price.id;
      console.log(`${found ? "Found" : "Created"} ${spec.nickname}: £${(spec.amount / 100).toFixed(2)}/${spec.interval}`);
    }
  }

  const url = new URL("/api/webhooks/stripe", siteUrl).toString();
  const events: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
    "checkout.session.completed",
    "invoice.payment_succeeded",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ];
  const hooks = await stripe.webhookEndpoints.list({ limit: 100 }, opts);
  const hook = hooks.data.find((h) => h.url === url);
  if (hook) {
    console.log(`\nWebhook already exists for ${url}. Its signing secret is in the Stripe dashboard (Developers → Webhooks).`);
  } else {
    const created = await stripe.webhookEndpoints.create({ url, enabled_events: events, description: "Trichollective memberships" }, opts);
    env.STRIPE_WEBHOOK_SECRET = created.secret ?? "";
    console.log(`\nCreated webhook for ${url}.`);
  }

  console.log(`\nAdd these in Vercel → Settings → Environment Variables (Production), plus STRIPE_SECRET_KEY itself:\n`);
  for (const [k, v] of Object.entries(env)) console.log(`${k}=${v}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
