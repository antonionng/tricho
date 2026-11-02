import type { AuthorId } from "@/content/authors";
import type { images } from "@/content/images";

export const BLOG_CATEGORIES = [
  {
    slug: "consultations",
    name: "Consultations and referrals",
    description: "Red flags, case notes and referral pathways that protect your clients and your professional reputation.",
  },
  {
    slug: "hair-loss",
    name: "Hair loss",
    description: "Clear explanations of shedding, thinning and alopecia, with the point at which to see a GP.",
  },
  {
    slug: "scalp-health",
    name: "Scalp health",
    description: "Scalp assessment, trichoscopy and everyday scalp care, explained with sources.",
  },
  {
    slug: "head-spa",
    name: "Head spa",
    description: "How head spa works, how to offer it safely and how to explain it honestly to clients.",
  },
  {
    slug: "careers",
    name: "Careers and training",
    description: "Qualifications, scope of practice and CPD for anyone building a career in hair and scalp care.",
  },
] as const;

export type BlogCategorySlug = (typeof BLOG_CATEGORIES)[number]["slug"];

export type BlogPost = {
  slug: string;
  /** SEO title, natural, 60 characters or fewer. */
  title: string;
  /** Meta description, 120 to 160 characters. */
  description: string;
  category: BlogCategorySlug;
  /** Who the post is written for. Professionals see it in Studio and the members' feed as well. */
  audience: "public" | "professional" | "both";
  /** Short topical tags, lower case. Used for keywords and related posts. */
  tags: string[];
  author: AuthorId;
  /** ISO date. */
  published: string;
  updated?: string;
  /** Named clinical reviewer. Leave null until a real reviewer has read the post. */
  reviewer: null | { name: string; credentials: string; reviewedOn: string };
  image: keyof typeof images;
  /** Two to three sentence standfirst under the headline. */
  standfirst: string;
  /**
   * The direct answer to the question the title asks, in 40 to 70 words.
   * Shown first on the page and written so a search engine or AI assistant can quote it whole.
   */
  answer: string;
  /** Three to five points a reader should leave with. */
  takeaways: string[];
  /** Markdown. Use "##" for sections (they build the contents list) and "###" for sub-sections. */
  body: string;
  /** Three to five. Used for FAQPage schema. */
  faqs: { q: string; a: string }[];
  /** Every factual claim should trace to one of these. */
  sources: { label: string; url: string }[];
  related?: { guides?: string[]; glossary?: string[]; discipline?: "cosmetic" | "clinical" | "medical" };
  /** Leads the blog page. The newest featured post wins. */
  featured?: boolean;
};
