import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Paywall } from "@/components/members/Paywall";
import { Avatar } from "@/components/members/Avatar";
import { MemberPage } from "@/components/members/MemberPage";
import { timeAgo } from "@/components/members/format";
import { UsefulButton } from "@/components/community/UsefulButton";
import { ReportButton } from "@/components/community/ReportButton";
import { CommentForm } from "@/components/community/CommentForm";
import { ReplyToComment } from "@/components/community/ReplyToComment";
import { PostMedia } from "@/components/community/PostMedia";
import { firstName, mediaForPosts } from "@/lib/community";
import { cn } from "@/lib/utils";
import { getMemberContext } from "@/lib/member";
import { prisma } from "@/lib/prisma";
import { canPostInRoom, canReadRoom, normalizeSpace, professionById, roomById } from "@/config/rooms";
import { getAllRooms } from "@/lib/rooms";

export const metadata = { title: "Community" };

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ shared?: string }>;
}) {
  const { shared } = await searchParams;
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members/community");
  if (!ctx.allowed) return <Paywall title="The community" body="Threads and replies are part of membership." />;
  const userId = ctx.session.user.id;

  const { postId } = await params;
  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    include: {
      author: { select: { id: true, name: true, image: true, isFounding: true, profile: { select: { profession: true } } } },
      chapter: { select: { slug: true, city: true } },
      comments: {
        where: { hiddenAt: null },
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, image: true, profile: { select: { profession: true } } } },
          _count: { select: { reactions: true } },
          reactions: { where: { userId }, select: { id: true } },
        },
      },
      _count: { select: { reactions: true } },
      reactions: { where: { userId }, select: { id: true } },
    },
  });
  if (!post || post.hiddenAt) notFound();

  const [allRooms, mediaByPost] = await Promise.all([getAllRooms(), mediaForPosts([post.id])]);
  const media = mediaByPost.get(post.id) ?? [];
  const space = normalizeSpace(post.space, allRooms);
  const room = roomById(space, allRooms);
  if (!canReadRoom(space, ctx.professional, allRooms)) {
    return space === "case-room" ? (
      <Paywall title="The Case Room" body="Anonymised case discussion is part of Professional membership." href="/pricing#professional" cta="See Professional" />
    ) : (
      <Paywall title={room?.label ?? "This space"} body="This space is part of Professional membership." href="/pricing#professional" cta="See Professional" />
    );
  }
  const canReply = canPostInRoom(space, ctx, allRooms);
  // Replies hang under the comment they answer; a reply whose parent was hidden shows at the top level.
  const visible = new Set(post.comments.map((c) => c.id));
  const topLevel = post.comments.filter((c) => !c.parentId || !visible.has(c.parentId));
  const repliesTo = (id: string) => post.comments.filter((c) => c.parentId === id);
  type ThreadComment = (typeof post.comments)[number];
  const renderComment = (c: ThreadComment, nested: boolean) => (
    <div id={`comment-${c.id}`} className={cn("flex scroll-mt-24 gap-3", nested ? "pt-3" : "")}>
      <Link href={`/members/people/${c.author.id}`} className="shrink-0">
        <Avatar name={c.author.name} src={c.author.image} size="sm" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <Link href={`/members/people/${c.author.id}`} className="font-medium hover:underline">
            {c.author.name || "Member"}
          </Link>
          <span className="text-muted-foreground"> · {timeAgo(c.createdAt)}</span>
        </p>
        <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-ink-2">{c.content}</p>
        <div className="-ml-1 mt-2 flex flex-wrap items-center gap-1">
          <UsefulButton commentId={c.id} count={c._count.reactions} reacted={c.reactions.length > 0} size="xs" />
          {canReply && <ReplyToComment postId={post.id} parentId={c.parentId ?? c.id} name={firstName(c.author.name) || "this member"} />}
          {c.author.id !== userId && <ReportButton commentId={c.id} />}
        </div>
      </div>
    </div>
  );
  const discipline = post.author.profile?.profession ? professionById(post.author.profile.profession)?.label : null;

  return (
    <MemberPage size="narrow">
      {shared === "1" && (
        <p role="status" className="mb-4 rounded-2xl border border-positive/25 bg-positive/10 px-4 py-3 text-sm text-positive">
          Your post is live in The Lounge, so colleagues can see you are going and join you.
        </p>
      )}
      <Link
        href={`/members/community?space=${space}`}
        className="-ml-2 inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-sm text-ink-2 hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> {room?.label ?? "Community"}
      </Link>

      <article className="mt-3 rounded-3xl border border-rule bg-card p-5 sm:p-7">
        <header className="flex items-center gap-3">
          <Link href={`/members/people/${post.author.id}`}>
            <Avatar name={post.author.name} src={post.author.image} />
          </Link>
          <div className="min-w-0">
            <Link href={`/members/people/${post.author.id}`} className="font-medium hover:underline">
              {post.author.name || "Member"}
            </Link>
            <p className="text-[13px] text-muted-foreground">
              {[discipline, post.chapter?.city, timeAgo(post.createdAt)].filter(Boolean).join(" · ")}
            </p>
          </div>
        </header>
        {post.title && <h1 className="display mt-5 text-3xl sm:text-4xl">{post.title}</h1>}
        {post.content && <div className="mt-4 whitespace-pre-line text-[16px] leading-[1.7] text-ink-2">{post.content}</div>}
        <PostMedia media={media} className="mt-5" />
        <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-4">
          <UsefulButton postId={post.id} count={post._count.reactions} reacted={post.reactions.length > 0} size="lg" />
          {post.author.id !== userId && <ReportButton postId={post.id} />}
        </footer>
      </article>

      <section className="mt-8" aria-labelledby="replies">
        <h2 id="replies" className="label mb-3 text-muted-foreground">
          {post.comments.length === 0 ? "No replies yet" : `${post.comments.length} ${post.comments.length === 1 ? "reply" : "replies"}`}
        </h2>
        <ol className="flex flex-col gap-3">
          {topLevel.map((c) => {
            const replies = repliesTo(c.id);
            return (
              <li key={c.id} className="rounded-2xl border border-rule bg-card p-4">
                {renderComment(c, false)}
                {replies.length > 0 && (
                  <ol className="ml-11 mt-3 flex flex-col divide-y divide-rule border-l border-rule pl-4">
                    {replies.map((r) => (
                      <li key={r.id}>{renderComment(r, true)}</li>
                    ))}
                  </ol>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <div className="mt-6">
        {canReply ? (
          <CommentForm postId={post.id} />
        ) : (
          <p className="rounded-2xl border border-rule bg-paper-2 p-4 text-sm leading-relaxed text-ink-2">
            {room?.archived
              ? `You can read this thread. ${room.label} has been archived, so it no longer takes new replies.`
              : `You can read this thread. Replies in ${room?.label ?? "this space"} are open to Professional members.`}
          </p>
        )}
      </div>
    </MemberPage>
  );
}
