import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { DraftStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AGENTS, agentLabel, getAgent } from "@/agents";
import { newsletterRecipients, payloadOf } from "@/agents/publish";
import { roomById, normalizeSpace } from "@/config/rooms";
import { Button } from "@/components/ui/button";
import { DraftBody } from "@/components/studio/DraftBody";
import { InboxShortcuts } from "@/components/studio/InboxShortcuts";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { approveLabel, kindLabel, STATUS_LABEL } from "@/components/studio/labels";
import { Empty, Notice, PageHeader, Tag, dateTime, fieldClass } from "@/components/studio/ui";
import { cn } from "@/lib/utils";
import { studioPage } from "./_lib/guard";
import { approveDraftAction, regenerateDraftAction, rejectDraftAction, saveDraftAction } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_FILTERS: { id: string; label: string }[] = [
  { id: "draft", label: "Waiting" },
  { id: "approved", label: "Handled" },
  { id: "published", label: "Published" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "Everything" },
];

type Search = {
  id?: string;
  status?: string;
  agent?: string;
  notice?: string;
  tone?: string;
  confirm?: string;
};

export default async function InboxPage({ searchParams }: { searchParams: Promise<Search> }) {
  if (!(await studioPage("/studio"))) return null;
  const sp = await searchParams;
  const status = STATUS_FILTERS.some((f) => f.id === sp.status) ? sp.status! : "draft";
  const agent = sp.agent || "";

  const where: Prisma.DraftWhereInput = {
    ...(status !== "all" ? { status: status as DraftStatus } : {}),
    ...(agent ? { agent } : {}),
  };
  const [drafts, agentsInUse] = await Promise.all([
    prisma.draft.findMany({
      where,
      orderBy: { createdAt: status === "draft" ? "asc" : "desc" },
      take: 150,
      select: { id: true, title: true, kind: true, agent: true, status: true, createdAt: true, summary: true },
    }),
    prisma.draft.findMany({ distinct: ["agent"], select: { agent: true } }),
  ]);

  const filterParams = (extra: Record<string, string | undefined> = {}) => {
    const p = new URLSearchParams();
    if (status !== "draft") p.set("status", status);
    if (agent) p.set("agent", agent);
    for (const [k, v] of Object.entries(extra)) if (v) p.set(k, v);
    const q = p.toString();
    return q ? `/studio?${q}` : "/studio";
  };

  const selected = sp.id ? await prisma.draft.findUnique({ where: { id: sp.id }, include: { run: true } }) : null;
  const index = selected ? drafts.findIndex((d) => d.id === selected.id) : -1;
  const nextId = index >= 0 ? (drafts[index + 1]?.id ?? drafts[index - 1]?.id) : undefined;
  const hrefs = drafts.map((d) => filterParams({ id: d.id }));

  const agentOptions = Array.from(new Set([...AGENTS.map((a) => a.id), ...agentsInUse.map((a) => a.agent)]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inbox"
        intro="Everything the agents have drafted waits here for you. Nothing public, nothing to do with money and nothing clinical goes out until you approve it."
      />

      {sp.notice && <Notice tone={sp.tone === "danger" ? "danger" : "default"}>{sp.notice}</Notice>}

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="no-scrollbar flex gap-1 overflow-x-auto" aria-label="Filter by status">
          {STATUS_FILTERS.map((f) => {
            const p = new URLSearchParams();
            if (f.id !== "draft") p.set("status", f.id);
            if (agent) p.set("agent", agent);
            const href = p.toString() ? `/studio?${p}` : "/studio";
            return (
              <Link
                key={f.id}
                href={href}
                aria-current={status === f.id ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-sm",
                  status === f.id ? "bg-ink text-paper" : "bg-paper-2 text-ink-2 hover:text-ink"
                )}
              >
                {f.label}
              </Link>
            );
          })}
        </nav>
        <form action="/studio" className="flex items-center gap-2">
          {status !== "draft" && <input type="hidden" name="status" value={status} />}
          <label className="text-sm text-muted-foreground" htmlFor="agent-filter">
            From
          </label>
          <select id="agent-filter" name="agent" defaultValue={agent} className={cn(fieldClass, "w-auto py-1.5")}>
            <option value="">Every agent</option>
            {agentOptions.map((a) => (
              <option key={a} value={a}>
                {agentLabel(a)}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" variant="outline">
            Show
          </Button>
        </form>
      </div>

      <InboxShortcuts hrefs={hrefs} currentIndex={index} />

      <div className="grid gap-6 lg:grid-cols-[minmax(300px,380px)_1fr]">
        {/* List */}
        <div className={cn("space-y-2", selected && "hidden lg:block")}>
          {drafts.length === 0 && (
            <Empty>{status === "draft" ? "All clear. Nothing is waiting for you." : "Nothing here with these filters."}</Empty>
          )}
          <ul className="flex flex-col gap-1.5 lg:max-h-[calc(100vh-16rem)] lg:overflow-y-auto lg:pr-1">
            {drafts.map((d) => {
              const current = d.id === selected?.id;
              return (
                <li key={d.id}>
                  <Link
                    href={filterParams({ id: d.id })}
                    scroll={false}
                    data-current={current ? "true" : undefined}
                    aria-current={current ? "true" : undefined}
                    className={cn(
                      "block rounded-2xl border px-4 py-3 transition-colors",
                      current ? "border-ink bg-ink text-paper" : "border-rule bg-card hover:border-ink/30"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className={current ? "text-paper/70" : "text-muted-foreground"}>
                        {kindLabel(d.kind)} · {agentLabel(d.agent)}
                      </span>
                      <span className={current ? "text-paper/70" : "text-muted-foreground"}>{dateTime(d.createdAt)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[15px] font-medium leading-snug">{d.title}</p>
                    {status === "all" && (
                      <p className={cn("mt-1 text-xs", current ? "text-paper/70" : "text-muted-foreground")}>
                        {STATUS_LABEL[d.status]}
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Detail */}
        <div className={cn(!selected && "hidden lg:block")}>
          {!selected ? (
            <Empty>
              {drafts.length ? "Choose something from the list to read it, edit it and decide what to do." : "When the agents draft something, it will appear here."}
            </Empty>
          ) : (
            <DraftDetail
              draft={selected}
              nextId={nextId}
              backHref={filterParams()}
              filters={{ status: status !== "draft" ? status : "", agent }}
              confirm={sp.confirm === "1"}
            />
          )}
        </div>
      </div>
    </div>
  );
}

type SelectedDraft = Prisma.DraftGetPayload<{ include: { run: true } }>;

async function DraftDetail({
  draft,
  nextId,
  backHref,
  filters,
  confirm,
}: {
  draft: SelectedDraft;
  nextId?: string;
  backHref: string;
  filters: { status: string; agent: string };
  confirm: boolean;
}) {
  const payload = payloadOf(draft);
  const open = draft.status === "draft";
  const canRegenerate = !!getAgent(draft.agent) && draft.status !== "published";
  const recipients = draft.kind === "newsletter" && confirm ? await newsletterRecipients() : null;
  const space = typeof payload.space === "string" ? roomById(normalizeSpace(payload.space)) : null;

  const hidden = (
    <>
      <input type="hidden" name="id" value={draft.id} />
      <input type="hidden" name="f_status" value={filters.status} />
      <input type="hidden" name="f_agent" value={filters.agent} />
    </>
  );

  const facts: [string, React.ReactNode][] = [];
  if (typeof payload.to === "string") facts.push(["To", payload.to]);
  if (typeof payload.subject === "string") facts.push(["Subject", payload.subject]);
  if (space) facts.push(["Space", space.label]);
  if (typeof payload.edition === "string") facts.push(["Edition", payload.edition]);
  if (typeof payload.href === "string")
    facts.push([
      "Post",
      <Link key="post" href={payload.href} target="_blank" className="inline-flex items-center gap-1 underline underline-offset-4">
        Open the post <ExternalLink className="h-3.5 w-3.5" />
      </Link>,
    ]);
  if (typeof payload.postId === "string" && draft.kind === "community_post")
    facts.push([
      "Posted",
      <Link key="posted" href={`/members/community/${payload.postId}`} target="_blank" className="underline underline-offset-4">
        View in the community
      </Link>,
    ]);
  if (draft.kind === "partner_enquiry") {
    for (const key of ["company", "name", "email", "role", "interest", "budget"]) {
      const v = payload[key];
      if (typeof v === "string" && v) facts.push([key.charAt(0).toUpperCase() + key.slice(1), v]);
    }
  }
  if (typeof payload.sentCount === "number") facts.push(["Sent to", `${payload.sentCount} people`]);

  return (
    <article className="space-y-6 rounded-3xl border border-rule bg-card p-5 sm:p-8">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-ink-2 lg:hidden">
        <ArrowLeft className="h-4 w-4" /> Back to the list
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone={draft.status === "draft" ? "ink" : draft.status === "rejected" ? "danger" : "positive"}>
            {STATUS_LABEL[draft.status]}
          </Tag>
          <Tag>{kindLabel(draft.kind)}</Tag>
          <Tag>{agentLabel(draft.agent)}</Tag>
          <span className="text-xs text-muted-foreground">Drafted {dateTime(draft.createdAt)}</span>
          {draft.publishedAt && <span className="text-xs text-muted-foreground">· Published {dateTime(draft.publishedAt)}</span>}
        </div>
        <h2 className="display text-3xl leading-tight sm:text-4xl">{draft.title}</h2>
        {draft.summary && <p className="text-[15px] text-ink-2">{draft.summary}</p>}
      </header>

      {facts.length > 0 && (
        <dl className="grid gap-x-6 gap-y-2 rounded-2xl bg-paper-2 p-4 text-sm sm:grid-cols-[auto_1fr]">
          {facts.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="break-words font-medium text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {draft.reviewerNote && (
        <p className="rounded-2xl border border-rule p-4 text-sm text-ink-2">
          <span className="font-medium text-ink">Your note: </span>
          {draft.reviewerNote}
        </p>
      )}

      <div className="border-t border-rule pt-6">
        <DraftBody body={draft.body} />
      </div>

      {/* Newsletter confirm step */}
      {open && draft.kind === "newsletter" && recipients && (
        <div className="space-y-3 rounded-2xl border-2 border-ink p-5">
          <p className="font-medium text-ink">
            Send this newsletter to {recipients.length} {recipients.length === 1 ? "person" : "people"}?
          </p>
          <p className="text-sm text-ink-2">
            That&apos;s every subscriber who hasn&apos;t unsubscribed, plus every active member. It can&apos;t be unsent.
          </p>
          <div className="flex flex-wrap gap-2">
            <form action={approveDraftAction}>
              {hidden}
              <input type="hidden" name="confirm" value="yes" />
              {nextId && <input type="hidden" name="nextId" value={nextId} />}
              <SubmitButton pendingLabel="Sending…">Yes, send it now</SubmitButton>
            </form>
            <Button asChild variant="outline">
              <Link href={`${backHref}${backHref.includes("?") ? "&" : "?"}id=${draft.id}`}>Not yet</Link>
            </Button>
          </div>
        </div>
      )}

      {open && (
        <div className="space-y-5 border-t border-rule pt-6">
          <div className="flex flex-wrap gap-2">
            <form action={approveDraftAction}>
              {hidden}
              {nextId && <input type="hidden" name="nextId" value={nextId} />}
              <SubmitButton data-shortcut="approve" pendingLabel="Publishing…">
                {approveLabel(draft.kind)}
              </SubmitButton>
            </form>
            {canRegenerate && (
              <form action={regenerateDraftAction}>
                {hidden}
                <SubmitButton variant="outline" pendingLabel="Asking the agent…">
                  Regenerate
                </SubmitButton>
              </form>
            )}
          </div>

          <details className="group rounded-2xl border border-rule">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-ink">
              Edit the wording <span className="text-muted-foreground group-open:hidden">(opens an editor)</span>
            </summary>
            <form action={saveDraftAction} className="space-y-3 border-t border-rule p-4">
              {hidden}
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Title</span>
                <input name="title" defaultValue={draft.title} className={fieldClass} required />
              </label>
              {draft.kind === "email" && (
                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium">To</span>
                  <input name="to" type="email" defaultValue={String(payload.to ?? "")} className={fieldClass} />
                </label>
              )}
              {(draft.kind === "email" || draft.kind === "newsletter") && (
                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium">Subject line</span>
                  <input name="subject" defaultValue={String(payload.subject ?? draft.title)} className={fieldClass} />
                </label>
              )}
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Text</span>
                <textarea name="body" defaultValue={draft.body} rows={16} className={cn(fieldClass, "font-[inherit] leading-relaxed")} required />
                <span className="text-xs text-muted-foreground">
                  Leave a blank line between paragraphs. Start a line with &quot;## &quot; for a subheading.
                </span>
              </label>
              <SubmitButton size="sm" pendingLabel="Saving…">
                Save changes
              </SubmitButton>
            </form>
          </details>

          <form action={rejectDraftAction} className="space-y-2 rounded-2xl border border-rule p-4">
            {hidden}
            {nextId && <input type="hidden" name="nextId" value={nextId} />}
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Reject with a note</span>
              <textarea
                name="note"
                data-shortcut="reject-note"
                rows={2}
                placeholder="What's wrong with it? This helps the next draft."
                className={fieldClass}
              />
            </label>
            <SubmitButton size="sm" variant="outline" pendingLabel="Rejecting…">
              Reject
            </SubmitButton>
          </form>
        </div>
      )}

      {draft.run && (
        <p className="border-t border-rule pt-4 text-xs text-muted-foreground">
          Drafted during a {draft.run.trigger} run on {dateTime(draft.run.startedAt)}.
        </p>
      )}
    </article>
  );
}
