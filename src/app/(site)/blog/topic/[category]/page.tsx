import { notFound } from "next/navigation";
import { Container, Section } from "@/components/site/primitives";
import { Reveal } from "@/components/site/Reveal";
import { Breadcrumbs } from "@/components/editorial/PageHero";
import { CategoryNav } from "@/components/blog/CategoryNav";
import { PostCard } from "@/components/blog/PostCard";
import { activeCategories, categoryBySlug, postsIn } from "@/content/blog";
import { getAllPosts } from "@/lib/blog";
import { absoluteUrl, breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export async function generateStaticParams() {
  return activeCategories(await getAllPosts()).map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const c = categoryBySlug((await params).category);
  if (!c) return {};
  return pageMetadata({
    title: `${c.name} articles`,
    description: c.description,
    path: `/blog/topic/${c.slug}`,
    og: { title: c.name, sub: c.description, eyebrow: "Blog" },
    alternates: { "application/rss+xml": "/blog/feed.xml" },
  });
}

export default async function BlogTopicPage({ params }: { params: Promise<{ category: string }> }) {
  const c = categoryBySlug((await params).category);
  if (!c) notFound();
  const all = await getAllPosts();
  const posts = postsIn(all, c.slug);
  if (posts.length === 0) notFound();
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: c.name, path: `/blog/topic/${c.slug}` },
  ];

  return (
    <>
      <section className="border-b border-rule">
        <Container className="flex flex-col gap-8 py-14 md:py-20">
          <Breadcrumbs items={crumbs} showCurrent={false} />
          <div className="flex max-w-4xl flex-col gap-6 animate-rise">
            <p className="label opacity-70">Blog topic</p>
            <h1 className="display text-[2.75rem] leading-[0.95] sm:text-6xl lg:text-7xl">{c.name}</h1>
            <p className="lede max-w-2xl">{c.description}</p>
          </div>
          <CategoryNav posts={all} current={c.slug} />
        </Container>
      </section>

      <Section>
        <Container>
          <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p, i) => (
              <Reveal as="li" key={p.slug} delay={(i % 3) * 60}>
                <PostCard post={p} priority={i < 3} />
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      <JsonLd
        data={[
          breadcrumbLd(crumbs),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: c.name,
            description: c.description,
            url: absoluteUrl(`/blog/topic/${c.slug}`),
            isPartOf: { "@id": absoluteUrl("/blog#blog") },
            mainEntity: {
              "@type": "ItemList",
              itemListElement: posts.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: absoluteUrl(`/blog/${p.slug}`),
                name: p.title,
              })),
            },
          },
        ]}
      />
    </>
  );
}
