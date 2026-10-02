"use server";

import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { alertOwners, deliver } from "@/lib/mail/send";
import {
  CONTACT_TOPICS,
  contactAcknowledgementEmail,
  contactAlert,
  type ContactMessage,
} from "@/lib/mail/templates/leads";
import { shortName } from "@/lib/names";

export type ContactState =
  | { ok: true; message: string }
  | { ok: false; message: string; fields?: Record<string, string> }
  | null;

function field(formData: FormData, name: string, max: number) {
  return String(formData.get(name) ?? "").trim().slice(0, max);
}

/**
 * The /contact form. Stored as a Draft so it lands in the Studio inbox, then
 * the owners are alerted (replies go straight to the sender) and the sender
 * gets an acknowledgement.
 */
export async function sendContactMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // Honeypot: real people never fill this in.
  if (field(formData, "company_site", 200)) {
    return { ok: true, message: "Thank you. We'll be in touch." };
  }

  const name = field(formData, "name", 120);
  const email = field(formData, "email", 160).toLowerCase();
  const topicRaw = field(formData, "topic", 60);
  const message = field(formData, "message", 5000);
  const fields = { name, email, topic: topicRaw, message };

  if (!name) return { ok: false, message: "Please tell us your name.", fields };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, message: "Please check your email address.", fields };
  }
  if (!(CONTACT_TOPICS as readonly string[]).includes(topicRaw)) {
    return { ok: false, message: "Please choose what your message is about.", fields };
  }
  if (message.length < 10) {
    return { ok: false, message: "Please add a few words so we know how to help.", fields };
  }

  const contact: ContactMessage = { name, email, topic: topicRaw, message };

  let draftId: string;
  try {
    const draft = await prisma.draft.create({
      data: {
        agent: "website",
        kind: "contact",
        title: `${topicRaw}: ${name}`,
        summary: `${name} · ${email}`,
        body: message,
        payload: { name, email, topic: topicRaw, message },
      },
      select: { id: true },
    });
    draftId = draft.id;
  } catch (error) {
    console.error("[CONTACT]", error);
    return {
      ok: false,
      message: "Something went wrong sending your message. Please try again in a moment.",
      fields,
    };
  }

  after(async () => {
    const { subject, content } = contactAcknowledgementEmail(contact);
    await Promise.all([
      alertOwners(contactAlert(contact, draftId)),
      deliver(email, subject, content, { tag: "contact" }),
    ]);
  });

  return {
    ok: true,
    message: `Thank you, ${shortName(name, "you")}. We've received your message and a real person will reply within two working days. A copy is on its way to your inbox.`,
  };
}
