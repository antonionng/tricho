import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/site/primitives";
import { FaqList } from "@/components/site/FaqList";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { Button } from "@/components/ui/button";
import { guideBySlug, guides } from "@/content/guides";
import { termBySlug } from "@/content/glossary";
import { DISCIPLINES } from "@/content/disciplines";
import { articleLd, breadcrumbLd, faqLd, JsonLd, pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const g = guideBySlug((await params).slug);
  if (!g) return {};
  return pageMetadata({ title: g.title, description: g.description, path: `/guides/${g.slug}`, type: "article", published: g.published, og: { title: g.title, eyebrow: `Guide · ${g.category}` } });
}

function Paragraph({ text }: { text: string }) {
  if (text.startsWith("- ")) {
    return (
      <ul>
        {text.split("\n").map((line) => (
          <li key={line}>{line.replace(/^- /, "")}</li>
        ))}
      </ul>
    );
  }
  return <p>{text}</p>;
}

const date = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const g = guideBySlug((await params).slug);
  if (!g) notFound();
  const discipline = DISCIPLINES.find((d) => d.id === g.related.discipline);
  const terms = g.related.glossary.map(termBySlug).filter(Boolean);
  const more = guides.filter((x) => x.slug !== g.slug && x.category === g.category).slice(0, 2);

  return (
    <article>
      <header className="border-b border-rule">
        <Container size="narrow" className="py-16 md:py-24">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
            <Link href="/guides" className="hover:text-ink">Guides</Link>
            <span className="mx-2">/</span>
            <span>{g.category}</span>
          </nav>
          <h1 className="display text-5xl md:text-6xl">{g.title}</h1>
          <p className="lede mt-6">{g.intro}</p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span>Trichollective editorial team</span>
            <span>{g.readingMinutes} minute read</span>
            <span>Updated {date(g.updated ?? g.published)}</span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {g.reviewer
              ? `Reviewed by ${g.reviewer.name}, ${g.reviewer.credentials}, on ${date(g.reviewer.reviewedOn)}.`
              : "Clinical review by a named practitioner is in progress."}
          </p>
        </Container>
      </header>

      <Container size="narrow" className="py-14 md:py-20">
        <div className="prose-tricho">
          {g.sections.map((s) => (
            <section key={s.heading}>
              <h2>{s.heading}</h2>
              {s.body.map((p, i) => (
                <Paragraph key={i} text={p} />
              ))}
            </section>
          ))}
        </div>

        {discipline && (
          <aside className="mt-16 flex flex-col gap-5 rounded-3xl bg-ink p-8 text-paper md:flex-row md:items-center md:justify-between">
            <div>
              <p className="label opacity-60">Find someone near you</p>
              <p className="mt-2 display text-2xl">{discipline.plural}</p>
            </div>
            <Button asChild variant="paper">
              <Link href={`/directory/${discipline.slug}`}>Open the directory <ArrowRight /></Link>
            </Button>
          </aside>
        )}

        <section className="mt-16">
          <h2 className="display text-3xl mb-6">Common questions</h2>
          <FaqList faqs={g.faqs} />
        </section>

        {terms.length > 0 && (
          <section className="mt-14">
            <p className="label text-muted-foreground mb-4">Terms in this guide</p>
            <ul className="flex flex-wrap gap-2">
              {terms.map((t) => (
                <li key={t!.slug}>
                  <Link href={`/glossary/${t!.slug}`} className="inline-flex rounded-full border border-rule bg-card px-3.5 py-1.5 text-sm hover:border-ink/40">
                    {t!.term}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-14 border-t border-rule pt-8 text-sm text-muted-foreground">
          This guide is general information, not medical advice. If you&apos;re worried about your hair or scalp,
          or your symptoms are changing quickly, please speak to your GP.
        </p>
      </Container>

      <section className="border-t border-rule bg-paper-2">
        <Container className="py-16 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="label text-muted-foreground mb-6">Keep reading</p>
            <ul className="grid gap-4 sm:grid-cols-2">
              {more.map((m) => (
                <li key={m.slug}>
                  <Link href={`/guides/${m.slug}`} className="block h-full rounded-2xl border border-rule bg-card p-6 hover:border-ink/30">
                    <p className="font-semibold leading-snug">{m.title}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{m.readingMinutes} minute read</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-4 lg:col-start-9 flex flex-col gap-4">
            <p className="font-semibold">One useful email a month</p>
            <p className="text-sm text-ink-2">New guides and scalp care advice from professionals.</p>
            <NewsletterForm source={`guide:${g.slug}`} />
          </div>
        </Container>
      </section>

      <JsonLd
        data={[
          articleLd({
            title: g.title,
            description: g.description,
            path: `/guides/${g.slug}`,
            author: "Trichollective",
            published: g.published,
            updated: g.updated,
            reviewer: g.reviewer?.name,
          }),
          faqLd(g.faqs),
          breadcrumbLd([
            { name: "Guides", path: "/guides" },
            { name: g.title, path: `/guides/${g.slug}` },
          ]),
        ]}
      />
    </article>
  );
}
