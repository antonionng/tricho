import { notFound } from "next/navigation";
import { PostArticle } from "@/components/blog/PostArticle";
import { authorOf, categoryName, lastUpdated, relatedPosts } from "@/content/blog";
import { images } from "@/content/images";
import { getAllPosts, getPost } from "@/lib/blog";
import { pageMetadata } from "@/lib/seo";

// Posts published from Studio appear without a deploy; publishing also revalidates the page straight away.
export const revalidate = 300;

export async function generateStaticParams() {
  return (await getAllPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getPost((await params).slug);
  if (!p) return {};
  return pageMetadata({
    title: p.title,
    description: p.description,
    path: `/blog/${p.slug}`,
    type: "article",
    published: p.published,
    modified: lastUpdated(p),
    authors: [authorOf(p).name],
    section: categoryName(p.category),
    tags: p.tags,
    og: { title: p.title, eyebrow: `Blog · ${categoryName(p.category)}`, img: images[p.image].src, variant: "photo", alt: images[p.image].alt },
    alternates: { "text/markdown": `/blog/${p.slug}.md`, "application/rss+xml": "/blog/feed.xml" },
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const posts = await getAllPosts();
  const p = posts.find((x) => x.slug === slug);
  if (!p) notFound();
  return <PostArticle post={p} more={relatedPosts(posts, p)} />;
}
