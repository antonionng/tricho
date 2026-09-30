import Link from "next/link";
import { Pin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { normalizeSpace, roomById } from "@/config/rooms";
import { excerpt } from "@/agents/util";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { Card, Empty, Notice, PageHeader, Section, Tag, dateTime } from "@/components/studio/ui";
import { studioPage } from "../_lib/guard";
import { deletePostAction, resolveReportAction, togglePinAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmDelete?: string; notice?: string }>;
}) {
  if (!(await studioPage("/studio/community"))) return null;
  const { confirmDelete, notice } = await searchParams;

  const [reports, posts] = await Promise.all([
    prisma.report.findMany({
      where: { resolvedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        post: { select: { id: true, title: true, content: true, space: true, pinned: true, author: { select: { name: true } } } },
        reporter: { select: { name: true } },
      },
    }),
    prisma.communityPost.findMany({
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
        _count: { select: { comments: true, reactions: true } },
      },
    }),
  ]);

  const deleteForm = (postId: string) =>
    confirmDelete === postId ? (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2">
        <span className="text-sm text-destructive">Remove this post and its replies for good?</span>
        <form action={deletePostAction}>
          <input type="hidden" name="postId" value={postId} />
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
      <form action={deletePostAction}>
        <input type="hidden" name="postId" value={postId} />
        <Button type="submit" size="xs" variant="outline">
          Remove post…
        </Button>
      </form>
    );

  return (
    <div className="space-y-12">
      <PageHeader
        title="Community"
        intro="Posts that members, or the Community host, have flagged for you to look at. You can also pin posts to the top of their space."
      />

      {notice && <Notice>{notice}</Notice>}

      <Section title={`Flagged posts (${reports.length})`}>
        {reports.length === 0 ? (
          <Empty>Nothing has been flagged. Everything looks fine.</Empty>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <Card key={r.id} className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Tag tone={r.source === "member" ? "default" : "warn"}>
                    {r.source === "member" ? `Flagged by ${r.reporter?.name ?? "a member"}` : "Flagged by the Community host"}
                  </Tag>
                  <span>{roomById(normalizeSpace(r.post.space))?.label}</span>
                  <span>· {dateTime(r.createdAt)}</span>
                </div>
                <p className="text-sm font-medium text-ink">{r.reason}</p>
                <blockquote className="rounded-xl bg-paper-2 p-4 text-sm text-ink-2">
                  {r.post.title && <p className="mb-1 font-medium text-ink">{r.post.title}</p>}
                  {excerpt(r.post.content, 400)}
                  <p className="mt-2 text-xs text-muted-foreground">Posted by {r.post.author.name ?? "a member"}</p>
                </blockquote>
                <div className="flex flex-wrap items-center gap-2">
                  <form action={resolveReportAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <SubmitButton size="xs" pendingLabel="Saving…">
                      It&apos;s fine, resolve
                    </SubmitButton>
                  </form>
                  <Button asChild size="xs" variant="ghost">
                    <Link href={`/members/community/${r.post.id}`} target="_blank">
                      Open post
                    </Link>
                  </Button>
                  {deleteForm(r.post.id)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="Recent posts" intro="Pinned posts stay at the top of their space.">
        {posts.length === 0 ? (
          <Empty>No posts yet.</Empty>
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
                    {roomById(normalizeSpace(p.space))?.label} · {p.author.name ?? "Member"} · {dateTime(p.createdAt)} ·{" "}
                    {p._count.comments} repl{p._count.comments === 1 ? "y" : "ies"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <form action={togglePinAction}>
                    <input type="hidden" name="postId" value={p.id} />
                    <SubmitButton size="xs" variant="outline" pendingLabel="Saving…">
                      {p.pinned ? "Unpin" : "Pin"}
                    </SubmitButton>
                  </form>
                  {deleteForm(p.id)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
