import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Paywall } from "@/components/members/Paywall";
import { prisma } from "@/lib/prisma";
import { getMemberContext, memberCanPost } from "@/lib/member";
import { createComment } from "../actions";
import { normalizeSpace, roomById } from "@/config/rooms";

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const ctx = await getMemberContext();
  if (!ctx.session) redirect("/login");
  if (!ctx.allowed) {
    return <Paywall title="Rooms" body="Threads are part of membership." />;
  }

  const { postId } = await params;
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    include: {
      author: { select: { name: true, role: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, role: true } } },
      },
    },
  });
  if (!post) notFound();

  const space = normalizeSpace(post.space);
  const room = roomById(space);
  const canPost = memberCanPost(space, ctx.profession, ctx.unlocked);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
      <Link
        href={`/members/community?space=${space}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {room?.label || "Rooms"}
      </Link>

      <article className="rounded-2xl border border-border/50 bg-card p-6 md:p-8 space-y-4 shadow-sm">
        <div className="flex justify-between gap-4 text-xs text-muted-foreground">
          <span className="capitalize">{post.category}</span>
          <span>{formatWhen(post.createdAt)}</span>
        </div>
        {post.title && (
          <h1 className="font-display text-3xl font-semibold tracking-tight">{post.title}</h1>
        )}
        <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{post.content}</p>
        <p className="text-xs text-muted-foreground">
          {post.author.name || "Member"} · {post.author.role}
        </p>
      </article>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {post.comments.length} {post.comments.length === 1 ? "reply" : "replies"}
        </h2>
        {post.comments.map((comment) => (
          <div
            key={comment.id}
            className="rounded-2xl border border-border/40 bg-card/80 p-4 space-y-2"
          >
            <div className="flex justify-between gap-4 text-xs">
              <span className="font-medium">{comment.author.name || "Member"}</span>
              <span className="text-muted-foreground">{formatWhen(comment.createdAt)}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{comment.content}</p>
          </div>
        ))}
      </section>

      {canPost ? (
        <form
          action={createComment}
          className="rounded-2xl border border-border/50 bg-card p-5 space-y-3 shadow-sm"
        >
          <input type="hidden" name="postId" value={post.id} />
          <textarea
            name="content"
            required
            minLength={2}
            rows={4}
            placeholder="Reply to the room"
            className="w-full p-3 rounded-xl border border-border/60 bg-background text-sm outline-none resize-y"
          />
          <Button type="submit" className="rounded-full h-10 px-6">
            Reply
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          You can read this thread. Posting here is limited to the professionals in this room.
        </p>
      )}
    </div>
  );
}
