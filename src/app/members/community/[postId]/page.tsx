import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Paywall } from "@/components/members/Paywall";
import { prisma } from "@/lib/prisma";
import { getMemberContext } from "@/lib/member";
import { createComment } from "../actions";

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
    return (
      <Paywall title="The Hub" body="Threads are part of membership." />
    );
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
  if (post.space === "consultation" && !ctx.consultation) {
    redirect("/members/community?space=consultation");
  }

  return (
    <div className="min-h-screen bg-[#D1D0CB] pt-16 pb-24">
      <div className="container mx-auto px-4 max-w-3xl space-y-10">
        <Link
          href={`/members/community?space=${post.space}`}
          className="tricho-caps text-[10px] text-black/40 hover:text-black"
        >
          ← {post.space === "consultation" ? "Consultation Room" : "The Lounge"}
        </Link>

        <article className="space-y-4 border border-black/10 bg-white/50 p-8">
          <div className="flex justify-between gap-4">
            <span className="tricho-caps text-[10px] text-black/40">{post.category}</span>
            <span className="tricho-caps text-[10px] text-black/40">
              {formatWhen(post.createdAt)}
            </span>
          </div>
          {post.title && (
            <h1 className="text-4xl tricho-title uppercase tracking-tight">{post.title}</h1>
          )}
          <p className="font-sans text-black/80 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
          <p className="tricho-caps text-[10px] text-black/40">
            {post.author.name || "Member"} · {post.author.role}
          </p>
        </article>

        <section className="space-y-4">
          <h2 className="tricho-caps text-xs">
            {post.comments.length} {post.comments.length === 1 ? "reply" : "replies"}
          </h2>
          {post.comments.map((comment) => (
            <div key={comment.id} className="border border-black/10 bg-white/30 p-5 space-y-2">
              <div className="flex justify-between gap-4">
                <span className="tricho-caps text-[10px]">
                  {comment.author.name || "Member"}
                </span>
                <span className="tricho-caps text-[10px] text-black/40">
                  {formatWhen(comment.createdAt)}
                </span>
              </div>
              <p className="font-sans text-sm whitespace-pre-wrap leading-relaxed">
                {comment.content}
              </p>
            </div>
          ))}
        </section>

        <form action={createComment} className="border border-black/10 bg-white/50 p-5 space-y-4">
          <input type="hidden" name="postId" value={post.id} />
          <textarea
            name="content"
            required
            minLength={2}
            rows={4}
            placeholder="Reply to the room"
            className="w-full p-3 bg-white/70 border border-black/15 text-sm outline-none resize-y"
          />
          <Button
            type="submit"
            className="tricho-caps rounded-none bg-black text-[#D1D0CB] h-12 px-8"
          >
            Reply
          </Button>
        </form>
      </div>
    </div>
  );
}
