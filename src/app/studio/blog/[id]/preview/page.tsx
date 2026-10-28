import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAllPosts, rowToPost } from "@/lib/blog";
import { NoAccess } from "@/components/studio/ui";
import { PostArticle } from "@/components/blog/PostArticle";
import { relatedPosts } from "@/content/blog";
import { studioPage } from "../../../_lib/guard";

export const dynamic = "force-dynamic";

/** The post exactly as readers will see it, before it is published. */
export default async function BlogPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await studioPage(`/studio/blog/${id}/preview`, "gazette.view");
  if (!staff) return <NoAccess what="the blog" />;
  const row = await prisma.blogArticle.findUnique({ where: { id } });
  if (!row) notFound();
  const post = rowToPost(row);
  const posts = await getAllPosts();
  return (
    <div className="-mx-4 -my-8 bg-paper sm:-mx-6 lg:-mx-10 lg:-my-10">
      <p className="sticky top-0 z-30 bg-ink px-4 py-2 text-center text-sm text-paper">
        Preview{row.status === "published" ? " of the live post" : ". Readers can't see this until it is published"}.
      </p>
      <PostArticle post={post} more={relatedPosts(posts, post)} />
    </div>
  );
}
