/**
 * Tidies existing live data after the schema catch-up. Dry run by default:
 *   npx tsx scripts/go-live-backfill.ts                       # local database, shows what would change
 *   ENV_FILE=.env npx tsx scripts/go-live-backfill.ts --live  # live database, still a dry run
 *   ENV_FILE=.env npx tsx scripts/go-live-backfill.ts --live --apply
 *
 * 1. Gives every existing directory listing a readable slug (so it gets a profile page).
 * 2. Starts the 90-day free period for existing free listings from launch day.
 * 3. Sets `plan` for existing subscribers from their Stripe price.
 */
import { config } from "dotenv";
config({ path: process.env.ENV_FILE || ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { tierByPriceId, FREE_LISTING_DAYS } from "../src/config/subscriptions";
import { site } from "../src/config/site";

const apply = process.argv.includes("--apply");
const url = (process.env.DATABASE_URL ?? "").replace(/([?&])sslmode=[^&]*/g, "$1").replace(/[?&]$/, "");
const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
if (!local && !process.argv.includes("--live")) {
  console.error("This points at a live database. Add --live if that's intended.");
  process.exit(1);
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false } }) });

function slugify(s: string) {
  return s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

async function main() {
  console.log(`${apply ? "APPLYING" : "DRY RUN"} against ${local ? "local" : "REMOTE"} database\n`);
  const launch = new Date(site.launch.startsAt);
  const freeUntil = new Date(launch.getTime() + FREE_LISTING_DAYS * 24 * 60 * 60 * 1000);

  const taken = new Set((await prisma.directoryListing.findMany({ where: { slug: { not: null } }, select: { slug: true } })).map((l) => l.slug!));
  const listings = await prisma.directoryListing.findMany({ where: { OR: [{ slug: null }, { freeUntil: null, kind: "listed" }] } });
  for (const l of listings) {
    const data: { slug?: string; freeUntil?: Date } = {};
    if (!l.slug) {
      const base = slugify(`${l.name} ${l.city}`) || "listing";
      let slug = base;
      for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
      taken.add(slug);
      data.slug = slug;
    }
    if (l.kind === "listed" && !l.freeUntil && l.status === "listed") data.freeUntil = freeUntil;
    if (!Object.keys(data).length) continue;
    console.log(`listing ${l.name} (${l.city}):`, data);
    if (apply) await prisma.directoryListing.update({ where: { id: l.id }, data });
  }

  const subscribers = await prisma.user.findMany({ where: { plan: null, stripePriceId: { not: null } } });
  for (const u of subscribers) {
    const tier = tierByPriceId(u.stripePriceId);
    if (!tier) {
      console.log(`user ${u.email}: price ${u.stripePriceId} doesn't match a plan; set STRIPE_PRICE_ID_* first`);
      continue;
    }
    console.log(`user ${u.email}: plan → ${tier.id}`);
    if (apply) await prisma.user.update({ where: { id: u.id }, data: { plan: tier.id } });
  }
  console.log(apply ? "\nDone." : "\nNothing changed. Run again with --apply to make these changes.");
}

main().finally(() => prisma.$disconnect());
