import { HUB_LABEL, HUB_PATH } from "@/config/consumer";
import type { HubFeedItem } from "@/lib/hub-feed";
import type { EmailSample } from "../catalogue";
import { absoluteUrl, type EmailContent } from "../layout";
import { firstNameOf } from "./directory";

type Email = { subject: string; content: EmailContent };

const hub = HUB_LABEL.toLowerCase();

/** Changes to an enquiry that the person who sent it is told about. */
export type EnquiryUpdate = "delivered" | "closed";

/**
 * Sent to a consumer whose enquiry moved on: a held message reached the professional,
 * or the team closed it. It is on the "activity" list, so it stops when they untick it.
 */
export function enquiryUpdateEmail(e: { name: string | null; professional: string; update: EnquiryUpdate }): Email {
  const hello = `Hello ${firstNameOf(e.name)},`;
  if (e.update === "delivered") {
    return {
      subject: `Your message has reached ${e.professional}`,
      content: {
        preheader: `${e.professional} can now read your enquiry and reply to you by email.`,
        eyebrow: "Your enquiry",
        heading: `Your message has now reached ${e.professional}.`,
        body: [
          hello,
          `We were holding your enquiry until ${e.professional} joined Trichollective. They have now joined, so we have sent your message on, and their reply will come straight to this email address.`,
          "If your hair or scalp concern is urgent or you feel unwell, please speak to your GP or pharmacist.",
        ].join("\n\n"),
        cta: { label: "See your enquiries", href: `${HUB_PATH}/enquiries` },
        reason: `You receive this because you sent an enquiry while signed in to ${hub}. You can turn these emails off in your settings.`,
      },
    };
  }
  return {
    subject: `Your enquiry to ${e.professional} has been closed`,
    content: {
      preheader: "You can send a new enquiry from their profile, or find another professional near you.",
      eyebrow: "Your enquiry",
      heading: `Your enquiry to ${e.professional} has been closed.`,
      body: [
        hello,
        `Our team has closed the enquiry you sent to ${e.professional}. This usually means it has been answered, or that they are not able to take it on.`,
        "If you still need help, you can send them a new message from their profile at any time, or find another professional in the directory.",
      ].join("\n\n"),
      cta: { label: "Find a professional", href: "/directory" },
      secondary: { label: "See your enquiries", href: `${HUB_PATH}/enquiries` },
      reason: `You receive this because you sent an enquiry while signed in to ${hub}. You can turn these emails off in your settings.`,
    },
  };
}

const KIND_WORD: Record<HubFeedItem["kind"], string> = { article: "Article", guide: "Guide", piece: "From our team" };

/** The digest's body, built only from what was published for the public, so nothing needs inventing. */
export function consumerDigestBody(items: HubFeedItem[], month: string) {
  const parts = [
    "Hello,",
    `Here is what is new in ${hub} for ${month}: reading written for the public and checked by our editorial team.`,
  ];
  if (items.length) {
    parts.push("## New to read", items.map((i) => `- ${KIND_WORD[i.kind]}: ${i.title}. ${i.summary} ${absoluteUrl(i.href)}`).join("\n"));
  } else {
    parts.push("There is nothing new to read this month. Add a note here, or publish a public article first and run the digest again.");
  }
  parts.push(
    "## Looking for help?",
    "The directory lists hair and scalp professionals near you, and you can save the ones you like to come back to.",
    "None of this is medical advice. If you are worried about your hair, your scalp or your health, please speak to your GP or pharmacist."
  );
  return parts.join("\n\n");
}

/** The monthly digest for consumers who opted in to news. It only goes out once Karley approves it. */
export function consumerDigestEmail(draft: { title: string; body: string }, payload: Record<string, unknown>): Email {
  const subject = typeof payload.subject === "string" && payload.subject.trim() ? payload.subject.trim() : draft.title;
  return {
    subject,
    content: {
      preheader: "New reading for the public from Trichollective, and how to find a professional near you.",
      eyebrow: HUB_LABEL,
      heading: subject,
      body: draft.body,
      cta: { label: `Open ${hub}`, href: HUB_PATH },
      secondary: { label: "Find a professional", href: "/directory" },
      reason: `You receive this because you asked for news in ${hub} on Trichollective.`,
    },
  };
}

function sample(id: string, name: string, trigger: string, e: Email): EmailSample {
  return { id, name, trigger, audience: "public", subject: e.subject, content: e.content };
}

const sampleItems: HubFeedItem[] = [
  { kind: "guide", title: "Shedding after illness or stress", summary: "Why it happens, how long it lasts and when to see someone.", href: "/guides/shedding", date: "2026-10-20" },
  { kind: "article", title: "What happens at a scalp consultation", summary: "What a trichologist will ask, look at and suggest.", href: "/blog/scalp-consultation", date: "2026-10-12" },
];

export const samples: EmailSample[] = [
  sample("consumer-enquiry-delivered", "Enquiry delivered", "Sent to a consumer when an enquiry we were holding reaches the professional.", enquiryUpdateEmail({ name: "Aoife", professional: "Niamh Walsh", update: "delivered" })),
  sample("consumer-enquiry-closed", "Enquiry closed", "Sent to a consumer when the team closes an enquiry they sent while signed in.", enquiryUpdateEmail({ name: "Aoife", professional: "Niamh Walsh", update: "closed" })),
  sample(
    "consumer-digest",
    "Monthly hub digest",
    "Sent once a month to consumers who opted in to news, after Karley approves it in the inbox.",
    consumerDigestEmail({ title: `New in ${hub}: October 2026`, body: consumerDigestBody(sampleItems, "October 2026") }, {})
  ),
];
