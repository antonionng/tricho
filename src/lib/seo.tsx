import type { Metadata } from "next";
import { site } from "@/config/site";

type Ld = Record<string, unknown>;

export function JsonLd({ data }: { data: Ld | Ld[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD must be raw JSON; escape "<" so content can never close the tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function absoluteUrl(path = "/") {
  return new URL(path, site.url).toString();
}

export type OgOptions = {
  /** Headline on the card. Defaults to the page title. */
  title?: string;
  /** Second line in the grey fade. */
  sub?: string;
  /** Small tracked capitals above the headline. */
  eyebrow?: string;
  /** An images.unsplash.com URL (no query string). */
  img?: string;
  variant?: "text" | "photo" | "cover" | "profile";
  /** For Trichozette covers: the partner the edition is brought to you by. */
  by?: string;
  alt?: string;
};

/** Build a branded /og image URL. */
export function ogImageUrl(o: OgOptions & { title: string }) {
  const q = new URLSearchParams({ title: o.title });
  if (o.sub) q.set("sub", o.sub);
  if (o.eyebrow) q.set("eyebrow", o.eyebrow);
  if (o.img) q.set("img", o.img.split("?")[0]);
  if (o.variant) q.set("variant", o.variant);
  if (o.by) q.set("by", o.by);
  return `/og?${q}`;
}

/** Consistent page metadata: title, description, canonical and social cards. */
export function pageMetadata({
  title,
  absoluteTitle,
  description,
  path,
  image,
  og,
  type = "website",
  noindex,
  published,
  modified,
  authors,
  section,
  tags,
  alternates,
}: {
  title: string;
  /** Use the title as it is, without " | Trichollective" after it. */
  absoluteTitle?: boolean;
  description: string;
  path: string;
  /** A ready-made image URL. Prefer `og` for a branded card. */
  image?: string;
  og?: OgOptions;
  type?: "website" | "article";
  noindex?: boolean;
  published?: string;
  /** Article only. */
  modified?: string;
  authors?: string[];
  section?: string;
  tags?: string[];
  /** Other formats of this page, e.g. { "application/rss+xml": "/blog/feed.xml" }. */
  alternates?: Record<string, string>;
}): Metadata {
  const url = image ?? ogImageUrl({ title: og?.title ?? title, ...og });
  const images = [{ url, width: 1200, height: 630, alt: og?.alt ?? title }];
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path, ...(alternates ? { types: alternates } : {}) },
    openGraph: {
      title,
      description,
      url: path,
      type,
      siteName: "Trichollective",
      locale: "en_GB",
      images,
      ...(type === "article"
        ? {
            ...(published ? { publishedTime: published } : {}),
            ...(modified ? { modifiedTime: modified } : {}),
            ...(authors ? { authors } : {}),
            ...(section ? { section } : {}),
            ...(tags ? { tags } : {}),
          }
        : {}),
    },
    twitter: { card: "summary_large_image", title, description, images },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export function organizationLd(): Ld {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: site.name,
    url: site.url,
    logo: absoluteUrl("/icon.svg"),
    description: site.description,
    slogan: site.tagline,
    email: site.contactEmail,
    founder: founderLd(),
    legalName: site.company.name,
    areaServed: ["IE", "GB"],
    knowsAbout: ["Trichology", "Hair loss", "Scalp health", "Head spa", "Trichoscopy", "Dermatology"],
    sameAs: site.social.map((s) => s.href),
  };
}

export function founderLd(): Ld {
  return {
    "@type": "Person",
    "@id": absoluteUrl("/about#karley"),
    name: site.founderFull,
    jobTitle: "Trichologist",
    description: site.founderBio,
    url: absoluteUrl("/about"),
    sameAs: [site.founderPractice.url],
  };
}

export function websiteLd(): Ld {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${site.url}/directory?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]): Ld {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqLd(faqs: { q: string; a: string }[]): Ld {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function articleLd(a: {
  title: string;
  description: string;
  path: string;
  author: string;
  published: string;
  updated?: string;
  reviewer?: string;
}): Ld {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.description,
    mainEntityOfPage: absoluteUrl(a.path),
    author: { "@type": "Organization", name: a.author },
    publisher: { "@type": "Organization", name: site.name },
    datePublished: a.published,
    dateModified: a.updated ?? a.published,
    ...(a.reviewer
      ? { reviewedBy: { "@type": "Person", name: a.reviewer } }
      : {}),
  };
}

/** A blog post, with everything search engines and AI assistants use to judge and cite it. */
export function blogPostingLd(p: {
  title: string;
  description: string;
  path: string;
  image: string;
  author: { kind: "person" | "organization"; name: string; href: string; sameAs: string[]; role: string };
  published: string;
  updated?: string;
  reviewer?: string;
  section: string;
  tags: string[];
  wordCount: number;
  sources: { label: string; url: string }[];
  about?: string[];
}): Ld {
  const author =
    p.author.kind === "person"
      ? { "@type": "Person", name: p.author.name, jobTitle: p.author.role, url: absoluteUrl(p.author.href), sameAs: p.author.sameAs }
      : { "@type": "Organization", name: p.author.name, url: absoluteUrl(p.author.href) };
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": absoluteUrl(`${p.path}#article`),
    headline: p.title,
    description: p.description,
    url: absoluteUrl(p.path),
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(p.path) },
    image: [p.image],
    author,
    publisher: { "@id": absoluteUrl("/#organization"), "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: absoluteUrl("/icon.svg") } },
    datePublished: p.published,
    dateModified: p.updated ?? p.published,
    inLanguage: "en-GB",
    isAccessibleForFree: true,
    articleSection: p.section,
    keywords: p.tags.join(", "),
    wordCount: p.wordCount,
    ...(p.about ? { about: p.about.map((name) => ({ "@type": "Thing", name })) } : {}),
    citation: p.sources.map((s) => ({ "@type": "CreativeWork", name: s.label, url: s.url })),
    ...(p.reviewer ? { reviewedBy: { "@type": "Person", name: p.reviewer } } : {}),
    // The short answer and key points are written to be read aloud or quoted whole.
    speakable: { "@type": "SpeakableSpecification", cssSelector: ["[data-speakable]"] },
  };
}
