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
  alt?: string;
};

/** Build a branded /og image URL. */
export function ogImageUrl(o: OgOptions & { title: string }) {
  const q = new URLSearchParams({ title: o.title });
  if (o.sub) q.set("sub", o.sub);
  if (o.eyebrow) q.set("eyebrow", o.eyebrow);
  if (o.img) q.set("img", o.img.split("?")[0]);
  if (o.variant) q.set("variant", o.variant);
  return `/og?${q}`;
}

/** Consistent page metadata: title, description, canonical and social cards. */
export function pageMetadata({
  title,
  description,
  path,
  image,
  og,
  type = "website",
  noindex,
  published,
}: {
  title: string;
  description: string;
  path: string;
  /** A ready-made image URL. Prefer `og` for a branded card. */
  image?: string;
  og?: OgOptions;
  type?: "website" | "article";
  noindex?: boolean;
  published?: string;
}): Metadata {
  const url = image ?? ogImageUrl({ title: og?.title ?? title, ...og });
  const images = [{ url, width: 1200, height: 630, alt: og?.alt ?? title }];
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type,
      siteName: "Trichollective",
      locale: "en_GB",
      images,
      ...(type === "article" && published ? { publishedTime: published } : {}),
    },
    twitter: { card: "summary_large_image", title, description, images },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

export function organizationLd(): Ld {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    description: site.description,
    slogan: site.tagline,
    email: site.contactEmail,
    sameAs: site.social.map((s) => s.href),
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
