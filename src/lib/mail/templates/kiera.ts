import type { EmailSample } from "../catalogue";
import type { EmailContent } from "../layout";

/**
 * The Kiera SI offer: a dual-branded, picture-led email from
 * Trichollective, sent once to every account, free or paid. Sent by
 * scripts/send-kiera-offer.ts, never automatically.
 *
 * Feature images live in public/partners/kiera and are served from the live
 * site; the send script can attach them inline instead (cid:) so they show
 * even where remote images are blocked.
 */

export const KIERA = {
  name: "Kiera SI",
  url: "https://kierasi.com",
  previewUrl: "https://kierasi.com/preview",
  claimEmail: "ag@experrt.com",
};

/** Images referenced by the email, keyed by file name under public/partners/kiera. */
export const KIERA_IMAGES = {
  logo: { file: "logo.png", alt: "Kiera SI" },
  phone: { file: "phone-receptionist.gif", alt: "Kiera answering a call and booking it into the diary" },
  payByText: { file: "pay-by-text.gif", alt: "A payment link sent by text and paid on a phone" },
  till: { file: "till-card-reader.gif", alt: "Taking an in-person payment by QR code or card reader" },
  booking: { file: "booking-forms.gif", alt: "A client booking online and completing a consultation form" },
  team: { file: "team-management.gif", alt: "Team roles, diaries, time off and commission statements" },
  records: { file: "clinic-records.gif", alt: "A client record with history, notes and follow-ups" },
} as const;
export type KieraImageKey = keyof typeof KIERA_IMAGES;

export const KIERA_OFFER_REASON =
  "You receive this because you have a Trichollective account. Kiera SI is a Trichollective partner and this offer is for the Trichollective community.";

/** Published figures, each traceable to the source listed in the footer. None are Kiera results. */
const STATS = {
  heading: "What the figures say",
  items: [
    { value: "69%", label: "of callers who reach a small business's voicemail hang up without leaving a message." },
    { value: "1 in 3", label: "clients have never considered what a cancelled or missed appointment costs the business." },
    { value: "40% to 25%", label: "is how far no-shows fell in a clinic pilot once SMS reminders were introduced." },
  ],
  note: "Published industry figures, not Kiera results. Sources are at the foot of this email.",
};

const SOURCES = [
  { label: "Moneypenny small business call report", url: "https://moneypenny.com/us/resources/news/small-business-call-report/" },
  { label: "Professional Beauty, Treatwell survey", url: "https://professionalbeauty.co.uk/beauty-appointment-cancellations-income-loss-survey" },
  { label: "BMJ Open Quality, 2022", url: "https://bmjopenquality.bmj.com/content/11/3/e001805" },
];

const FEATURES: { title: string; text: string; image: KieraImageKey }[] = [
  { title: "Kiera answers your phone", text: "She picks up when you are with a client, answers with the information you approved, books into your diary and hands over when it needs you.", image: "phone" },
  { title: "Get paid by text", text: "Send a payment link by SMS during or after a call. Deposits and balances land in your own Stripe account.", image: "payByText" },
  { title: "A till for the clinic", text: "Take in-person payments by QR code or Stripe card reader, with tips shared out to the team.", image: "till" },
  { title: "Online booking with consultation forms", text: "Clients book into your real diary and receive the right pre-consultation form for the service before they arrive.", image: "booking" },
  { title: "Your team, managed", text: "Every team member gets a sign-in, role and diary, with time off, performance and commission statements.", image: "team" },
  { title: "Every client, remembered", text: "History, preferences, conversations and follow-ups in one record, and Kiera's Brain answers in your words using only what you approve.", image: "records" },
];

/** The address an image is loaded from. The send script swaps these for cid: references when attaching inline. */
export function kieraImageSrc(key: KieraImageKey) {
  return `/partners/kiera/${KIERA_IMAGES[key].file}`;
}

export function kieraOfferEmail(name?: string | null, src: (key: KieraImageKey) => string = kieraImageSrc): { subject: string; content: EmailContent } {
  const first = name?.trim().split(/\s+/)[0];
  const hello = first ? `Hi ${first},` : "Hello,";
  const claim = `mailto:${KIERA.claimEmail}?subject=${encodeURIComponent("Kiera SI Trichollective offer")}`;
  return {
    subject: "Kiera SI for Trichollective: 20% off a year, setup included",
    content: {
      preheader: "A super intelligence front desk that answers your phone, takes payments and remembers every client. Trichollective gets 20% off a year.",
      eyebrow: "A Trichollective offer",
      heading: "Kiera SI runs your front desk, so your clinic keeps the appointments it would otherwise lose.",
      body: [
        hello,
        "Kiera SI is the super intelligence front desk built by Antonio, Trichollective's co-founder, with trichology clinics in mind. Here is what she does, in pictures.",
      ].join("\n\n"),
      features: FEATURES.map((f) => ({ title: f.title, text: f.text, image: { src: src(f.image), alt: KIERA_IMAGES[f.image].alt } })),
      stats: STATS,
      factsHeading: "Your Trichollective offer",
      facts: [
        ["20% off", `Sign up for a year and pay 20% less: Essential at £79.20 a month instead of £99, or Growth at £119.20 instead of £149.`],
        ["Free setup", "We build your services, team, business knowledge and booking page with you."],
        ["To claim", `Email ${KIERA.claimEmail} and say you came from Trichollective.`],
      ],
      cta: { label: "Email to claim your offer", href: claim },
      secondary: { label: "Explore the fictional clinic workspace first", href: KIERA.previewUrl },
      cobrand: { name: KIERA.name, logoUrl: src("logo"), url: KIERA.url },
      sources: SOURCES,
      reason: KIERA_OFFER_REASON,
    },
  };
}

const sample = kieraOfferEmail("Alex Morgan");
export const samples: EmailSample[] = [
  {
    id: "kiera-member-offer",
    name: "Kiera SI offer",
    trigger: "Sent once, by hand, to every account when the Kiera SI offer is launched.",
    audience: "everyone",
    subject: sample.subject,
    content: sample.content,
  },
];
