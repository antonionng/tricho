import type { EmailContent } from "../layout";
import type { EmailSample } from "../catalogue";
import { site } from "@/config/site";

type Email = { subject: string; content: EmailContent };

export type PageAccessFacts = {
  /** The page's name, e.g. "Little Lady Locks". */
  pageName: string;
  /** "brand", "charity" or "gifted". */
  kind: string;
  /** The email address that can now sign in and edit the page. */
  email: string;
  /** Path of the public page, e.g. "/partners/little-lady-locks". */
  pagePath: string;
  published: boolean;
  photos: number;
  /** How many photos the page's package allows. */
  photoLimit: number;
  /** Whether the page's package includes a video. */
  video: boolean;
};

/**
 * Sent when the team hands a page to the person who will look after it. It explains how to sign in
 * (there is no password) and how to edit each part of the page. A gifted page is never called a
 * partnership, and a charity is told plainly that the page is free.
 */
export function pageAccessEmail(f: PageAccessFacts): Email {
  const intro =
    f.kind === "charity"
      ? `${f.pageName} now has its own page on ${site.name}, the professional community for trichologists and hair and scalp specialists. We are proud to support your work, so the page is free, and it will stay free.`
      : f.kind === "gifted"
        ? `${f.pageName} now has a Premium page on ${site.name}, the professional community for trichologists and hair and scalp specialists. We have set it up for you free of charge.`
        : `${f.pageName} now has its own page on ${site.name}, the professional community for trichologists and hair and scalp specialists.`;
  const status = f.published
    ? "Your page is already live, and we have filled it in from your website so you have a head start."
    : "We have started your page from your website. It stays hidden until you are happy with it and press Publish.";

  return {
    subject: `Your ${site.name} page for ${f.pageName} is ready for you`,
    content: {
      preheader: `Sign in with ${f.email} to edit your page. There is no password to remember.`,
      eyebrow: "Your page",
      heading: `Your page for ${f.pageName} is ready for you to edit.`,
      body: [
        "Hello,",
        intro,
        status,
        "## How to sign in",
        [
          `- Press the button below, or go to ${site.url}/login`,
          `- Enter ${f.email}, which is the address we have linked to your page`,
          "- We email you a sign-in link straight away. Open it on the same device and you are in, with no password to set or remember",
          "- You arrive at Your business, where everything about your page lives",
        ].join("\n"),
        "## How to edit your page",
        [
          "- Logo, cover and colour: upload your logo and a wide cover photo, and choose your brand colour",
          "- Story: a one-line summary, your story and a few headline numbers",
          "- Products and services: one card for each thing you offer",
          `- Photos: up to ${f.photoLimit} photos of your work and your space, which visitors can open full screen${f.photos ? `. We have added ${f.photos} to start you off` : ""}`,
          f.video
            ? "- Video and features: a YouTube or Vimeo video, and bold sections such as a programme or an offer"
            : "- Features: a bold section for something you want to highlight, such as a programme or an offer",
          "- Preview and publish: see your page exactly as visitors will, then publish it",
        ].join("\n"),
        "Every change goes live as soon as you save it, and you can come back to it at any time.",
        "## Need a hand?",
        `Reply to this email and we will help, whether you want a change made for you or would like the page linked to a different email address.`,
      ].join("\n\n"),
      cta: { label: "Sign in and edit your page", href: "/login?next=/members/business/setup" },
      ...(f.published ? { secondary: { label: "See your page", href: f.pagePath } } : {}),
      reason: `The ${site.name} team linked ${f.email} to the page for ${f.pageName}.`,
    },
  };
}

const sampleFacts: PageAccessFacts = {
  pageName: "Little Lady Locks",
  kind: "charity",
  email: "ashley@example.com",
  pagePath: "/partners/little-lady-locks",
  published: true,
  photos: 2,
  photoLimit: 16,
  video: true,
};

export const samples: EmailSample[] = [
  {
    id: "page-access",
    name: "Page access",
    trigger: "Sent when someone on the team gives a person access to a page from Owner access in the Studio page editor, or resends it.",
    audience: "public",
    ...pageAccessEmail(sampleFacts),
  },
];
