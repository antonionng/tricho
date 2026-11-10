/**
 * Sets an event up with the Whittlebury exhibitor packages: Sponsor, Promote,
 * Elevate, Evolve and Elite, and extra places at £100 + VAT for every package
 * with places. Also marks the event's prices as excluding VAT and, when blank,
 * sets 20 stand spaces and 8 stage slots. Attendee tickets (early bird and
 * standard) are never created or changed; their prices are printed to check.
 * The same as Studio's "Add the standard packages" button.
 *
 * Dry run by default, and refuses a live database without --live:
 *   npx tsx scripts/whittlebury-packages.ts <eventId>                       # local database, dry run
 *   ENV_FILE=.env npx tsx scripts/whittlebury-packages.ts <eventId> --live  # live database, still a dry run
 *   ENV_FILE=.env npx tsx scripts/whittlebury-packages.ts <eventId> --live --apply
 *
 * Run it on production only after the migrations in this change are deployed.
 */
import { config } from "dotenv";
config({ path: process.env.ENV_FILE || ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { setupEventPackages } from "../src/lib/package-setup";

const eventId = process.argv.slice(2).find((a) => !a.startsWith("--"));
const apply = process.argv.includes("--apply");
if (!eventId) {
  console.error("Usage: npx tsx scripts/whittlebury-packages.ts <eventId> [--live] [--apply]");
  process.exit(1);
}
const url = (process.env.DATABASE_URL ?? "").replace(/([?&])sslmode=[^&]*/g, "$1").replace(/[?&]$/, "");
const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
if (!local && !process.argv.includes("--live")) {
  console.error("This points at a live database. Add --live if that's intended.");
  process.exit(1);
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false } }) });

const pounds = (p: number | null) => (p == null ? "none" : `£${(p / 100).toFixed(2)}`);

async function main() {
  console.log(`${apply ? "APPLYING" : "DRY RUN"} against ${local ? "local" : "REMOTE"} database\n`);
  const r = await setupEventPackages(prisma, eventId!, { apply });
  if ("error" in r) throw new Error(r.error);
  console.log(`${r.event.title} (${r.event.id})${r.event.published ? "" : ", not published"}`);
  console.log(r.changes.length ? r.changes.map((c) => `  - ${c}`).join("\n") : "  Nothing to change.");
  console.log("\nAttendee tickets, left as they are (expected: early bird £125 and standard £150 before VAT, members 10% off):");
  for (const t of r.ticketTypes) console.log(`  - ${t.name}: ${pounds(t.pricePence)}, members ${pounds(t.memberPricePence)}`);
  if (!apply) console.log("\nNothing was written. Add --apply to make these changes.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
