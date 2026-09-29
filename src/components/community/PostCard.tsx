import Link from "next/link";
import { MessageCircle, ThumbsUp } from "lucide-react";
import { roomById } from "@/config/rooms";
import { toggleUseful } from "@/app/members/community/actions";
import type { FeedPost } from "@/app/members/community/actions";

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function initials(name: string | null) {
  if (!name) return "M";
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function PostCard({ post }: { post: FeedPost }) {
  const room = roomById(post.space);
  return (
    <article className="rounded-2xl border border-border/50 bg-card p-5 md:p-6 space-y-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-semibold shrink-0">
          {initials(post.author.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-sm">{post.author.name || "Member"}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground capitalize">{post.author.role}</span>
            {post.pinned && (
              <span className="text-[10px] uppercase tracking-wide rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                Start here
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {room?.label || post.space} · {formatWhen(post.createdAt)}
          </p>
        </div>
      </div>

      <Link href={`/members/community/${post.id}`} className="block space-y-2 group">
        {post.title && (
          <h2 className="text-lg font-semibold tracking-tight group-hover:text-primary">
            {post.title}
          </h2>
        )}
        <p className="text-sm text-foreground/85 whitespace-pre-wrap leading-relaxed line-clamp-6">
          {post.content}
        </p>
      </Link>

      <div className="flex items-center gap-4 pt-1 border-t border-border/40">
        <form action={toggleUseful}>
          <input type="hidden" name="postId" value={post.id} />
          <button
            type="submit"
            className={`inline-flex items-center gap-1.5 text-sm py-2 ${
              post.reacted ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ThumbsUp className="h-4 w-4" />
            Useful
            {post._count.reactions > 0 && (
              <span className="text-xs">({post._count.reactions})</span>
            )}
          </button>
        </form>
        <Link
          href={`/members/community/${post.id}`}
          className="inline-flex items-center gap-1.5 text-sm py-2 text-muted-foreground hover:text-foreground"
        >
          <MessageCircle className="h-4 w-4" />
          Comment
          {post._count.comments > 0 && (
            <span className="text-xs">({post._count.comments})</span>
          )}
        </Link>
      </div>
    </article>
  );
}
