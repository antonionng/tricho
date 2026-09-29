import Stripe from "stripe";

let client: Stripe | null = null;

function getClient(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    client = new Stripe(key, {
      apiVersion: "2025-01-27.acacia" as Stripe.LatestApiVersion,
      appInfo: { name: "Trichollective", version: "0.1.0" },
    });
  }
  return client;
}

/**
 * Lazily-initialised Stripe client. Construction is deferred until first use so
 * the app can build and run pages that don't touch Stripe before keys are set.
 */
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const value = getClient()[prop as keyof Stripe];
    return typeof value === "function" ? value.bind(getClient()) : value;
  },
});
