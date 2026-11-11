import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function routes(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) return routes(p);
    return f === "route.ts" ? [p] : [];
  });
}

const root = __dirname;
const rel = (f: string) => path.relative(root, f).split(path.sep).join("/");

/**
 * The middleware skips /api, so every route that serves signed-in professionals has to turn
 * consumers away itself. Routes listed here are public, signed by a provider, or deliberately
 * open to any signed-in account; adding a route anywhere else needs a consumer check.
 */
const OPEN = new Set([
  "auth/[...nextauth]/route.ts",
  "cron/[agent]/route.ts", // secret header
  "cron/emails/route.ts", // secret header
  "email/unsubscribe/route.ts", // signed link
  "events/[id]/ics/route.ts", // public calendar file
  "events/[id]/checkout/route.ts", // guest tickets are for anyone, members' prices check membership by email
  "events/visitor/route.ts", // reports only, membership checked by email
  "partners/[slug]/logo/route.ts",
  "partners/[slug]/view/route.ts",
  "perks/views/route.ts",
  "files/[id]/route.ts", // owner or staff only, and consumers own no files
  "webhooks/stripe/route.ts", // signed by Stripe
  "webhooks/stripe-connect/route.ts", // signed by Stripe
]);

const GUARDS = /professionalSession|getMemberContext|consumerSession|getStaff|isConsumer/;

describe("members-only API routes turn consumers away", () => {
  const all = routes(root).map(rel);
  it("finds the routes", () => expect(all.length).toBeGreaterThan(15));
  it.each(all.filter((r) => !OPEN.has(r)))("%s checks the account type", (r) => {
    expect(readFileSync(path.join(root, r), "utf8")).toMatch(GUARDS);
  });
  it("lists only routes that exist", () => {
    for (const r of OPEN) expect(all).toContain(r);
  });
});
