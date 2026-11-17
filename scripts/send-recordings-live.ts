/**
 * Tells everyone that the masterclass and case round recordings are on the platform
 * (src/lib/mail/templates/recordings.ts). Members get the link to watch; free accounts are
 * told membership is how to watch.
 *   ENV_FILE=.env NEXT_PUBLIC_SITE_URL=https://www.trichollective.net npx tsx scripts/send-recordings-live.ts --to you@example.com [--as-free | --as-member]
 *   ENV_FILE=.env NEXT_PUBLIC_SITE_URL=https://www.trichollective.net npx tsx scripts/send-recordings-live.ts --everyone          # dry run
 *   ENV_FILE=.env NEXT_PUBLIC_SITE_URL=https://www.trichollective.net npx tsx scripts/send-recordings-live.ts --everyone --send   # sends
 *
 * Each address is sent to at most once per campaign (EmailLog ref "recordings-live-<campaign>:<email>"),
 * so running it twice never repeats a send. Anyone who has left the "updates" list is skipped, and every
 * email carries an unsubscribe link.
 */
import { config } from "dotenv";
config({ path: process.env.ENV_FILE || ".env.local" });

const args = process.argv.slice(2);
const to = args.indexOf("--to") >= 0 ? args[args.indexOf("--to") + 1] : null;
const everyone = args.includes("--everyone");
const send = args.includes("--send");
const asFree = args.includes("--as-free");
const asMember = args.includes("--as-member");
const campaign = args.indexOf("--campaign") >= 0 ? args[args.indexOf("--campaign") + 1] : "2026-11";

async function main() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) throw new Error("Set NEXT_PUBLIC_SITE_URL so links point at the live site, not localhost.");
  const { deliver, deliverOnce } = await import("../src/lib/mail/send");
  const { recordingsLiveEmail } = await import("../src/lib/mail/templates/recordings");
  const { listRecordings, nextLiveSession } = await import("../src/lib/recordings");
  const { activeMemberRecipients, everyoneRecipients } = await import("../src/lib/member-recipients");

  const recordings = (await listRecordings(12)).map((r) => ({ ...r, href: `${siteUrl}/events/${r.slug}` }));
  if (recordings.length === 0) throw new Error("No published past event has a recording yet, so there is nothing to announce.");
  console.log(`${recordings.length} recording(s): ${recordings.map((r) => r.title).join("; ")}`);
  const upcoming = await nextLiveSession();
  const next = upcoming ? { ...upcoming, href: `${siteUrl}/events/${upcoming.slug}` } : null;
  console.log(next ? `Next live session: ${next.title} (${next.startsAt.toISOString()})` : "No upcoming live session is published, so the email will not promote one.");

  const members = new Set((await activeMemberRecipients()).map((m) => m.email.toLowerCase()));
  const opts = { list: "updates" as const };

  if (to) {
    const { prisma } = await import("../src/lib/prisma");
    const email = to.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email }, select: { name: true } });
    const member = asFree ? false : asMember ? true : members.has(email);
    const mail = recordingsLiveEmail(user?.name, { member, recordings, next, siteUrl });
    const ok = await deliver(to, `[Preview] ${mail.subject}`, mail.content, { ...opts, tag: "recordings-live-preview" });
    console.log(ok ? `Sent the ${member ? "member" : "free account"} preview to ${to}` : `Not sent to ${to} (left the updates list, or sending failed)`);
    return;
  }

  if (everyone) {
    const recipients = await everyoneRecipients();
    const memberCount = recipients.filter((r) => members.has(r.email.toLowerCase())).length;
    console.log(`${recipients.length} accounts in good standing: ${memberCount} members, ${recipients.length - memberCount} free`);
    if (!send) {
      for (const r of recipients) console.log(`  ${members.has(r.email.toLowerCase()) ? "member" : "free  "}  ${r.email}${r.name ? `  (${r.name})` : ""}`);
      console.log("\nDry run. Add --send to send.");
      return;
    }
    let sent = 0;
    for (const r of recipients) {
      const member = members.has(r.email.toLowerCase());
      const mail = recordingsLiveEmail(r.name, { member, recordings, next, siteUrl });
      const ref = `recordings-live-${campaign}:${r.email.toLowerCase()}`;
      if (await deliverOnce(ref, r.email, mail.subject, mail.content, { ...opts, tag: member ? "recordings-live-member" : "recordings-live-free" })) sent++;
      else console.log(`  skipped ${r.email} (already sent, left the list, or sending failed)`);
    }
    console.log(`Sent ${sent} of ${recipients.length}`);
    return;
  }

  console.log("Usage: --to someone@example.com [--as-free | --as-member] | --everyone [--send] [--campaign 2026-11]");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => setTimeout(() => process.exit(), 500));
