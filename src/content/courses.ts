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
  imageKey: "headSpa" | "clinic" | "learning" | "salon" | "hairDetail";
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
      "Learn a calm, structured way to look at a client's scalp, ask the right questions and know when to refer them on.",
    audience: "Stylists, head spa therapists and scalp care specialists",
    discipline: "cosmetic",
    format: "Six short lessons and a final quiz",
    hours: 3,
    priceGBP: 79,
    memberPriceGBP: 49,
    status: "coming-soon",
    outcomes: [
      "Run a five-minute scalp check that clients find reassuring",
      "Recognise the signs that mean a client should see a GP or trichologist",
      "Write a clear referral note a clinician will welcome",
      "Talk about shedding and thinning without diagnosing",
    ],
    syllabus: [
      { title: "Why the scalp matters", detail: "What healthy looks like, and what changes to notice." },
      { title: "Questions that help", detail: "A short, kind history that doesn't overstep." },
      { title: "Looking closely", detail: "Lighting, magnification and what to record." },
      { title: "Red flags", detail: "The signs that always mean a medical opinion." },
      { title: "Referring well", detail: "Who to refer to, and how to write it down." },
      { title: "Aftercare conversations", detail: "Setting expectations and staying in touch." },
    ],
    imageKey: "headSpa",
  },
  {
    slug: "japanese-head-spa-foundations",
    title: "Japanese head spa: foundations and safe practice",
    summary:
      "The principles, sequence and hygiene standards behind a head spa treatment, with the contraindications every therapist should know.",
    audience: "Therapists new to head spa, and salons adding it to their menu",
    discipline: "cosmetic",
    format: "Eight lessons with video demonstrations and a practical checklist",
    hours: 5,
    priceGBP: 149,
    memberPriceGBP: 99,
    status: "coming-soon",
    outcomes: [
      "Explain what a head spa is and isn't to clients",
      "Follow a safe, consistent treatment sequence",
      "Screen for contraindications before every treatment",
      "Set up hygiene and aftercare standards for your space",
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
    imageKey: "headSpa",
  },
  {
    slug: "working-across-disciplines",
    title: "Working across disciplines: referrals that help the client",
    summary:
      "How cosmetic, clinical and medical practitioners can refer to each other clearly, respectfully and in the client's interest.",
    audience: "Every member, whatever your discipline",
    discipline: "everyone",
    format: "Four lessons and a referral template pack",
    hours: 2,
    priceGBP: 49,
    memberPriceGBP: 0,
    status: "coming-soon",
    outcomes: [
      "Understand what each discipline can and can't do",
      "Know when a referral is urgent",
      "Write referrals that get read and acted on",
      "Keep the client informed and in control",
    ],
    syllabus: [
      { title: "Three disciplines, one client", detail: "Roles and boundaries." },
      { title: "Urgency", detail: "Routine, soon and urgent referrals." },
      { title: "Writing it down", detail: "What a good referral includes." },
      { title: "Closing the loop", detail: "Following up and sharing outcomes." },
    ],
    imageKey: "clinic",
  },
];

export function courseBySlug(slug: string) {
  return courses.find((c) => c.slug === slug);
}
