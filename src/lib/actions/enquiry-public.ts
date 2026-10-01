"use server";

import { prisma } from "@/lib/prisma";
import { hasFullProfile } from "@/lib/directory";
import { deliver, deliverOnce } from "@/lib/mail/send";
import {
  enquiryHeldPractitionerEmail,
  enquiryHeldReceiptEmail,
  enquirySentEmail,
  enquiryToPractitionerEmail,
} from "@/lib/mail/templates/directory";

export type EnquiryState = { ok: boolean; message: string } | null;

/**
 * A member of the public contacting a listed professional. Full profiles
 * (paid, or within the 90-day trial) get the message straight away, with
 * replies going to the enquirer. Otherwise the enquiry is held until they
 * join: the professional is told at once that someone is trying to reach
 * them (ref "enquiry-held:{listingId}:{enquiryId}", which the Membership
 * agent checks so it never drafts a second email for the same enquiry).
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
    select: { id: true, kind: true, userId: true, name: true, email: true, freeUntil: true, slug: true },
  });
  if (!listing) return { ok: false, message: "This listing is no longer available." };

  // Delivered for paid listings and free listings in their 90-day trial; otherwise held until they join.
  const claimed = hasFullProfile(listing);
  const enquiry = await prisma.enquiry.create({
    data: { listingId: listing.id, name, email, message, status: claimed ? "forwarded" : "new" },
    select: { id: true },
  });

  const facts = { practitionerName: listing.name, enquirerName: name, enquirerEmail: email, message };
  if (claimed) {
    // Replies go straight to the enquirer; the practitioner's address is never shown to them.
    const toPractitioner = enquiryToPractitionerEmail(facts);
    const receipt = enquirySentEmail(facts);
    await Promise.all([
      deliver(listing.email, toPractitioner.subject, toPractitioner.content, { replyTo: email, tag: "enquiry" }),
      deliver(email, receipt.subject, receipt.content, { tag: "enquiry-receipt" }),
    ]);
  } else {
    // Held: the practitioner hears someone is waiting, without the enquirer's details or message.
    const held = enquiryHeldPractitionerEmail(listing);
    const receipt = enquiryHeldReceiptEmail(facts);
    await Promise.all([
      deliverOnce(`enquiry-held:${listing.id}:${enquiry.id}`, listing.email, held.subject, held.content, {
        tag: "enquiry-held",
      }),
      deliver(email, receipt.subject, receipt.content, { tag: "enquiry-receipt" }),
    ]);
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
