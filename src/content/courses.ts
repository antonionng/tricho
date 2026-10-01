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
  syllabus: { title: string; detail: string }[];
  imageKey: ImageKey;
};

/**
 * The course catalogue. Courses are drafted by the Course author agent and
 * must be approved by a named reviewer before they open.
 */
export const courses: Course[] = [
  {
    slug: "scalp-consultation-for-stylists",
    title: "The scalp consultation for stylists and head spa therapists",
    summary:
      "Run a structured scalp consultation, take a short case history, spot the red flags and know exactly when to refer a client on.",
    audience: "Stylists, head spa therapists and scalp care specialists",
    discipline: "cosmetic",
    format: "Six short lessons and a final quiz",
    hours: 3,
    priceGBP: 79,
    memberPriceGBP: 49,
    status: "coming-soon",
    outcomes: [
      "Run a structured five-minute scalp check at every appointment",
      "Recognise the red flags that mean a client should see a GP or trichologist",
      "Write a clear referral note a clinician will read and act on",
      "Talk about shedding and thinning within your scope of practice, without diagnosing",
    ],
    syllabus: [
      { title: "Why the scalp matters", detail: "What healthy looks like, and what changes to notice." },
      { title: "Questions that help", detail: "A short, kind history that doesn't overstep." },
      { title: "Looking closely", detail: "Lighting, magnification and what to record." },
      { title: "Red flags", detail: "The signs that always mean a medical opinion." },
      { title: "Referring well", detail: "Who to refer to, and how to write it down." },
      { title: "Aftercare conversations", detail: "Setting expectations and staying in touch." },
    ],
    imageKey: "ed21",
  },
  {
    slug: "japanese-head-spa-foundations",
    title: "Japanese head spa: foundations and safe practice",
    summary:
      "Offer head spa treatments safely, with a consistent sequence, clear hygiene standards and a contraindication check before every client.",
    audience: "Therapists new to head spa, and salons adding it to their menu",
    discipline: "cosmetic",
    format: "Eight lessons with video demonstrations and a practical checklist",
    hours: 5,
    priceGBP: 149,
    memberPriceGBP: 99,
    status: "coming-soon",
    outcomes: [
      "Explain honestly to clients what a head spa can and cannot do",
      "Follow a safe, consistent treatment protocol",
      "Screen for contraindications before every treatment",
      "Give aftercare advice that encourages clients to rebook",
    ],
    syllabus: [
      { title: "Origins and principles", detail: "Where the treatment comes from and what it aims to do." },
      { title: "Consultation and screening", detail: "Contraindications and when not to treat." },
      { title: "The treatment sequence", detail: "Step by step, with timings." },
      { title: "Products and tools", detail: "Choosing and using them well." },
      { title: "Hygiene standards", detail: "Cleaning, laundry and water." },
      { title: "Aftercare", detail: "What to tell clients, and how to rebook." },
      { title: "Menu and pricing", detail: "Positioning head spa in your business." },
      { title: "Practical assessment", detail: "Checklist and reflective log." },
    ],
    imageKey: "ed22",
  },
  {
    slug: "working-across-disciplines",
    title: "Working across disciplines: referrals that help the client",
    summary:
      "Refer clients between cosmetic, clinical and medical practice with a letter the next professional can act on, and keep the client informed throughout.",
    audience: "Every member, whatever your discipline",
    discipline: "everyone",
    format: "Four lessons and a referral template pack",
    hours: 2,
    priceGBP: 49,
    memberPriceGBP: 0,
    status: "coming-soon",
    outcomes: [
      "Know what each discipline can and can't do, and where your scope of practice ends",
      "Tell a routine referral from an urgent one",
      "Write referral letters that get read and acted on",
      "Hear back on outcomes and keep the client informed",
    ],
    syllabus: [
      { title: "Three disciplines, one client", detail: "Roles and boundaries." },
      { title: "Urgency", detail: "Routine, soon and urgent referrals." },
      { title: "Writing it down", detail: "What a good referral includes." },
      { title: "Closing the loop", detail: "Following up and sharing outcomes." },
    ],
    imageKey: "ed34",
  },
];

export function courseBySlug(slug: string) {
  return courses.find((c) => c.slug === slug);
}
