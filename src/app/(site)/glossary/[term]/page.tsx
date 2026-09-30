import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/primitives";
import { glossary, termBySlug } from "@/content/glossary";
import { guides } from "@/content/guides";
import { absoluteUrl, breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return glossary.map((t) => ({ term: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ term: string }> }) {
  const t = termBySlug((await params).term);
  if (!t) return {};
  return pageMetadata({ title: `${t.term}: what it means`, description: t.short, path: `/glossary/${t.slug}`, og: { title: t.term, sub: "What it means.", eyebrow: "Glossary" } });
}

export default async function TermPage({ params }: { params: Promise<{ term: string }> }) {
  const t = termBySlug((await params).term);
  if (!t) notFound();
  const see = t.see.map(termBySlug).filter(Boolean);
  const inGuides = guides.filter((g) => g.related.glossary.includes(t.slug)).slice(0, 3);

  return (
    <Container size="narrow" className="py-16 md:py-24">
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
        <Link href="/glossary" className="hover:text-ink">Glossary</Link>
      </nav>
      <h1 className="display text-5xl md:text-6xl">{t.term}</h1>
      <p className="lede mt-6">{t.short}</p>
      <div className="prose-tricho mt-10 border-t border-rule pt-10">
        {t.body.map((p, i) => <p key={i}>{p}</p>)}
      </div>
      {see.length > 0 && (
        <section className="mt-12">
          <p className="label text-muted-foreground mb-4">Related terms</p>
          <ul className="flex flex-wrap gap-2">
            {see.map((s) => (
              <li key={s!.slug}>
                <Link href={`/glossary/${s!.slug}`} className="inline-flex rounded-full border border-rule bg-card px-3.5 py-1.5 text-sm hover:border-ink/40">{s!.term}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {inGuides.length > 0 && (
        <section className="mt-12 border-t border-rule pt-8">
          <p className="label text-muted-foreground mb-4">Read more in our guides</p>
          <ul className="flex flex-col gap-3">
            {inGuides.map((g) => (
              <li key={g.slug}><Link href={`/guides/${g.slug}`} className="underline underline-offset-4">{g.title}</Link></li>
            ))}
          </ul>
        </section>
      )}
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "DefinedTerm",
            name: t.term,
            description: t.short,
            url: absoluteUrl(`/glossary/${t.slug}`),
            inDefinedTermSet: absoluteUrl("/glossary"),
          },
          breadcrumbLd([{ name: "Glossary", path: "/glossary" }, { name: t.term, path: `/glossary/${t.slug}` }]),
        ]}
      />
    </Container>
  );
}
