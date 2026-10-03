import Link from "next/link";
import { MessageCircle, Pin } from "lucide-react";
import { professionById } from "@/config/rooms";
import type { FeedPost } from "@/lib/community";
import { Avatar } from "@/components/members/Avatar";
import { timeAgo } from "@/components/members/format";
import { UsefulButton } from "./UsefulButton";

export function PostCard({ post, showSpace = true }: { post: FeedPost; showSpace?: boolean }) {
  const discipline = post.author.profession ? professionById(post.author.profession)?.label : null;
  const href = `/members/community/${post.id}`;

  return (
    <article className="relative rounded-2xl border border-rule bg-card p-4 transition-colors hover:border-ink/25 sm:p-5">
      <header className="flex items-start gap-3">
        <Link href={`/members/people/${post.author.id}`} className="relative z-10 shrink-0">
          <Avatar name={post.author.name} size="md" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 text-[15px] leading-tight">
            <Link href={`/members/people/${post.author.id}`} className="relative z-10 font-medium hover:underline">
              {post.author.name || "Member"}
            </Link>
            {post.author.isFounding && <span className="text-[11px] text-muted-foreground">Founding member</span>}
          </p>
          <p className="mt-1 truncate text-[13px] text-muted-foreground">
            {[discipline, showSpace && post.spaceLabel, post.chapter?.city, timeAgo(post.createdAt)].filter(Boolean).join(" · ")}
          </p>
        </div>
        {post.pinned && (
          <span className="inline-flex items-center gap-1 rounded-full bg-paper-2 px-2.5 py-1 text-[11px] font-medium text-ink-2">
            <Pin className="h-3 w-3" /> Pinned
          </span>
        )}
      </header>

      <Link href={href} className="mt-3 block after:absolute after:inset-0 after:rounded-2xl" aria-label={post.title || "Open thread"}>
        {post.title && <h3 className="text-[17px] font-semibold leading-snug tracking-[-0.01em] text-ink">{post.title}</h3>}
        <p className={`${post.title ? "mt-1.5" : ""} line-clamp-4 whitespace-pre-line text-[15px] leading-relaxed text-ink-2`}>
          {post.content}
        </p>
      </Link>

      <footer className="relative z-10 mt-4 flex items-center gap-2">
        <UsefulButton postId={post.id} count={post.useful} reacted={post.reacted} />
        <Link
          href={`${href}#reply`}
          className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-ink-2 hover:bg-paper-2"
        >
          <MessageCircle className="h-4 w-4 stroke-[1.6]" />
          {post.comments === 0 ? "Reply" : `${post.comments} ${post.comments === 1 ? "reply" : "replies"}`}
        </Link>
      </footer>
    </article>
  );
}
