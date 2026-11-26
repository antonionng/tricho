/**
 * The Trichollective 12 Days of Christmas: one gift a day from Saturday 12 to
 * Wednesday 23 December 2026.
 *
 * Door n opens at midnight UK time on (12 December + n - 1). Brand doors carry an
 * offer a partner has agreed in writing; every other door is something from
 * Trichollective itself. To add a brand that says yes later, replace one of the
 * doors marked `reserved` with a `brand` door. Never name a brand here before they
 * have agreed: this file ships in the page source.
 */

export type AdventBrand = {
  name: string;
  /** Their logo. Shown on a light chip, so a dark-on-light file reads best. */
  logoUrl?: string;
  /** Set to "dark" when the logo is pale and needs a dark chip behind it. */
  logoOn?: "light" | "dark";
  /** The brand colour, "#rrggbb", used behind the open door. */
  accent: string;
  website: string;
  instagram?: string;
  /** A Trichollective partner page, if they have one. */
  partnerSlug?: string;
};

export type AdventDoor = {
  /** The door number, 1 to 12. */
  day: number;
  /** "brand": a partner's offer. "charity": a cause we support. "trichollective": from us. */
  kind: "brand" | "charity" | "trichollective";
  /** Kept free for a brand still deciding; shows the Trichollective content until it is swapped. */
  reserved?: boolean;
  /** The short line on the open door, e.g. "30% off". */
  headline: string;
  title: string;
  body: string;
  brand?: AdventBrand;
  /** The code to quote. Only shown to people who are signed in. */
  code?: string;
  /** How to use the code. */
  redeem?: string;
  terms?: string;
  cta: { label: string; href: string };
};

export const ADVENT_NAME = "12 Days of Christmas";
/** The first door opens on this day (UK time). */
export const ADVENT_START = "2026-12-12";
export const ADVENT_DAYS = 12;

// Logos are linked from their own sites until they send us copies.
const SECRET_HAIR: AdventBrand = {
  name: "Secret Hair Solutions",
  logoUrl: "https://ul2.secrethairshop.com/LOGO-Secret.png",
  accent: "#29382F",
  website: "https://secrethairshop.com",
};

const PRP_PURE: AdventBrand = {
  name: "PRP Pure",
  logoUrl: "https://prppure.com/cdn/shop/t/10/assets/prp-logo-vector.svg",
  logoOn: "dark",
  accent: "#3A0D0D",
  website: "https://prppure.com",
  instagram: "prppure",
};

const KIERA: AdventBrand = {
  name: "Kiera SI",
  logoUrl: "/partners/kiera/logo.png",
  accent: "#1A1A1A",
  website: "https://kierasi.com",
};

const LITTLE_LADY_LOCKS: AdventBrand = {
  name: "Little Lady Locks",
  accent: "#D4007A",
  website: "https://www.littleladylocks.com",
  instagram: "littleladylocks",
  partnerSlug: "little-lady-locks",
};

export const ADVENT_DOORS: AdventDoor[] = [
  {
    day: 1,
    kind: "trichollective",
    headline: "Welcome",
    title: "Twelve days of gifts for the people who look after hair and scalps.",
    body: "Every morning until 23 December, a new door opens with an offer from a brand we trust, something to learn or a little help for the year ahead. Come back each day, because every door has something different behind it.",
    cta: { label: "Read Trichozette", href: "/trichozette" },
  },
  {
    day: 2,
    kind: "brand",
    headline: "30% off",
    title: "Save 30% on hair toppers and wigs, with a free hair care kit.",
    body: "Secret Hair Solutions is giving our community 30% off all NORDISK Volume Tops, hair toppers and wigs on your next order. Every order also comes with a complimentary hair care kit, including a Nordic bio brush.",
    brand: SECRET_HAIR,
    code: "CHRISTMAS-30",
    redeem: "Enter the code at checkout on the Secret Hair Solutions website.",
    terms: "Valid on your next order, up to and including 20 January 2027.",
    cta: { label: "Shop Secret Hair Solutions", href: "https://secrethairshop.com" },
  },
  {
    day: 3,
    kind: "charity",
    headline: "Give",
    title: "Help Little Lady Locks give a child their hair back this Christmas.",
    body: "Little Lady Locks provides free hair systems, wigs and confidence classes to children under 18 who have lost their hair. They receive no government funding, so every donation, ponytail and shared post goes straight into the next fitting.",
    brand: LITTLE_LADY_LOCKS,
    cta: { label: "How to support Little Lady Locks", href: "/partners/little-lady-locks" },
  },
  {
    day: 4,
    kind: "brand",
    headline: "10% off training",
    title: "Save 10% on PRP or microneedling training with PRP Pure.",
    body: "PRP Pure trains practitioners in platelet-rich plasma and microneedling, and supplies UK-made PRP kits and centrifuges. Quote the code when you contact them to book and the discount comes off your course.",
    brand: PRP_PURE,
    code: "Tticho10",
    redeem: "Contact PRP Pure directly and quote the code when you book.",
    terms: "Applies to PRP or microneedling training booked directly with PRP Pure.",
    cta: { label: "Visit PRP Pure", href: "https://prppure.com" },
  },
  {
    day: 5,
    kind: "trichollective",
    reserved: true,
    headline: "Watch",
    title: "Catch up on a masterclass you missed, with a cup of tea.",
    body: "Every live masterclass and case round is recorded for members on Trichollective TV, including December's session on pricing and presenting scalp services. Pick the one you have been meaning to get to.",
    cta: { label: "Open Trichollective TV", href: "/tv" },
  },
  {
    day: 6,
    kind: "trichollective",
    headline: "Front desk",
    title: "Put one gift on the front desk that the buyer can explain in a sentence.",
    body: "A Head Spa or scalp consultation voucher works well when the length, what is included and how to book are written on it. For someone experiencing hair loss, a general voucher lets them choose what to book, in their own time.",
    cta: { label: "Read Karley's Christmas column", href: "/trichozette" },
  },
  {
    day: 7,
    kind: "brand",
    headline: "2 months free",
    title: "Let Kiera SI answer the phone while you are with a client.",
    body: "Kiera SI is a super intelligence front desk for salons and clinics. It answers calls, books appointments, sends payment links and reminders, and remembers every client conversation. Sign up for a year and Trichollective members get two months free, with setup done for you.",
    brand: KIERA,
    redeem: "Email ag@experrt.com and say you came from the Trichollective 12 Days of Christmas. Two months free saves £198 on Essential (£99 a month) or £298 on Growth (£149 a month).",
    terms: "Two months free when you sign up for a year. Setup of your services, team and booking page is included.",
    cta: { label: "Explore Kiera SI", href: "https://kierasi.com" },
  },
  {
    day: 8,
    kind: "trichollective",
    reserved: true,
    headline: "Learn",
    title: "Earn CPD over the holidays at your own pace.",
    body: "Our courses are written by practitioners for people who work with hair and scalp, and each one comes with a certificate you can show clients. Start one this weekend and finish it before the new year.",
    cta: { label: "Browse courses", href: "/courses" },
  },
  {
    day: 9,
    kind: "trichollective",
    reserved: true,
    headline: "Share",
    title: "Give clients a free guide they can read at home over Christmas.",
    body: "Our guides explain shedding, scalp care and when to see someone in language you can hand straight to a client. Send one after an appointment so they remember what you talked about.",
    cta: { label: "Browse the guides", href: "/guides" },
  },
  {
    day: 10,
    kind: "trichollective",
    headline: "Bring a friend",
    title: "Invite a colleague who would love being part of Trichollective.",
    body: "The people who get the most from Trichollective are the ones who bring their colleagues with them. Share your link with someone you trust and you will both be rewarded when they join.",
    cta: { label: "Invite a colleague", href: "/members/refer" },
  },
  {
    day: 11,
    kind: "trichollective",
    headline: "2027",
    title: "Save your place at Trichollective UK on 26 April 2027.",
    body: "A day at Whittlebury Hall with salon professionals, trichologists and medical practitioners. Come with a question you have been wanting to ask, or a conversation you would love to have with someone outside your own area of work.",
    cta: { label: "Get your ticket", href: "/events/trichollective-uk-2027" },
  },
  {
    day: 12,
    kind: "trichollective",
    headline: "Thank you",
    title: "Thank you for everything you have done for your clients this year.",
    body: "Whether you sat with someone through their first appointment about hair loss or simply listened when they needed it, it mattered. Have a lovely Christmas, and we will see you in 2027.\n\nKarley x",
    cta: { label: "See what's on in 2027", href: "/events" },
  },
];

export function adventDoor(day: number) {
  return ADVENT_DOORS.find((d) => d.day === day);
}
