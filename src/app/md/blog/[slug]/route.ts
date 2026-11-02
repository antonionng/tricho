import { getAllPosts, getPost } from "@/lib/blog";
import { markdownResponse, postMarkdown } from "@/lib/llms";

/** Served at /blog/<slug>.md through a rewrite in next.config.ts. */
export const revalidate = 300;

export async function generateStaticParams() {
  return (await getAllPosts()).map((p) => ({ slug: p.slug }));
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const p = await getPost((await params).slug);
  if (!p) return new Response("Not found", { status: 404 });
  return markdownResponse(postMarkdown(p), `/blog/${p.slug}`);
}
