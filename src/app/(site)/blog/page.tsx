import Link from "next/link";
import { ArrowRight, Rss } from "lucide-react";
import { ArrowLink, Container, Section, SectionHeader } from "@/components/site/primitives";
import { Reveal } from "@/components/site/Reveal";
import { Breadcrumbs } from "@/components/editorial/PageHero";
import { SignupPanel } from "@/components/editorial/SignupPanel";
import { CategoryNav } from "@/components/blog/CategoryNav";
import { FeaturePost, PostCard } from "@/components/blog/PostCard";
import { activeCategories, lastUpdated, leadPost, postsIn } from "@/content/blog";
import { getAllPosts } from "@/lib/blog";
import { guides } from "@/content/guides";
import { site } from "@/config/site";
import { absoluteUrl, breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Hair and scalp science blog",
  description: `The ${site.name} blog: sourced, practical writing on hair loss, scalp health, consultations, head spa and trichology careers across Ireland and the UK.`,
  path: "/blog",
  og: {
    title: "The Trichollective blog explains hair and scalp science",
    sub: "for practitioners and the clients they see.",
    eyebrow: "Blog",
    img: "https://images.unsplash.com/photo-1635276298514-2c8f4e481428",
    variant: "photo",
  },
  alternates: { "application/rss+xml": "/blog/feed.xml" },
});

const crumbs = [
  { name: "Home", path: "/" },
  { name: "Blog", path: "/blog" },
];

export const revalidate = 300;

export default async function BlogPage() {
  const blogPosts = await getAllPosts();
  const lead = leadPost(blogPosts);
  const rest = blogPosts.filter((p) => p.slug !== lead.slug);
  const publicGuides = guides.filter((g) => g.audience === "public").slice(0, 4);

  return (
    <>
      <section className="border-b border-rule">
        <Container className="flex flex-col gap-10 py-14 md:py-20">
          <Breadcrumbs items={crumbs} showCurrent={false} />
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="flex flex-col gap-6 animate-rise lg:col-span-8">
              <p className="label opacity-70">The blog</p>
              <h1 className="display text-[2.75rem] leading-[0.95] sm:text-6xl lg:text-7xl">
                The Trichollective blog explains hair and scalp science
                <br />
                <span className="text-fade">for practitioners and the clients they see.</span>
              </h1>
            </div>
            <div className="flex flex-col gap-5 lg:col-span-4">
              <p className="lede">
                Every post answers a real question from the consultation room, cites its sources and says
                plainly when a client should see a doctor.
              </p>
              <Link href="/blog/feed.xml" className="inline-flex items-center gap-2 text-[14px] text-ink-2 hover:text-ink">
                <Rss className="h-4 w-4" /> Follow by RSS
              </Link>
            </div>
          </div>
          <CategoryNav posts={blogPosts} />
        </Container>
      </section>

      <Section className="pb-0 md:pb-0">
        <Container>
          <FeaturePost post={lead} />
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeader eyebrow="Latest" title="Read the newest posts from the editorial team." />
          <ul className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((p, i) => (
              <Reveal as="li" key={p.slug} delay={(i % 3) * 60}>
                <PostCard post={p} />
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="paper-2">
        <Container>
          <SectionHeader
            eyebrow="Topics"
            title="Browse by topic to find the answer"
            fade="your client or your practice needs."
          />
          <ul className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
            {activeCategories(blogPosts).map((c) => (
              <li key={c.slug} className="bg-card">
                <Link href={`/blog/topic/${c.slug}`} className="group flex h-full flex-col gap-3 p-8">
                  <p className="text-[13px] text-muted-foreground">
                    {postsIn(blogPosts, c.slug).length} {postsIn(blogPosts, c.slug).length === 1 ? "post" : "posts"}
                  </p>
                  <p className="display text-3xl">{c.name}</p>
                  <p className="text-[15px] leading-relaxed text-ink-2">{c.description}</p>
                  <ArrowRight className="mt-auto h-5 w-5 pt-1 transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <SectionHeader
              eyebrow="Guides"
              title="Send clients a plain-English guide"
              fade="after their consultation."
            />
            <ArrowLink href="/guides">All guides</ArrowLink>
          </div>
          <ul className="mt-10 grid border-t border-rule md:grid-cols-2">
            {publicGuides.map((g) => (
              <li key={g.slug} className="border-b border-rule md:odd:border-r md:odd:pr-10 md:even:pl-10">
                <Link href={`/guides/${g.slug}`} className="group flex flex-col gap-2 py-7">
                  <p className="label text-muted-foreground">{g.category}</p>
                  <p className="text-xl font-semibold leading-snug tracking-tight underline-offset-4 group-hover:underline group-hover:decoration-ink/30">
                    {g.title}
                  </p>
                  <p className="text-[13px] text-muted-foreground">{g.readingMinutes} minute read</p>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="paper-2">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionHeader
                eyebrow="How we write"
                title="Every post is sourced, edited and checked"
                fade="before it is published."
              />
            </div>
            <div className="prose-tricho lg:col-span-7">
              <p>
                Posts may be drafted with the help of AI tools. Each one is then edited, checked against the
                sources listed at the end of the post and approved by {site.founderFull}, our founder, before it
                is published. Where a post has been reviewed by a named clinician, we say so on the page.
              </p>
              <p>
                We write for cosmetic, clinical and medical hair and scalp professionals and for the public.
                We explain; we never diagnose. Nothing on the blog is medical advice, and every post that
                touches on health says when to see a GP.
              </p>
              <p>
                If you spot something that is wrong or out of date, please <Link href="/contact">tell us</Link> and
                we will correct it and update the date on the post.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SignupPanel
            eyebrow="The newsletter"
            title="Get new posts in your inbox once a month."
            body="Sign up for our free monthly newsletter and we'll send you new posts and guides, plus news of events and courses."
            source="blog"
            cta="Subscribe"
          />
        </Container>
      </Section>

      <JsonLd
        data={[
          breadcrumbLd(crumbs),
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            "@id": absoluteUrl("/blog#blog"),
            name: `${site.name} blog`,
            url: absoluteUrl("/blog"),
            inLanguage: "en-GB",
            description: "Sourced, practical writing on hair loss, scalp health, consultations, head spa and trichology careers.",
            publisher: { "@id": absoluteUrl("/#organization") },
            blogPost: blogPosts.map((p) => ({
              "@type": "BlogPosting",
              headline: p.title,
              description: p.description,
              url: absoluteUrl(`/blog/${p.slug}`),
              datePublished: p.published,
              dateModified: lastUpdated(p),
            })),
          },
        ]}
      />
    </>
  );
}
