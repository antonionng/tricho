import { prisma } from "@/lib/prisma";
import { deliverOnce } from "@/lib/mail/send";
import { enquiryUpdateEmail, type EnquiryUpdate } from "@/lib/mail/templates/consumers";

/**
 * Tells consumers that enquiries they sent while signed in have moved on. Visitors who
 * weren't signed in never get these, and each enquiry is emailed at most once per change.
 * Never throws, so it can't break the payment or Studio action that changed the status.
 */
export async function emailEnquiryUpdates(enquiryIds: string[], update: EnquiryUpdate) {
  if (!enquiryIds.length) return 0;
  try {
    const rows = await prisma.enquiry.findMany({
      where: { id: { in: enquiryIds }, user: { accountType: "consumer", accessStatus: "active", email: { not: null } } },
      select: { id: true, listing: { select: { name: true } }, user: { select: { name: true, email: true } } },
    });
    let sent = 0;
    for (const e of rows) {
      const to = e.user?.email;
      if (!to) continue;
      const { subject, content } = enquiryUpdateEmail({ name: e.user?.name ?? null, professional: e.listing.name, update });
      if (await deliverOnce(`enquiry-update:${e.id}:${update}`, to, subject, content, { list: "activity", tag: "consumer-enquiry" })) sent++;
    }
    return sent;
  } catch (error) {
    console.error("[consumer-mail] enquiry updates failed", error);
    return 0;
  }
}

/** Consumers who opted in to news: the only people the monthly hub digest goes to. */
export async function consumerDigestRecipients() {
  const rows = await prisma.user.findMany({
    where: {
      accountType: "consumer",
      accessStatus: "active",
      emailUpdates: true,
      email: { not: null },
      consumerProfile: { marketingConsentAt: { not: null } },
    },
    select: { email: true },
  });
  return [...new Set(rows.map((r) => r.email!.trim().toLowerCase()).filter((e) => e.includes("@") && !e.endsWith(".local")))];
}
