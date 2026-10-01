"use server";

import { prisma } from "@/lib/prisma";
import { hasFullProfile } from "@/lib/directory";
import { sendEmail } from "@/lib/email";

export type EnquiryState = { ok: boolean; message: string } | null;

/**
 * A member of the public contacting a listed professional. Claimed listings
 * are notified straight away; free listings hold the enquiry until claimed,
 * and the Membership agent emails the professional to say it's waiting.
 */
export async function sendEnquiry(_prev: EnquiryState, formData: FormData): Promise<EnquiryState> {
  const listingId = String(formData.get("listingId") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 160);
  const message = String(formData.get("message") ?? "").trim().slice(0, 2000);
  // Honeypot: real people never fill this in.
  if (String(formData.get("company") ?? "")) return { ok: true, message: "Thank you." };

  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) {
    return { ok: false, message: "Please add your name, a valid email and a short message." };
  }

  const listing = await prisma.directoryListing.findUnique({
    where: { id: listingId },
    select: { id: true, kind: true, userId: true, name: true, email: true, freeUntil: true },
  });
  if (!listing) return { ok: false, message: "This listing is no longer available." };

  // Delivered for paid listings and free listings in their 90-day trial; otherwise held until they join.
  const claimed = hasFullProfile(listing);
  await prisma.enquiry.create({
    data: { listingId: listing.id, name, email, message, status: claimed ? "forwarded" : "new" },
  });

  if (claimed) {
    await sendEmail({
      to: listing.email,
      subject: `New enquiry from ${name} via Trichollective`,
      text: [
        `Hello ${listing.name.split(" ")[0]},`,
        `${name} contacted you through your Trichollective directory listing:`,
        message,
        `You can reply to them directly at ${email}.`,
        `The Trichollective team`,
      ].join("\n\n"),
    }).catch((e) => console.error("[enquiry] email failed", e));
  }

  if (listing.kind === "member" && listing.userId) {
    await prisma.notification.create({
      data: {
        userId: listing.userId,
        kind: "enquiry",
        title: `New enquiry from ${name}`,
        href: "/members/profile#enquiries",
      },
    });
  }

  return {
    ok: true,
    message: claimed
      ? `Thank you. Your message has been sent to ${listing.name}, who will reply by email.`
      : `Thank you. We've let ${listing.name} know a message is waiting for them. If you need help sooner, the professionals marked "Full profile" usually reply fastest.`,
  };
}
