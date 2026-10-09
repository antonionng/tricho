import type { ImageKey } from "@/content/gazette/types";

export type CourseStatus = "open" | "coming-soon";

export type Course = {
  slug: string;
  title: string;
  summary: string;
  audience: string;
  discipline: "cosmetic" | "clinical" | "medical" | "everyone";
  format: string;
  hours: number;
  priceGBP: number;
  memberPriceGBP: number;
  status: CourseStatus;
  outcomes: string[];
  /** Lesson titles and one-line details, matching src/content/course-lessons (a test checks this). */
  syllabus: { title: string; detail: string }[];
  imageKey: ImageKey;
  /** The qualified practitioner who reviewed the course, named on every certificate. */
  reviewer?: { name: string; credentials: string };
};

/**
 * The course catalogue. The lessons and assessment for each course are in
 * src/content/course-lessons/<slug>.ts. Each course should be approved by a
 * named reviewer, set in `reviewer`, who is then named on every certificate.
 */
export const courses: Course[] = [
  {
    slug: "scalp-consultation-for-stylists",
    title: "The scalp consultation for stylists and head spa therapists",
    summary:
      "Run a structured scalp consultation, take a short case history, spot the red flags and know exactly when to refer a client on.",
    audience: "Stylists, head spa therapists and scalp care specialists",
    discipline: "cosmetic",
    format: "Six lessons with case studies, a knowledge check after each one and a final assessment",
    hours: 4,
    priceGBP: 79,
    memberPriceGBP: 49,
    status: "open",
    outcomes: [
      "Run a structured five-minute scalp check at every appointment",
      "Recognise the red flags that mean a client should see a GP or trichologist",
      "Write a clear referral note a clinician will read and act on",
      "Talk about shedding and thinning within your scope of practice, without diagnosing",
    ],
    syllabus: [
      { title: "Why the scalp matters", detail: "Why you are often the first person to notice a scalp change, what your role is, and the five-minute check you will run at every appointment." },
      { title: "Questions that help", detail: "The questions that give you a useful history in a minute, how to ask about health without prying, and how to listen for the answers that matter." },
      { title: "Looking closely", detail: "A systematic way to examine the scalp, hair and hairline, how to describe what you see in words a clinician can use, and the record card to write it on." },
      { title: "Red flags", detail: "The signs and stories that mean a client should see a GP or trichologist, how urgent each one is, and what to do with today's service." },
      { title: "Referring well", detail: "How to suggest a referral so the client goes, choose the right person, and write a short note a GP or trichologist can act on." },
      { title: "Aftercare conversations", detail: "How to talk about shedding and thinning honestly and within scope, give practical aftercare, and support clients over time." },
    ],
    reviewer: { name: "Karley Weir Ghallagher", credentials: "trichologist and founder of Trichollective" },
    imageKey: "ed21",
  },
  {
    slug: "japanese-head-spa-foundations",
    title: "Japanese head spa: foundations and safe practice",
    summary:
      "Offer head spa treatments safely, with a consistent sequence, clear hygiene standards and a contraindication check before every client.",
    audience: "Therapists new to head spa, and salons adding it to their menu",
    discipline: "cosmetic",
    format: "Eight lessons with a step-by-step protocol, a consent form and a practical assessment checklist",
    hours: 6,
    priceGBP: 149,
    memberPriceGBP: 99,
    status: "open",
    outcomes: [
      "Explain honestly to clients what a head spa can and cannot do",
      "Follow a safe, consistent treatment protocol",
      "Screen for contraindications before every treatment",
      "Give aftercare advice that encourages clients to rebook",
    ],
    syllabus: [
      { title: "Origins and principles", detail: "Where head spa comes from, what it can honestly do, and how to describe it without misleading anyone." },
      { title: "Consultation and screening", detail: "Contraindications, when to adapt, when to defer, and how to record consent." },
      { title: "The treatment sequence", detail: "A full head spa protocol, step by step, with timings, temperatures and adaptations for different hair." },
      { title: "Products and tools", detail: "Choosing and using cameras, water systems, cleansers, oils and essential oils safely." },
      { title: "Hygiene standards", detail: "Cleaning, disinfection, laundry, water systems, licensing and the legal duties behind them." },
      { title: "Aftercare", detail: "What to tell clients after treatment, how to handle reactions, and how to suggest rebooking honestly." },
      { title: "Menu and pricing", detail: "Costing a treatment, setting a price that pays, and positioning head spa honestly in your business." },
      { title: "Practical assessment", detail: "An observed treatment checklist, a reflective log and how to use them to show you are safe and consistent." },
    ],
    reviewer: { name: "Karley Weir Ghallagher", credentials: "trichologist and founder of Trichollective" },
    imageKey: "ed22",
  },
  {
    slug: "working-across-disciplines",
    title: "Working across disciplines: referrals that help the client",
    summary:
      "Refer clients between cosmetic, clinical and medical practice with a letter the next professional can act on, and keep the client informed throughout.",
    audience: "Every member, whatever your discipline",
    discipline: "everyone",
    format: "Four lessons with a pack of referral letter templates and a final assessment",
    hours: 3,
    priceGBP: 49,
    memberPriceGBP: 0,
    status: "open",
    outcomes: [
      "Know what each discipline can and can't do, and where your scope of practice ends",
      "Tell a routine referral from an urgent one",
      "Write referral letters that get read and acted on",
      "Hear back on outcomes and keep the client informed",
    ],
    syllabus: [
      { title: "Three disciplines, one client", detail: "What cosmetic, clinical and medical professionals each do, what they cannot do, and where your own scope ends." },
      { title: "Urgency", detail: "Telling a routine referral from one that needs a GP soon, the same day, or an emergency call, including safeguarding and mental health." },
      { title: "Writing it down", detail: "Referral letters that get read and acted on: structure, consent, data protection, photographs, secure sending and a plain-language copy for the client." },
      { title: "Closing the loop", detail: "Following up, recording outcomes, what to do when you hear nothing, keeping the client informed, and building a local referral network." },
    ],
    reviewer: { name: "Karley Weir Ghallagher", credentials: "trichologist and founder of Trichollective" },
    imageKey: "ed34",
  },
];

export function courseBySlug(slug: string) {
  return courses.find((c) => c.slug === slug);
}
