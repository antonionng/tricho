import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, FileText } from "lucide-react";
import { Container, Pill } from "@/components/site/primitives";
import { Breadcrumbs } from "@/components/editorial/PageHero";
import { FaqList } from "@/components/site/FaqList";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { Button } from "@/components/ui/button";
import { PostBody } from "@/components/blog/PostBody";
import { PostCard, postDate } from "@/components/blog/PostCard";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { authorOf, categoryName, headingsOf, lastUpdated, readingMinutes, wordCount, type BlogPost } from "@/content/blog";
import { guideBySlug } from "@/content/guides";
import { termBySlug } from "@/content/glossary";
import { DISCIPLINES } from "@/content/disciplines";
import { images, img } from "@/content/images";
import { absoluteUrl, blogPostingLd, breadcrumbLd, faqLd, JsonLd } from "@/lib/seo";

/** A whole post as readers see it. Studio's preview uses this too. */
export function PostArticle({ post: p, more }: { post: BlogPost; more: BlogPost[] }) {
  const author = authorOf(p);
  const photo = images[p.image];
  const headings = headingsOf(p.body);
  const path = `/blog/${p.slug}`;
  const discipline = DISCIPLINES.find((d) => d.id === p.related?.discipline);
  const relatedGuides = (p.related?.guides ?? []).map(guideBySlug).filter((g) => !!g);
  const terms = (p.related?.glossary ?? []).map(termBySlug).filter((t) => !!t);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: categoryName(p.category), path: `/blog/topic/${p.category}` },
    { name: p.title, path },
  ];
  const shareUrl = encodeURIComponent(absoluteUrl(path));
  const shareTitle = encodeURIComponent(p.title);

  return (
    <article id="post">
      <ReadingProgress target="post" />

      <header>
        <Container size="narrow" className="flex flex-col gap-7 pb-12 pt-14 md:pb-14 md:pt-20">
          <Breadcrumbs items={crumbs} showCurrent={false} />
          <div className="flex flex-wrap gap-2">
            <Link href={`/blog/topic/${p.category}`}>
              <Pill>{categoryName(p.category)}</Pill>
            </Link>
            {p.audience === "professional" && <Pill>For professionals</Pill>}
          </div>
          <h1 className="display text-[2.6rem] leading-[0.98] sm:text-6xl animate-rise">{p.title}</h1>
          <p className="lede">{p.standfirst}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule pt-6 text-[14px]">
            <Link href={author.href} className="flex items-center gap-3">
              <span aria-hidden className="grid h-10 w-10 place-items-center rounded-full bg-ink text-[13px] font-semibold text-paper">
                {author.kind === "person" ? author.name.split(" ").map((n) => n[0]).join("") : "T"}
              </span>
              <span className="flex flex-col leading-tight">
                <span className="font-medium text-ink">{author.name}</span>
                <span className="text-muted-foreground">{author.role}</span>
              </span>
            </Link>
            <span className="text-muted-foreground">
              {p.updated ? "Updated " : "Published "}
              <time dateTime={lastUpdated(p)}>{postDate(lastUpdated(p))}</time>
            </span>
            <span className="text-muted-foreground">{readingMinutes(p)} minute read</span>
          </div>
        </Container>
        <Container size="wide">
          <figure>
            <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-paper-2 md:aspect-[21/9]">
              <Image src={img(photo, 2000)} alt={photo.alt} fill priority sizes="100vw" className="mag-bw object-cover" />
            </div>
            <figcaption className="mt-3 text-right text-[12px] text-muted-foreground">
              Photograph by{" "}
              <a href={photo.page} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                {photo.credit}
              </a>{" "}
              on Unsplash
            </figcaption>
          </figure>
        </Container>
      </header>

      <Container className="grid gap-12 py-14 md:py-20 lg:grid-cols-12">
        <aside className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-28 flex flex-col gap-10">
            <TableOfContents headings={headings} />
            <div>
              <p className="label mb-4 text-muted-foreground">Share</p>
              <ul className="flex flex-col gap-2 text-[14px] text-ink-2">
                <li>
                  <a className="hover:text-ink" target="_blank" rel="noopener noreferrer" href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}>
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a className="hover:text-ink" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${shareTitle}%20${shareUrl}`}>
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a className="hover:text-ink" href={`mailto:?subject=${shareTitle}&body=${shareUrl}`}>
                    Email
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </aside>

        <div className="min-w-0 lg:col-span-7 lg:col-start-5">
          <section data-speakable aria-labelledby="short-answer" className="rounded-3xl bg-ink p-7 text-paper sm:p-9">
            <p id="short-answer" className="label opacity-60">The short answer</p>
            <p className="mt-4 text-[1.1875rem] leading-relaxed">{p.answer}</p>
          </section>

          <section data-speakable aria-labelledby="takeaways" className="mt-8 rounded-3xl border border-rule bg-card p-7 sm:p-9">
            <h2 id="takeaways" className="label text-muted-foreground">Key points</h2>
            <ol className="mt-5 flex flex-col gap-4">
              {p.takeaways.map((t, i) => (
                <li key={t} className="flex gap-4 text-[16px] leading-relaxed text-ink-2">
                  <span className="display w-6 shrink-0 text-xl text-ink">{i + 1}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </section>

          <details className="mt-8 rounded-2xl border border-rule px-6 py-4 lg:hidden">
            <summary className="cursor-pointer text-[15px] font-medium">In this post</summary>
            <ol className="mt-3 flex flex-col gap-2 text-[15px] text-ink-2">
              {headings.map((h) => (
                <li key={h.id}>
                  <a href={`#${h.id}`}>{h.text}</a>
                </li>
              ))}
            </ol>
          </details>

          <div className="mt-6">
            <PostBody markdown={p.body} />
          </div>

          {discipline && (
            <aside className="mt-16 flex flex-col gap-5 rounded-3xl bg-ink p-8 text-paper md:flex-row md:items-center md:justify-between">
              <div>
                <p className="label opacity-60">Find someone near you</p>
                <p className="mt-2 display text-2xl">{discipline.plural}</p>
              </div>
              <Button asChild variant="paper">
                <Link href={`/directory/${discipline.slug}`}>
                  Open the directory <ArrowRight />
                </Link>
              </Button>
            </aside>
          )}

          <section className="mt-16">
            <h2 className="display mb-6 text-3xl">Common questions</h2>
            <FaqList faqs={p.faqs} />
          </section>

          <section className="mt-14">
            <h2 className="label mb-5 text-muted-foreground">Sources</h2>
            <ol className="flex flex-col gap-3 text-[15px]">
              {p.sources.map((s, i) => (
                <li key={s.url} className="flex gap-3">
                  <span className="w-5 shrink-0 text-muted-foreground">{i + 1}.</span>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 text-ink underline decoration-mute underline-offset-4 hover:decoration-ink">
                    {s.label} <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0" />
                  </a>
                </li>
              ))}
            </ol>
          </section>

          {(relatedGuides.length > 0 || terms.length > 0) && (
            <section className="mt-14 grid gap-10 sm:grid-cols-2">
              {relatedGuides.length > 0 && (
                <div>
                  <h2 className="label mb-4 text-muted-foreground">Related guides</h2>
                  <ul className="flex flex-col gap-3">
                    {relatedGuides.map((g) => (
                      <li key={g.slug}>
                        <Link href={`/guides/${g.slug}`} className="flex items-start gap-2 text-[15px] font-medium hover:underline">
                          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /> {g.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {terms.length > 0 && (
                <div>
                  <h2 className="label mb-4 text-muted-foreground">Terms in this post</h2>
                  <ul className="flex flex-wrap gap-2">
                    {terms.map((t) => (
                      <li key={t.slug}>
                        <Link href={`/glossary/${t.slug}`} className="inline-flex rounded-full border border-rule bg-card px-3.5 py-1.5 text-sm hover:border-ink/40">
                          {t.term}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          <section className="mt-14 flex flex-col gap-4 rounded-3xl border border-rule bg-card p-7 sm:flex-row sm:p-8">
            <span aria-hidden className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ink text-lg font-semibold text-paper">
              {author.kind === "person" ? author.name.split(" ").map((n) => n[0]).join("") : "T"}
            </span>
            <div className="flex flex-col gap-2">
              <p className="label text-muted-foreground">Written by</p>
              <p className="text-lg font-semibold">{author.name}</p>
              <p className="text-[15px] leading-relaxed text-ink-2">{author.bio}</p>
              <p className="mt-2 text-[14px] text-muted-foreground">
                {p.reviewer
                  ? `Reviewed by ${p.reviewer.name}, ${p.reviewer.credentials}, on ${postDate(p.reviewer.reviewedOn)}.`
                  : "Clinical review by a named practitioner is in progress."}
              </p>
            </div>
          </section>

          <p className="mt-10 border-t border-rule pt-8 text-sm text-muted-foreground">
            This post is general information, not medical advice. If you are worried about your hair or scalp, or your
            symptoms are changing quickly, please speak to your GP.
          </p>
        </div>
      </Container>

      {more.length > 0 && (
        <section className="border-t border-rule bg-paper-2">
          <Container className="py-16 md:py-24">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="display text-4xl sm:text-5xl">Keep reading on the blog.</h2>
              <Link href="/blog" className="inline-flex items-center gap-2 text-[15px] font-medium">
                All posts <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ul className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((m) => (
                <li key={m.slug}>
                  <PostCard post={m} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <section className="border-t border-rule">
        <Container className="grid gap-8 py-16 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <p className="display text-3xl">Get one useful email a month with new posts and guides.</p>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <NewsletterForm source={`blog:${p.slug}`} />
          </div>
        </Container>
      </section>

      <JsonLd
        data={[
          blogPostingLd({
            title: p.title,
            description: p.description,
            path,
            image: img(photo, 1600),
            author,
            published: p.published,
            updated: p.updated,
            reviewer: p.reviewer?.name,
            section: categoryName(p.category),
            tags: p.tags,
            wordCount: wordCount(p),
            sources: p.sources,
            about: terms.map((t) => t.term),
          }),
          faqLd(p.faqs),
          breadcrumbLd(crumbs),
        ]}
      />
    </article>
  );
}
