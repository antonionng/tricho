import Link from "next/link";
import { ExternalLink, Lightbulb, Plus, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { rowToPost } from "@/lib/blog";
import { Button } from "@/components/ui/button";
import { Card, Empty, Notice, PageHeader, Section, Tag, NoAccess, dateOnly, dateTime } from "@/components/studio/ui";
import { categoryName, filePosts, type BlogPost } from "@/content/blog";
import { scorePost } from "@/content/blog/quality";
import { STEP_LABEL, writerState } from "@/content/blog/writer";
import { studioPage } from "../_lib/guard";
import { ScoreTag } from "./ScoreTag";

export const dynamic = "force-dynamic";

export default async function BlogStudioPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const staff = await studioPage("/studio/blog", "gazette.view");
  if (!staff) return <NoAccess what="the blog" />;
  const sp = await searchParams;
  const canEdit = staff.perms.has("gazette.edit");

  const [rows, ideas] = await Promise.all([
    prisma.blogArticle.findMany({ where: { status: { not: "archived" } }, orderBy: { updatedAt: "desc" } }).catch(() => null),
    prisma.draft.count({ where: { kind: "blog_idea", status: "draft" } }),
  ]);
  if (rows === null) {
    return (
      <div className="space-y-6">
        <PageHeader title="Blog" />
        <Notice tone="danger">The blog table isn&apos;t in the database yet. Run the migrations (npx prisma migrate deploy) and reload.</Notice>
      </div>
    );
  }

  const writing = rows.filter((r) => r.status === "writing");
  const drafts = rows.filter((r) => r.status === "draft");
  const live = rows.filter((r) => r.status === "published");
  const score = (p: BlogPost, targetQuery?: string) => scorePost({ ...p, targetQuery }).score;

  const Row = ({ r }: { r: (typeof rows)[number] }) => {
    const post = rowToPost(r);
    const ai = writerState(r.ai);
    return (
      <li>
        <Link href={`/studio/blog/${r.id}`} className="flex flex-col gap-2 p-5 hover:bg-paper-2/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="truncate font-medium text-ink">{r.title || r.targetQuery}</p>
            <p className="text-[13px] text-muted-foreground">
              {categoryName(post.category)} · {r.origin === "agent" ? "Idea from the blog agent" : "Started in Studio"} · updated {dateTime(r.updatedAt)}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {r.status === "writing" && ai && <Tag tone={ai.step === "failed" ? "danger" : "warn"}>{ai.step === "failed" ? "Writer stopped" : STEP_LABEL[ai.step]}</Tag>}
            {ai?.review && r.status !== "writing" && (
              <Tag tone={ai.review.verdict === "ready" || ai.fixed ? "positive" : "warn"}>{ai.review.verdict === "ready" ? "Fact-check passed" : ai.fixed ? "Fact-check issues fixed" : "Fact-check notes"}</Tag>
            )}
            {r.status !== "writing" && <ScoreTag score={score(post, r.targetQuery)} />}
            {r.status === "published" && <Tag tone="ink">Live {dateOnly(r.publishedAt)}</Tag>}
          </div>
        </Link>
      </li>
    );
  };

  return (
    <div className="space-y-10">
      <PageHeader
        title="Blog"
        intro="Ask a question and the AI writer plans the post, reads trusted sources such as the NHS, HSE and DermNet, writes it, fact-checks itself and fixes what it finds. You edit, preview and publish. Every post is scored for Google and AI assistants as you work."
        actions={
          canEdit && (
            <Button asChild>
              <Link href="/studio/blog/new">
                <Sparkles /> Write a post with AI
              </Link>
            </Button>
          )
        }
      />

      {sp.notice && <Notice>{sp.notice}</Notice>}

      {ideas > 0 && (
        <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">
                The blog agent has {ideas} post {ideas === 1 ? "idea" : "ideas"} waiting for you.
              </p>
              <p className="text-sm text-muted-foreground">They come from questions in the community and topics we don&apos;t cover yet. Approve one and the writer starts on it.</p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/studio/inbox?kind=blog_idea">Review ideas</Link>
          </Button>
        </Card>
      )}

      {writing.length > 0 && (
        <Section title="Being written">
          <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
            {writing.map((r) => (
              <Row key={r.id} r={r} />
            ))}
          </ul>
        </Section>
      )}

      <Section title="Drafts" intro="Written and waiting for an edit before they go live.">
        {drafts.length === 0 ? (
          <Empty>No drafts yet. Start one with a question your clients or colleagues keep asking.</Empty>
        ) : (
          <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
            {drafts.map((r) => (
              <Row key={r.id} r={r} />
            ))}
          </ul>
        )}
      </Section>

      <Section title="Live from Studio">
        {live.length === 0 ? (
          <Empty>Nothing published from Studio yet.</Empty>
        ) : (
          <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
            {live.map((r) => (
              <Row key={r.id} r={r} />
            ))}
          </ul>
        )}
      </Section>

      <Section title="Live from the codebase" intro="These posts are kept in src/content/blog and change through a code release.">
        <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
          {filePosts.map((p) => (
            <li key={p.slug} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="truncate font-medium">{p.title}</p>
                <p className="text-[13px] text-muted-foreground">
                  {categoryName(p.category)} · published {p.published}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ScoreTag score={score(p)} />
                <Link href={`/blog/${p.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink">
                  View <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {canEdit && (
        <p className="text-sm text-muted-foreground">
          <Plus className="mr-1 inline h-4 w-4" />
          The blog agent suggests new ideas every Monday. You can also run it now from <Link href="/studio/agents" className="underline">Agents</Link>.
        </p>
      )}
    </div>
  );
}
