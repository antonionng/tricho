import "server-only";
import { prisma } from "@/lib/prisma";
import type { AdventDoor } from "@/content/advent";
import { deliverOnce } from "@/lib/mail/send";
import { adventDailyEmail } from "@/lib/mail/templates/advent";
import { everyoneRecipients, type MemberRecipient } from "@/lib/member-recipients";

/**
 * Everyone the 12 Days emails go to: every account in good standing, free or paid,
 * plus everyone who signed up for emails on the website. Each address once.
 * People who have left the "updates" list are skipped when sending.
 */
export async function adventRecipients(): Promise<MemberRecipient[]> {
  const [accounts, subscribers] = await Promise.all([
    everyoneRecipients(),
    prisma.subscriber.findMany({ where: { unsubscribedAt: null }, select: { email: true } }),
  ]);
  const all = new Map(accounts.map((r) => [r.email.toLowerCase(), r]));
  for (const s of subscribers) {
    const email = s.email.toLowerCase();
    if (!all.has(email)) all.set(email, { email, name: null });
  }
  return [...all.values()];
}

/** Sends one door's email to everyone, at most once per address. Returns how many were sent. */
export async function sendAdventDoor(door: AdventDoor, siteUrl: string, recipients?: MemberRecipient[]) {
  const list = recipients ?? (await adventRecipients());
  const paced = !!process.env.AUTH_RESEND_KEY;
  let sent = 0;
  for (const r of list) {
    const mail = adventDailyEmail({ name: r.name, door, siteUrl });
    const ref = `advent-2026:door-${door.day}:${r.email.toLowerCase()}`;
    if (await deliverOnce(ref, r.email, mail.subject, mail.content, { list: "updates", tag: `advent-door-${door.day}` })) sent++;
    if (paced) await new Promise((done) => setTimeout(done, 250));
  }
  return { sent, recipients: list.length };
}
