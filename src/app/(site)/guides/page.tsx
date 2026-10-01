import Link from "next/link";
import { Container, SectionHeader } from "@/components/site/primitives";
import { guides } from "@/content/guides";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Hair and scalp guides",
  description:
    "Plain-English guides to head spa, hair shedding, scalp care and choosing the right professional, written by Trichollective for clients and patients.",
  path: "/guides",
    og: { title: "Our guides explain hair and scalp care", sub: "in plain, honest English.", eyebrow: "Guides" },
});

export default function GuidesPage() {
  const categories = [...new Set(guides.map((g) => g.category))];
  return (
    <Container className="py-16 md:py-24">
      <SectionHeader
        as="h1"
        eyebrow="Guides"
        title="Our guides explain hair and scalp care"
        fade="in plain, honest English."
        body="Clear guides for anyone wondering what's happening with their hair or scalp, and who can help. We explain; we never diagnose."
      />
      {categories.map((cat) => (
        <section key={cat} className="mt-16 border-t border-rule pt-10">
          <h2 className="label text-muted-foreground mb-6">{cat}</h2>
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {guides
              .filter((g) => g.category === cat)
              .map((g) => (
                <li key={g.slug}>
                  <Link href={`/guides/${g.slug}`} className="group flex h-full flex-col gap-3 rounded-3xl border border-rule bg-card p-7 transition-colors hover:border-ink/30">
                    <p className="display text-2xl leading-tight">{g.title}</p>
                    <p className="text-[15px] text-ink-2 line-clamp-3">{g.description}</p>
                    <p className="mt-auto pt-3 text-sm text-muted-foreground">{g.readingMinutes} minute read</p>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </Container>
  );
}
