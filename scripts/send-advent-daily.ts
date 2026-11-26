/**
 * The 12 Days of Christmas emails (src/lib/mail/templates/advent.ts).
 *   ENV_FILE=.env NEXT_PUBLIC_SITE_URL=https://www.trichollective.net npx tsx scripts/send-advent-daily.ts --door 2 --to you@example.com   # preview one door
 *   ... --launch --to you@example.com        # preview the "starts on 12 December" email
 *   ... --door 2 --everyone                  # dry run: counts recipients
 *   ... --door 2 --everyone --send           # sends door 2 to every account and subscriber
 *   ... --launch --everyone --send           # sends the launch email
 * Without --door it uses the door that opens today (UK time).
 *
 * From 12 December the cron at /api/cron/advent sends each morning's door by itself once
 * ADVENT_EMAILS=on is set in Vercel; this script is for previews, the launch email and resends.
 * Each address gets each email at most once, and anyone who has left the "updates" list is skipped.
 */
import { config } from "dotenv";
config({ path: process.env.ENV_FILE || ".env.local" });

const args = process.argv.slice(2);
const arg = (name: string) => (args.indexOf(name) >= 0 ? args[args.indexOf(name) + 1] : null);
const to = arg("--to");
const launch = args.includes("--launch");
const everyone = args.includes("--everyone");
const send = args.includes("--send");

async function main() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!siteUrl) throw new Error("Set NEXT_PUBLIC_SITE_URL so links point at the live site, not localhost.");
  const { prisma } = await import("../src/lib/prisma");
  const { deliver, deliverOnce } = await import("../src/lib/mail/send");
  const { adventDailyEmail, adventLaunchEmail } = await import("../src/lib/mail/templates/advent");
  const { adventDoor } = await import("../src/content/advent");
  const { todaysDoor } = await import("../src/lib/advent");
  const { adventRecipients, sendAdventDoor } = await import("../src/lib/advent-send");

  const door = launch ? null : arg("--door") ? adventDoor(Number(arg("--door"))) : todaysDoor();
  if (!launch && !door) throw new Error("No door opens today. Pass --door <1-12> or --launch.");
  const build = (name: string | null) => (door ? adventDailyEmail({ name, door, siteUrl }) : adventLaunchEmail({ name, siteUrl }));
  console.log(door ? `Door ${door.day}: ${door.title}` : "Launch email");

  if (to) {
    const user = await prisma.user.findUnique({ where: { email: to.toLowerCase() }, select: { name: true } });
    const mail = build(user?.name ?? null);
    const ok = await deliver(to, `[Preview] ${mail.subject}`, mail.content, { tag: "advent-preview" });
    console.log(ok ? `Sent the preview to ${to}` : `Not sent to ${to}`);
    return;
  }

  if (everyone) {
    const recipients = await adventRecipients();
    console.log(`${recipients.length} accounts and subscribers`);
    if (!send) {
      console.log("Dry run. Add --send to send.");
      return;
    }
    if (door) {
      const result = await sendAdventDoor(door, siteUrl, recipients);
      console.log(`Sent ${result.sent} of ${result.recipients}`);
      return;
    }
    const paced = !!process.env.AUTH_RESEND_KEY;
    let sent = 0;
    for (const r of recipients) {
      const mail = build(r.name);
      if (await deliverOnce(`advent-2026:launch:${r.email.toLowerCase()}`, r.email, mail.subject, mail.content, { list: "updates", tag: "advent-launch" })) sent++;
      if (paced) await new Promise((done) => setTimeout(done, 250));
    }
    console.log(`Sent ${sent} of ${recipients.length}`);
    return;
  }

  console.log("Usage: [--door <1-12> | --launch] (--to someone@example.com | --everyone [--send])");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => setTimeout(() => process.exit(), 500));
