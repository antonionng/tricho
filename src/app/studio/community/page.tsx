import Link from "next/link";
import { Pin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { normalizeSpace, roomById, type Room } from "@/config/rooms";
import { getAllRooms } from "@/lib/rooms";
import { excerpt } from "@/agents/util";
import { parseVerdict, type ModerationVerdict } from "@/agents/moderation";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { Card, Empty, Notice, PageHeader, Section, Tag, dateTime, fieldClass, NoAccess } from "@/components/studio/ui";
import { cn } from "@/lib/utils";
import { studioPage } from "../_lib/guard";
import { deletePostAction, togglePinAction } from "../actions";
import {
  dismissReportsAction,
  draftLaunchPostsAction,
  escalateReportsAction,
  hideContentAction,
  muteAuthorAction,
  removeCommentAction,
  unhideContentAction,
} from "./actions";

export const dynamic = "force-dynamic";

const CATEGORY: Record<ModerationVerdict["category"], string> = {
  privacy: "Client privacy",
  medical_claim: "Medical claim",
  promotion: "Promotion",
  abuse: "Abuse",
  other: "Other",
};

const SUGGESTION: Record<ModerationVerdict["suggestedAction"], string> = {
  none: "No action needed",
  review: "Worth a look",
  hide: "Suggests hiding it",
};

function sourceLabel(source: string, reporter: string | null | undefined) {
  if (source === "member") return `Reported by ${reporter ?? "a member"}`;
  if (source === "moderation") return "Flagged by the moderation assistant";
  if (source === "community") return "Flagged by the Community host";
  return `Flagged by ${source}`;
}

function roomLabel(space: string, rooms: Room[]) {
  return roomById(normalizeSpace(space, rooms), rooms)?.label ?? space;
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmDelete?: string; notice?: string }>;
}) {
  const staff = await studioPage("/studio/community", "community.view");
  if (!staff) return <NoAccess what="the community" />;
  const canModerate = staff.perms.has("community.moderate");
  const canManageRooms = staff.perms.has("community.rooms");
  const { confirmDelete, notice } = await searchParams;

  const authorSelect = { select: { id: true, name: true, mutedUntil: true } } as const;
  const [reports, hiddenPosts, hiddenComments, posts, rooms] = await Promise.all([
    prisma.report.findMany({
      where: { resolvedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        post: { select: { id: true, title: true, content: true, space: true, hiddenAt: true, author: authorSelect } },
        comment: { select: { id: true, content: true, hiddenAt: true, author: authorSelect } },
        reporter: { select: { name: true } },
      },
    }),
    prisma.communityPost.findMany({
      where: { hiddenAt: { not: null } },
      orderBy: { hiddenAt: "desc" },
      take: 20,
      select: { id: true, title: true, content: true, space: true, hiddenAt: true, hiddenReason: true, author: { select: { name: true } } },
    }),
    prisma.comment.findMany({
      where: { hiddenAt: { not: null } },
      orderBy: { hiddenAt: "desc" },
      take: 20,
      select: {
        id: true,
        content: true,
        hiddenAt: true,
        hiddenReason: true,
        author: { select: { name: true } },
        post: { select: { id: true, title: true, content: true, space: true } },
      },
    }),
    prisma.communityPost.findMany({
      where: { hiddenAt: null },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 40,
      select: {
        id: true,
        title: true,
        content: true,
        space: true,
        pinned: true,
        createdAt: true,
        author: { select: { name: true } },
        _count: { select: { comments: { where: { hiddenAt: null } }, reactions: true } },
      },
    }),
    getAllRooms(),
  ]);

  /* One card per post or reply, however many reports it has. */
  type Group = { key: string; reports: typeof reports };
  const groups = new Map<string, Group>();
  for (const r of reports) {
    const key = `${r.postId}:${r.commentId ?? ""}`;
    const group = groups.get(key) ?? { key, reports: [] };
    group.reports.push(r);
    groups.set(key, group);
  }
  const queue = [...groups.values()];

  const hidden = [
    ...hiddenPosts.map((p) => ({
      key: `post:${p.id}`,
      postId: p.id,
      commentId: null as string | null,
      kind: "Post",
      title: p.title ?? excerpt(p.content, 70),
      text: p.content,
      space: p.space,
      author: p.author.name,
      hiddenAt: p.hiddenAt!,
      hiddenReason: p.hiddenReason,
    })),
    ...hiddenComments.map((c) => ({
      key: `comment:${c.id}`,
      postId: c.post.id,
      commentId: c.id as string | null,
      kind: "Reply",
      title: `On “${c.post.title ?? excerpt(c.post.content, 60)}”`,
      text: c.content,
      space: c.post.space,
      author: c.author.name,
      hiddenAt: c.hiddenAt!,
      hiddenReason: c.hiddenReason,
    })),
  ]
    .sort((a, b) => b.hiddenAt.getTime() - a.hiddenAt.getTime())
    .slice(0, 20);

  const now = new Date();

  const itemInputs = (postId: string, commentId: string | null) => (
    <>
      <input type="hidden" name="postId" value={postId} />
      {commentId && <input type="hidden" name="commentId" value={commentId} />}
    </>
  );

  const removeForm = (postId: string, commentId: string | null) => {
    const target = commentId ?? postId;
    const action = commentId ? removeCommentAction : deletePostAction;
    return confirmDelete === target ? (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2">
        <span className="text-sm text-destructive">
          {commentId ? "Remove this reply for good? This cannot be undone." : "Remove this post and its replies for good? This cannot be undone."}
        </span>
        <form action={action}>
          {itemInputs(postId, commentId)}
          <input type="hidden" name="confirm" value="yes" />
          <SubmitButton size="xs" variant="destructive" pendingLabel="Removing…">
            Yes, remove it
          </SubmitButton>
        </form>
        <Button asChild size="xs" variant="ghost">
          <Link href="/studio/community">Cancel</Link>
        </Button>
      </div>
    ) : (
      <form action={action}>
        {itemInputs(postId, commentId)}
        <Button type="submit" size="xs" variant="outline">
          Remove…
        </Button>
      </form>
    );
  };

  return (
    <div className="space-y-12">
      <PageHeader
        title="Community"
        intro="Review content that members or the assistants have flagged, decide what happens to it, and keep the right posts pinned to the top of each space."
        actions={
          <>
            {canManageRooms && (
              <Button asChild variant="outline">
                <Link href="/studio/community/rooms">Manage rooms</Link>
              </Button>
            )}
            {canModerate && (
              <form action={draftLaunchPostsAction}>
                <SubmitButton variant="outline" pendingLabel="Drafting…">
                  Draft launch-week posts
                </SubmitButton>
              </form>
            )}
          </>
        }
      />

      {notice && <Notice>{notice}</Notice>}

      <Section
        title={`Waiting for review (${queue.length})`}
        intro="Each card gathers every open report about one post or reply. Whatever you decide applies to all of them."
      >
        {queue.length === 0 ? (
          <Empty>Nothing is waiting for review, so the community needs nothing from you right now.</Empty>
        ) : (
          <div className="space-y-4">
            {queue.map(({ key, reports: items }) => {
              const first = items[0];
              const isComment = !!first.comment;
              const content = first.comment ?? first.post;
              const author = first.comment?.author ?? first.post.author;
              const isHidden = !!content.hiddenAt;
              const escalated = items.some((r) => r.resolution === "escalated");
              const muted = author.mutedUntil && author.mutedUntil > now ? author.mutedUntil : null;
              const verdict = items.map((r) => parseVerdict(r.aiVerdict)).find(Boolean) ?? null;
              const postId = first.post.id;
              const commentId = first.comment?.id ?? null;

              return (
                <Card key={key} className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Tag tone="ink">{isComment ? "Reply" : "Post"}</Tag>
                    <span>{roomLabel(first.post.space, rooms)}</span>
                    {escalated && <Tag tone="danger">Escalated to the owners</Tag>}
                    {isHidden && <Tag tone="warn">Hidden from members</Tag>}
                    {muted && <Tag tone="warn">Author muted until {dateTime(muted)}</Tag>}
                  </div>

                  <ul className="space-y-2">
                    {items.map((r) => (
                      <li key={r.id} className="text-sm">
                        <span className="font-medium text-ink">{r.reason}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          · {sourceLabel(r.source, r.reporter?.name)} · {dateTime(r.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {verdict && (
                    <div className="space-y-2 rounded-xl border border-rule p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-ink">The moderation assistant&apos;s view</span>
                        <Tag tone={verdict.severity === "high" ? "danger" : verdict.severity === "low" ? "warn" : "positive"}>
                          {verdict.severity === "high" ? "High concern" : verdict.severity === "low" ? "Low concern" : "No concern"}
                        </Tag>
                        <Tag>{CATEGORY[verdict.category]}</Tag>
                        <Tag>{SUGGESTION[verdict.suggestedAction]}</Tag>
                      </div>
                      <p className="text-sm text-ink-2">{verdict.rationale}</p>
                    </div>
                  )}

                  <blockquote className="rounded-xl bg-paper-2 p-4 text-sm text-ink-2">
                    {!isComment && first.post.title && <p className="mb-1 font-medium text-ink">{first.post.title}</p>}
                    {isComment && (
                      <p className="mb-1 text-xs text-muted-foreground">
                        A reply to “{first.post.title ?? excerpt(first.post.content, 60)}”
                      </p>
                    )}
                    <span className="whitespace-pre-line">{excerpt(content.content, 600)}</span>
                    <p className="mt-2 text-xs text-muted-foreground">Written by {author.name ?? "a member"}</p>
                  </blockquote>

                  <div className="flex flex-wrap items-center gap-2">
                    {canModerate && (
                      <>
                        <form action={dismissReportsAction}>
                          {itemInputs(postId, commentId)}
                          <SubmitButton size="xs" pendingLabel="Saving…">
                            Dismiss, it&apos;s fine
                          </SubmitButton>
                        </form>
                        {isHidden ? (
                          <form action={unhideContentAction}>
                            {itemInputs(postId, commentId)}
                            <SubmitButton size="xs" variant="outline" pendingLabel="Saving…">
                              Unhide
                            </SubmitButton>
                          </form>
                        ) : (
                          <form action={hideContentAction}>
                            {itemInputs(postId, commentId)}
                            <input type="hidden" name="reason" value={first.reason.slice(0, 300)} />
                            <SubmitButton size="xs" variant="outline" pendingLabel="Hiding…">
                              Hide
                            </SubmitButton>
                          </form>
                        )}
                        {removeForm(postId, commentId)}
                        <form action={muteAuthorAction} className="flex items-center gap-1.5">
                          {itemInputs(postId, commentId)}
                          <select name="days" defaultValue="1" aria-label="How long to mute the author" className={cn(fieldClass, "w-auto py-1 text-xs")}>
                            <option value="1">24 hours</option>
                            <option value="7">7 days</option>
                            <option value="30">30 days</option>
                          </select>
                          <SubmitButton size="xs" variant="outline" pendingLabel="Muting…">
                            Mute author
                          </SubmitButton>
                        </form>
                        {!escalated && (
                          <form action={escalateReportsAction}>
                            {itemInputs(postId, commentId)}
                            <SubmitButton size="xs" variant="ghost" pendingLabel="Escalating…">
                              Escalate to owners
                            </SubmitButton>
                          </form>
                        )}
                      </>
                    )}
                    <Button asChild size="xs" variant="ghost">
                      <Link href={`/members/community/${postId}`} target="_blank">
                        Open thread
                      </Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Section>

      <Section
        title="Recently hidden"
        intro="Hidden posts and replies are invisible to members but kept here, so you can restore anything that was hidden by mistake."
      >
        {hidden.length === 0 ? (
          <Empty>Nothing has been hidden recently.</Empty>
        ) : (
          <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
            {hidden.map((h) => (
              <li key={h.key} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-0.5">
                  <p className="flex items-center gap-2 text-sm font-medium text-ink">
                    <Tag>{h.kind}</Tag>
                    <span className="truncate">{h.title}</span>
                  </p>
                  {h.commentId && <p className="truncate text-sm text-ink-2">{excerpt(h.text, 120)}</p>}
                  <p className="text-xs text-muted-foreground">
                    {roomLabel(h.space, rooms)} · {h.author ?? "Member"} · hidden {dateTime(h.hiddenAt)}
                    {h.hiddenReason ? ` · ${h.hiddenReason}` : ""}
                  </p>
                </div>
                {canModerate && (
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <form action={unhideContentAction}>
                      {itemInputs(h.postId, h.commentId)}
                      <SubmitButton size="xs" variant="outline" pendingLabel="Saving…">
                        Unhide
                      </SubmitButton>
                    </form>
                    {removeForm(h.postId, h.commentId)}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Recent posts" intro="Pinned posts stay at the top of their space until you unpin them.">
        {posts.length === 0 ? (
          <Empty>No one has posted yet.</Empty>
        ) : (
          <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
            {posts.map((p) => (
              <li key={p.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-0.5">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                    {p.pinned && <Pin className="h-3.5 w-3.5" aria-label="Pinned" />}
                    <Link href={`/members/community/${p.id}`} target="_blank" className="truncate hover:underline">
                      {p.title ?? excerpt(p.content, 70)}
                    </Link>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {roomLabel(p.space, rooms)} · {p.author.name ?? "Member"} · {dateTime(p.createdAt)} ·{" "}
                    {p._count.comments} repl{p._count.comments === 1 ? "y" : "ies"}
                  </p>
                </div>
                {canModerate && (
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <form action={togglePinAction}>
                      <input type="hidden" name="postId" value={p.id} />
                      <SubmitButton size="xs" variant="outline" pendingLabel="Saving…">
                        {p.pinned ? "Unpin" : "Pin"}
                      </SubmitButton>
                    </form>
                    <form action={hideContentAction}>
                      <input type="hidden" name="postId" value={p.id} />
                      <SubmitButton size="xs" variant="outline" pendingLabel="Hiding…">
                        Hide
                      </SubmitButton>
                    </form>
                    {removeForm(p.id, null)}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
