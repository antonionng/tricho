/**
 * Sign-in, sign-ups, newsletter leads, contact messages and partner enquiries.
 * Each function returns { subject, content } for deliver(), or an OwnerAlert
 * for alertOwners(). `samples` feeds the Studio email gallery.
 */
import { shortName } from "@/lib/names";
import { site } from "@/config/site";
import { FREE_LISTING_DAYS } from "@/config/subscriptions";
import type { EmailContent } from "../layout";
import type { OwnerAlert } from "../send";
import type { EmailSample } from "../catalogue";

export type Email = { subject: string; content: EmailContent };

const firstName = (name?: string | null) => shortName(name);
const hello = (name?: string | null) => (firstName(name) ? `Hello ${firstName(name)},` : "Hello,");

// ---------------------------------------------------------------------------
// Sign-in and new accounts
// ---------------------------------------------------------------------------

/** The magic link. Sent by NextAuth's email provider. */
export function signInLinkEmail({ url }: { url: string }): Email {
  return {
    subject: "Your link to sign in to Trichollective",
    content: {
      preheader: "Use this link to sign in. It works once and expires in 24 hours.",
      eyebrow: "Sign in",
      heading: "Here is your link to sign in to Trichollective.",
      body: [
        "Press the button below and you will be signed in on this device. There is no password to remember.",
        "The link works once and expires in 24 hours. If it has expired, you can ask for a new one from the sign-in page.",
        "If you didn't ask for this, you can ignore this email. Nobody can sign in without access to your inbox.",
      ].join("\n\n"),
      cta: { label: "Sign in", href: url },
      signoff: null,
      reason: "You receive this because someone asked to sign in to Trichollective with this email address.",
    },
  };
}

/** A new free account, created on first sign-in. */
export function welcomeFreeAccountEmail({ name }: { name?: string | null }): Email {
  return {
    subject: "Welcome to Trichollective",
    content: {
      preheader: `Your founding directory listing is free for good, with your full profile included for ${FREE_LISTING_DAYS} days.`,
      eyebrow: "Welcome",
      heading: "Your free Trichollective account is ready to use.",
      image: "ed07",
      body: [
        hello(name),
        "Thank you for joining Trichollective, the private home for cosmetic, clinical and medical hair and scalp professionals. Your account is free, and here is what you can do with it today.",
        "## What you can do now",
        `- Add your practice to the founding directory. Your listing stays free for good, and your full profile, with photo, services, website and enquiries sent straight to you, is included for your first ${FREE_LISTING_DAYS} days.`,
        "- Read Trichozette, the magazine written for people who work with hair and scalp, from regulation and research to consultation technique.",
        "- Complete your profile with your discipline, training and scope of practice, so clients and colleagues can find you and refer with confidence.",
        "If you have any questions, reply to this email and it will come straight to us.",
      ].join("\n\n"),
      cta: { label: "Open your account", href: "/members" },
      secondary: { label: "Add your free directory listing", href: "/directory/list" },
      reason: "You receive this because you created a Trichollective account with this email address.",
    },
  };
}

export function newAccountAlert({ name, email }: { name?: string | null; email: string }): OwnerAlert {
  return {
    subject: `New free account: ${name || email}`,
    heading: "Someone has created a free Trichollective account.",
    body: "They have been sent the welcome email with their founding directory listing and Trichozette.",
    facts: [
      ["Name", name || "Not given"],
      ["Email", email],
    ],
    cta: { label: "Open members in the Studio", href: "/studio/members" },
    replyTo: email,
  };
}

// ---------------------------------------------------------------------------
// Newsletter and lead sign-ups
// ---------------------------------------------------------------------------

export const FOUNDING_SOURCES = ["dublin", "instagram", "founding", "facebook"] as const;

/** The starter guide is the email itself: where to begin on Trichollective. */
export function starterGuideEmail(): Email {
  return {
    subject: "Your Trichollective starter guide",
    content: {
      preheader: "Where to begin: free guides to share with clients, the Dublin edition of Trichozette and the directory.",
      eyebrow: "Starter guide",
      heading: "Here is your starter guide to the best of Trichollective.",
      image: "ed02",
      body: [
        "Thank you for asking for the guide. These are the places we would start if we were new to Trichollective, whether you work in a head spa, a salon, a trichology clinic or a GP surgery.",
        "## Guides you can share with clients",
        "Plain-English guides to hair and scalp care, written so you can send them to a client before or after a consultation:",
        `- What does a trichologist do? ${site.url}/guides/what-does-a-trichologist-do`,
        `- Trichologist or dermatologist: who should I see? ${site.url}/guides/trichologist-vs-dermatologist`,
        `- Hair shedding: what's normal and when to get help ${site.url}/guides/hair-shedding-when-to-worry`,
        `- Your first trichology appointment: what to expect ${site.url}/guides/first-trichology-appointment`,
        "## Trichozette, free to read",
        "The opening pages of every edition of Trichozette are free, including the Dublin edition, which looks back at what changed in cosmetic, clinical and medical practice.",
        "## The glossary",
        `The terms clients and colleagues use, from telogen effluvium to trichoscopy, explained in a sentence or two: ${site.url}/glossary`,
        "## Be found by the right clients",
        `Adding your practice to the founding directory is free for good, and your full profile and enquiries are included for your first ${FREE_LISTING_DAYS} days.`,
      ].join("\n\n"),
      cta: { label: "Read the Dublin edition", href: "/trichozette/dublin" },
      secondary: { label: "Add your free directory listing", href: "/directory/list" },
      reason: "You receive this because you asked for the Trichollective starter guide.",
    },
  };
}

export function courseInterestEmail({ slug, title }: { slug: string; title: string }): Email {
  return {
    subject: `You're on the list for ${title}`,
    content: {
      preheader: "We'll email you as soon as the course opens for enrolment.",
      eyebrow: "Course interest",
      heading: `We'll let you know as soon as ${title} opens.`,
      body: [
        "Thank you for registering your interest. Every Trichollective course is reviewed by a named practitioner before it opens, so we don't give dates until that review is done.",
        "When enrolment opens you will be among the first to hear, with the price for members and non-members and what the certificate covers for your CPD record.",
        "In the meantime, the course page has the full syllabus and the outcomes you can expect.",
      ].join("\n\n"),
      cta: { label: "See the course", href: `/courses/${slug}` },
      secondary: { label: "Browse every course", href: "/learn" },
      reason: "You receive this because you registered interest in a Trichollective course.",
    },
  };
}

export function foundingWelcomeEmail(): Email {
  return {
    subject: "Welcome to the founding year of Trichollective",
    content: {
      preheader: `List your practice free for good, and keep your founding price for as long as you stay.`,
      eyebrow: "Founding year",
      heading: "You can join Trichollective in its founding year and keep the founding price for good.",
      image: "ed02",
      body: [
        "Thank you for leaving your email. Trichollective launches at Trichollective Dublin, and here is everything you need to catch up.",
        "## The founding directory",
        `Add your practice to the founding directory for free. Your listing stays free for good, and your full profile and enquiries are included for your first ${FREE_LISTING_DAYS} days, so clients looking for a head spa therapist, stylist, trichologist or doctor can find you.`,
        "## Founding membership",
        "Founding members pay a lower monthly price and keep it for as long as they stay. Membership brings the Case Room, peer referrals, CPD courses and every edition of Trichozette in full. You can cancel at any time.",
        "## Trichozette",
        "The opening pages of every edition are free to read, including the Dublin edition.",
      ].join("\n\n"),
      cta: { label: "See the founding offer", href: "/founding" },
      secondary: { label: "Add your free directory listing", href: "/directory/list" },
      reason: "You receive this because you signed up for Trichollective founding updates.",
    },
  };
}

export function newsletterWelcomeEmail(): Email {
  return {
    subject: "Welcome to the Trichollective newsletter",
    content: {
      preheader: "One email a month with Trichozette, sourced news and what's on.",
      eyebrow: "Newsletter",
      heading: "You will now receive one useful email from Trichollective each month.",
      body: [
        "Thank you for subscribing. The newsletter is written for cosmetic, clinical and medical hair and scalp professionals, and it arrives once a month.",
        "## What each issue brings",
        "- The best of Trichozette, including Karley's column and practical technique for consultations and treatment.",
        "- Sourced news on regulation, treatments and research that affects your scope of practice.",
        "- Events, gatherings and new CPD courses, so you hear about them before places go.",
        "You can leave at any time with the link at the foot of every email.",
      ].join("\n\n"),
      cta: { label: "Read Trichozette", href: "/trichozette" },
      reason: "You receive this because you subscribed to the Trichollective newsletter.",
    },
  };
}

/** Picks the confirmation that fits where someone signed up. */
export function subscribeEmail(source: string, courseTitle?: (slug: string) => string | undefined): Email {
  if (source === "starter-guide") return starterGuideEmail();
  if (source.startsWith("course:")) {
    const slug = source.slice("course:".length);
    const title = courseTitle?.(slug);
    if (title) return courseInterestEmail({ slug, title });
  }
  if ((FOUNDING_SOURCES as readonly string[]).includes(source)) return foundingWelcomeEmail();
  return newsletterWelcomeEmail();
}

// ---------------------------------------------------------------------------
// Contact form
// ---------------------------------------------------------------------------

export const CONTACT_TOPICS = [
  "Membership and billing",
  "My directory listing",
  "Partnerships and sponsorship",
  "Events and speaking",
  "Press",
  "Something else",
] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export type ContactMessage = { name: string; email: string; topic: string; message: string };

export function contactAcknowledgementEmail({ name, topic, message }: ContactMessage): Email {
  return {
    subject: "We've received your message",
    content: {
      preheader: "A real person will reply within two working days.",
      eyebrow: "Contact",
      heading: "We've received your message and a real person will reply within two working days.",
      body: [
        hello(name),
        "Thank you for getting in touch. Your message has reached the Trichollective team, and we read every one ourselves. If you think of anything to add, simply reply to this email.",
        "Here is a copy of what you sent, for your records.",
      ].join("\n\n"),
      facts: [
        ["Topic", topic],
        ["Message", message],
      ],
      reason: "You receive this because you sent a message through the Trichollective contact page.",
    },
  };
}

export function contactAlert({ name, email, topic, message }: ContactMessage, draftId?: string): OwnerAlert {
  return {
    subject: `${topic}: message from ${name}`,
    heading: `${name} has sent a message about ${topic.toLowerCase()}.`,
    body: "Reply to this email to answer them directly. The message is also waiting in the Studio inbox.",
    facts: [
      ["Name", name],
      ["Email", email],
      ["Topic", topic],
      ["Message", message],
    ],
    cta: { label: "Open in the Studio", href: draftId ? `/studio/inbox?id=${draftId}` : "/studio/inbox" },
    replyTo: email,
  };
}

// ---------------------------------------------------------------------------
// Partner applications and business enquiries
// ---------------------------------------------------------------------------

export type PartnerEnquiry = {
  application: boolean;
  company: string;
  name: string;
  email: string;
  role?: string;
  /** "Premium Business", "Business" or "Not sure yet" for applications. */
  tier?: string;
  category?: string;
  sells?: string;
  website?: string;
  interest?: string;
  budget?: string;
  message?: string;
};

export function partnerAcknowledgementEmail(e: PartnerEnquiry): Email {
  if (e.application && e.tier === "Premium Business") {
    return {
      subject: "Your Premium Business application has reached us",
      content: {
        preheader: "Karley reviews every application personally and will reply within three working days.",
        eyebrow: "Partner application",
        heading: "Your application to become a Premium Business partner has reached us.",
        body: [
          hello(e.name),
          `Thank you for applying on behalf of ${e.company}. ${site.founderFull} reviews every Premium Business application personally, looking at what you sell, who it is for and whether it fits the cosmetic, clinical and medical professionals we serve.`,
          "If you would rather start straight away, you can join Premium Business online at any time and your partner page goes live as soon as you pay.",
          "You will hear from us by email within three working days. If you would like to add anything in the meantime, reply to this email.",
        ].join("\n\n"),
        facts: [
          ["Company", e.company],
          ["Tier", e.tier],
          ...(e.category ? ([["Category", e.category]] as [string, string][]) : []),
        ],
        secondary: { label: "Read about Premium Business", href: "/for-business" },
        reason: "You receive this because you applied to become a Trichollective partner.",
      },
    };
  }
  if (e.application) {
    return {
      subject: "Your partner application has reached us",
      content: {
        preheader: "We read every application ourselves and will reply within three working days.",
        eyebrow: "Partner application",
        heading: "Your application to work with Trichollective has reached us.",
        body: [
          hello(e.name),
          `Thank you for applying on behalf of ${e.company}. We read every application ourselves and will reply by email within three working days.`,
          "If you would rather not wait, Business membership can be started online today, with a directory page, five Professional seats, job posts and a member perk. You can apply for Premium Business later.",
        ].join("\n\n"),
        facts: [
          ["Company", e.company],
          ["Tier", e.tier || "Not sure yet"],
          ...(e.category ? ([["Category", e.category]] as [string, string][]) : []),
        ],
        cta: { label: "Compare Business and Premium Business", href: "/for-business#compare" },
        reason: "You receive this because you applied to become a Trichollective partner.",
      },
    };
  }
  return {
    subject: "Your enquiry has reached Trichollective",
    content: {
      preheader: "We'll reply by email within three working days.",
      eyebrow: "Business enquiry",
      heading: "Your enquiry has reached us and we will reply within three working days.",
      body: [
        hello(e.name),
        `Thank you for getting in touch on behalf of ${e.company}. We read every enquiry ourselves and will reply by email within three working days. If you would like to add anything, reply to this email.`,
      ].join("\n\n"),
      facts: [
        ["Company", e.company],
        ...(e.interest ? ([["Interested in", e.interest]] as [string, string][]) : []),
      ],
      secondary: { label: "Read about working with Trichollective", href: "/for-business" },
      reason: "You receive this because you sent Trichollective a business enquiry.",
    },
  };
}

export function partnerAlert(e: PartnerEnquiry, draftId?: string): OwnerAlert {
  const facts: [string, string][] = [
    ["Company", e.company],
    ["Name", e.role ? `${e.name} (${e.role})` : e.name],
    ["Email", e.email],
  ];
  if (e.application) {
    facts.push(["Tier", e.tier || "Not sure yet"]);
    if (e.category) facts.push(["Category", e.category]);
    if (e.website) facts.push(["Website", e.website]);
    if (e.sells) facts.push(["What they sell", e.sells]);
  } else {
    if (e.interest) facts.push(["Interested in", e.interest]);
    if (e.budget) facts.push(["Budget", e.budget]);
  }
  if (e.message) facts.push(["Message", e.message]);

  return {
    subject: e.application ? `New partner application: ${e.company}` : `New business enquiry: ${e.company}`,
    heading: e.application
      ? `${e.company} has applied to become a ${e.tier === "Premium Business" ? "Premium Business partner" : "partner"}.`
      : `${e.company} has sent a business enquiry.`,
    body: "Reply to this email to answer them directly. They have been told to expect a reply within three working days.",
    facts,
    cta: { label: "Review in the Studio", href: draftId ? `/studio/inbox?id=${draftId}` : "/studio/inbox" },
    replyTo: e.email,
  };
}

// ---------------------------------------------------------------------------
// Samples for the Studio gallery
// ---------------------------------------------------------------------------

/** Mirrors alertOwners() so the gallery shows exactly what owners receive. */
function ownerContent(a: OwnerAlert): EmailContent {
  return {
    preheader: a.heading,
    eyebrow: "Studio alert",
    heading: a.heading,
    body: a.body ?? "",
    facts: a.facts,
    cta: a.cta,
    signoff: null,
    reason: "You receive this because you own Trichollective. Change who gets alerts with the OWNER_EMAILS setting.",
  };
}

function sample(id: string, name: string, trigger: string, audience: EmailSample["audience"], e: Email): EmailSample {
  return { id, name, trigger, audience, subject: e.subject, content: e.content };
}

function ownerSample(id: string, name: string, trigger: string, a: OwnerAlert): EmailSample {
  return { id, name, trigger, audience: "owners", subject: `[Trichollective] ${a.subject}`, content: ownerContent(a) };
}

const sampleContact: ContactMessage = {
  name: "Aoife Brennan",
  email: "aoife@example.com",
  topic: "My directory listing",
  message: "Hello, I run a head spa in Galway and would like to add a second location to my listing. Is that possible on the free listing?",
};

const sampleApplication: PartnerEnquiry = {
  application: true,
  company: "Northlight Scalp Devices",
  name: "Tom Hughes",
  email: "tom@example.com",
  role: "Head of education",
  tier: "Premium Business",
  category: "Devices and diagnostics",
  sells: "A handheld scalp camera for trichoscopy in salons and clinics, with training for staff.",
  website: "https://example.com",
  message: "We would love to run a masterclass on scalp imaging at a future gathering.",
};

const sampleEnquiry: PartnerEnquiry = {
  application: false,
  company: "Glenmore Clinic",
  name: "Dr Sarah Kerr",
  email: "sarah@example.com",
  role: "Clinical director",
  interest: "Gathering",
  budget: "£2,000 to £5,000",
  message: "We'd like to discuss sponsoring a session on hair loss in perimenopause at the next conference.",
};

export const samples: EmailSample[] = [
  sample("sign-in-link", "Sign-in link", "Sent when someone asks to sign in with their email address.", "everyone", signInLinkEmail({ url: `${site.url}/api/auth/callback/resend?token=sample` })),
  sample("welcome-free-account", "Welcome to a free account", "Sent when someone creates a free account by signing in for the first time.", "practitioners", welcomeFreeAccountEmail({ name: "Niamh Walsh" })),
  ownerSample("alert-new-account", "New free account", "Sent to the owners when someone creates a free account.", newAccountAlert({ name: "Niamh Walsh", email: "niamh@example.com" })),
  sample("starter-guide", "Starter guide", "Sent when someone asks for the starter guide.", "public", starterGuideEmail()),
  sample("course-interest", "Course interest", "Sent when someone registers interest in a course that hasn't opened yet.", "public", courseInterestEmail({ slug: "scalp-consultation-for-stylists", title: "The scalp consultation for stylists and head spa therapists" })),
  sample("founding-welcome", "Founding welcome", "Sent when someone leaves their email on a founding or launch page, such as the Dublin QR code.", "public", foundingWelcomeEmail()),
  sample("newsletter-welcome", "Newsletter welcome", "Sent when someone subscribes to the newsletter anywhere else on the site.", "public", newsletterWelcomeEmail()),
  sample("contact-acknowledgement", "Contact acknowledgement", "Sent when someone sends a message through the contact page.", "public", contactAcknowledgementEmail(sampleContact)),
  ownerSample("alert-contact", "New contact message", "Sent to the owners when someone sends a message through the contact page.", contactAlert(sampleContact)),
  sample("partner-application-premium", "Premium Business application received", "Sent when a company applies for Premium Business.", "public", partnerAcknowledgementEmail(sampleApplication)),
  sample("partner-application", "Partner application received", "Sent when a company applies for Business or isn't sure which tier fits.", "public", partnerAcknowledgementEmail({ ...sampleApplication, tier: "Not sure yet" })),
  sample("business-enquiry", "Business enquiry received", "Sent when a company sends a general business enquiry.", "public", partnerAcknowledgementEmail(sampleEnquiry)),
  ownerSample("alert-partner-application", "New partner application", "Sent to the owners when a company applies to become a partner.", partnerAlert(sampleApplication)),
  ownerSample("alert-business-enquiry", "New business enquiry", "Sent to the owners when a company sends a business enquiry.", partnerAlert(sampleEnquiry)),
];
