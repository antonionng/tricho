import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/studio/SubmitButton";
import { Card, Empty, Field, Notice, PageHeader, Section, Tag, NoAccess, dateTime, fieldClass } from "@/components/studio/ui";
import { editionLabel, PUBLIC_PREVIEW_PAGES, type Block } from "@/content/gazette";
import {
  BLOCK_TYPES,
  DISCIPLINES,
  EDITABLE_KINDS,
  NEWS_TOPICS,
  PAGE_KIND_LABEL,
  PageSchema,
  describeError,
  type EditablePage,
} from "@/content/gazette/schema";
import { isPending, parseBrief, type PendingPage } from "@/agents/gazette-edition";
import { aiAvailable } from "@/agents/ai";
import { cn } from "@/lib/utils";
import { studioPage } from "../../_lib/guard";
import {
  addPageAction,
  deleteEditionAction,
  deletePageAction,
  fillTemplatesAction,
  generateRemainingAction,
  movePageAction,
  publishEditionAction,
  regeneratePageAction,
  restoreRevisionAction,
  saveMetaAction,
  savePageAction,
  savePageJsonAction,
  withdrawEditionAction,
} from "../actions";
import { ImagePicker } from "../ImagePicker";
import { STATUS_LABEL, STATUS_TONE, labelFields } from "../labels";
import { GenerationRunner } from "./GenerationRunner";

export const dynamic = "force-dynamic";

const BLOCK_LABEL: Record<Block["type"], string> = {
  p: "Paragraph",
  h: "Subheading",
  list: "List",
  pull: "Pull quote",
  callout: "Callout",
  checklist: "Checklist",
  quiz: "Quiz",
  reveal: "Reveal",
};

const DISCIPLINE_LABEL = { cosmetic: "Cosmetic", clinical: "Clinical", medical: "Medical" } as const;

/** A date as the London wall-clock value a datetime-local input expects. */
function londonInput(d: Date | null | undefined) {
  if (!d) return "";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function titleOf(p: unknown) {
  const page = p as { title?: string; caption?: string };
  return page?.title || page?.caption || "Untitled page";
}

export default async function EditionEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; tab?: string; notice?: string; tone?: string }>;
}) {
  const { id } = await params;
  const staff = await studioPage(`/studio/gazette/${id}`, "gazette.view");
  if (!staff) return <NoAccess what="Trichozette" />;
  const sp = await searchParams;
  const row = await prisma.gazetteEdition.findUnique({ where: { id } });
  if (!row) notFound();

  const canEdit = staff.perms.has("gazette.edit");
  const canPublish = staff.perms.has("gazette.publish");
  const generating = row.status === "generating";
  const live = row.status === "published" || row.status === "scheduled";
  const locked = !canEdit || generating;
  const pages = Array.isArray(row.pages) ? (row.pages as unknown[]) : [];
  const pendingCount = pages.filter(isPending).length;
  const selected = Math.max(0, Math.min(Number(sp.page) || 0, pages.length - 1));
  const tab = sp.tab === "meta" || sp.tab === "history" ? sp.tab : "pages";
  const brief = parseBrief(row.brief);

  const revisions =
    tab === "history"
      ? await prisma.gazetteRevision.findMany({
          where: { editionId: row.id },
          orderBy: { createdAt: "desc" },
          take: 40,
          select: { id: true, note: true, createdAt: true, authorId: true },
        })
      : [];
  const authors = revisions.length
    ? new Map(
        (
          await prisma.user.findMany({
            where: { id: { in: [...new Set(revisions.map((r) => r.authorId).filter((a): a is string => !!a))] } },
            select: { id: true, name: true, email: true },
          })
        ).map((u) => [u.id, u.name ?? u.email ?? "Someone"])
      )
    : new Map<string, string>();

  return (
    <div className="space-y-8">
      <PageHeader
        title={row.title}
        intro={
          <>
            <Tag tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Tag>{" "}
            {row.number > 0 && <span className="ml-1">{editionLabel(labelFields(row))} · </span>}
            {pages.length} {pages.length === 1 ? "page" : "pages"}
            {row.status === "scheduled" && row.scheduledFor && <> · Goes live {dateTime(row.scheduledFor)}</>}
            {row.status === "published" && (
              <>
                {" · "}
                <Link href={`/trichozette/${row.slug}`} target="_blank" className="underline underline-offset-4">
                  Read it on the site
                </Link>
              </>
            )}
          </>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/studio/gazette">All editions</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/studio/gazette/${row.id}/preview`} target="_blank">
                <Eye /> Preview
              </Link>
            </Button>
            {canPublish && !live && !generating && (
              <form action={publishEditionAction}>
                <input type="hidden" name="id" value={row.id} />
                <SubmitButton pendingLabel="Publishing…">{row.scheduledFor && row.scheduledFor > new Date() ? "Schedule" : "Publish"}</SubmitButton>
              </form>
            )}
            {canPublish && live && (
              <form action={withdrawEditionAction}>
                <input type="hidden" name="id" value={row.id} />
                <SubmitButton variant="outline" pendingLabel="Withdrawing…">
                  Withdraw
                </SubmitButton>
              </form>
            )}
          </>
        }
      />

      {sp.notice && <Notice tone={sp.tone === "danger" ? "danger" : "default"}>{sp.notice}</Notice>}

      <GenerationRunner id={row.id} generating={generating} written={pages.length - pendingCount} total={pages.length} />

      {!generating && pendingCount > 0 && canEdit && (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-2">
            {pendingCount} {pendingCount === 1 ? "page has" : "pages have"} not been written yet.{" "}
            {aiAvailable() ? "You can try generating them again or write them by hand." : "AI isn't set up, so write them by hand."}
          </p>
          <div className="flex gap-2">
            {aiAvailable() && (
              <form action={generateRemainingAction}>
                <input type="hidden" name="id" value={row.id} />
                <SubmitButton size="sm" pendingLabel="Starting…">Generate remaining pages</SubmitButton>
              </form>
            )}
            <form action={fillTemplatesAction}>
              <input type="hidden" name="id" value={row.id} />
              <SubmitButton size="sm" variant="outline" pendingLabel="Preparing…">
                Write them by hand
              </SubmitButton>
            </form>
          </div>
        </Card>
      )}

      {live && canEdit && (
        <p className="text-sm text-muted-foreground">
          This edition is live. Changes you save here appear to readers straight away.
        </p>
      )}

      <nav className="flex gap-1 border-b border-rule text-sm">
        {(
          [
            ["pages", "Pages"],
            ["meta", "Cover and details"],
            ["history", "History"],
          ] as const
        ).map(([key, label]) => (
          <Link
            key={key}
            href={`/studio/gazette/${row.id}?tab=${key}${key === "pages" ? `&page=${selected}` : ""}`}
            className={cn("-mb-px border-b-2 px-3 py-2", tab === key ? "border-ink font-medium text-ink" : "border-transparent text-muted-foreground hover:text-ink")}
          >
            {label}
          </Link>
        ))}
      </nav>

      {tab === "pages" && (
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-4">
            {pages.length === 0 ? (
              <Empty>{generating ? "The outline is being written." : "This edition has no pages yet."}</Empty>
            ) : (
              <ol className="divide-y divide-rule rounded-2xl border border-rule bg-card">
                {pages.map((p, i) => {
                  const pending = isPending(p);
                  const valid = pending || PageSchema.safeParse(p).success;
                  const kind = (p as { kind?: string }).kind as keyof typeof PAGE_KIND_LABEL;
                  return (
                    <li key={i} className={cn("flex items-start gap-2 px-3 py-2.5", i === selected && "bg-paper-2")}>
                      <Link href={`/studio/gazette/${row.id}?page=${i}`} className="min-w-0 flex-1">
                        <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
                          {i + 1}. {PAGE_KIND_LABEL[kind] ?? "Page"}
                          {i < PUBLIC_PREVIEW_PAGES && " · Free preview"}
                        </span>
                        <span className="block truncate text-sm text-ink">{titleOf(p)}</span>
                        {pending && <span className="text-[11px] text-amber-700">{generating ? "Being written" : "Not written yet"}</span>}
                        {!valid && <span className="text-[11px] text-destructive">Needs fixing</span>}
                      </Link>
                      {!locked && (
                        <div className="flex shrink-0 items-center">
                          <form action={movePageAction}>
                            <input type="hidden" name="id" value={row.id} />
                            <input type="hidden" name="index" value={i} />
                            <input type="hidden" name="dir" value="up" />
                            <button type="submit" disabled={i === 0} className="p-1 text-muted-foreground hover:text-ink disabled:opacity-30" aria-label={`Move page ${i + 1} up`}>
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                          </form>
                          <form action={movePageAction}>
                            <input type="hidden" name="id" value={row.id} />
                            <input type="hidden" name="index" value={i} />
                            <input type="hidden" name="dir" value="down" />
                            <button type="submit" disabled={i === pages.length - 1} className="p-1 text-muted-foreground hover:text-ink disabled:opacity-30" aria-label={`Move page ${i + 1} down`}>
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </form>
                          <form action={deletePageAction}>
                            <input type="hidden" name="id" value={row.id} />
                            <input type="hidden" name="index" value={i} />
                            <button type="submit" className="p-1 text-muted-foreground hover:text-destructive" aria-label={`Delete page ${i + 1}`}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </form>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
            <p className="text-xs text-muted-foreground">
              The cover and contents come first automatically, and the news page is added after the first {Math.min(3, pages.length)} pages when there is enough news on the chosen topics.
            </p>
            {!locked && (
              <form action={addPageAction} className="flex gap-2">
                <input type="hidden" name="id" value={row.id} />
                <input type="hidden" name="after" value={selected} />
                <select name="kind" className={cn(fieldClass, "py-2")} defaultValue="article" aria-label="Kind of page to add">
                  {EDITABLE_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {PAGE_KIND_LABEL[k]}
                    </option>
                  ))}
                </select>
                <SubmitButton size="sm" variant="outline" pendingLabel="Adding…">
                  Add page
                </SubmitButton>
              </form>
            )}
          </aside>

          <div className="min-w-0">
            {pages[selected] === undefined ? (
              <Empty>Choose a page to edit it.</Empty>
            ) : (
              <PagePanel id={row.id} index={selected} page={pages[selected]} locked={locked} live={live} ai={aiAvailable()} />
            )}
          </div>
        </div>
      )}

      {tab === "meta" && (
        <form action={saveMetaAction} className="max-w-4xl space-y-6">
          <input type="hidden" name="id" value={row.id} />
          <fieldset disabled={locked} className="space-y-6">
            {brief.text && (
              <Card>
                <p className="label text-muted-foreground">The brief</p>
                <p className="mt-2 whitespace-pre-line text-sm text-ink-2">{brief.text}</p>
              </Card>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cover title">
                <input name="title" defaultValue={row.title} required className={fieldClass} />
              </Field>
              <Field label="Second cover line" hint="Shown in grey under the title.">
                <input name="fade" defaultValue={row.fade} className={fieldClass} />
              </Field>
              <Field label="Theme" hint="One or two words, used to group editions.">
                <input name="theme" defaultValue={row.theme} required className={fieldClass} />
              </Field>
              <Field label="Web address" hint={live ? "This can't change once the edition is published." : "Set from the title when you publish, unless you choose one here."}>
                <input name="slug" defaultValue={row.slug} readOnly={live} className={fieldClass} />
              </Field>
            </div>
            <Field label="Standfirst" hint="One or two sentences that tell readers what the edition gives them.">
              <textarea name="standfirst" defaultValue={row.standfirst} rows={3} required className={fieldClass} />
            </Field>
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-ink">Cover photograph</p>
              <ImagePicker name="coverImageKey" value={row.coverImageKey} optional label="Cover" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Cover tone">
                <select name="coverTone" defaultValue={row.coverTone} className={fieldClass}>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </Field>
              <Field label="Series">
                <select name="series" defaultValue={row.series} className={fieldClass}>
                  <option value="current">Monthly magazine</option>
                  <option value="archive">Archive look-back</option>
                </select>
              </Field>
              <Field label="Publish at" hint="London time. Leave empty to publish as soon as you press Publish.">
                <input type="datetime-local" name="scheduledFor" defaultValue={londonInput(row.scheduledFor)} className={fieldClass} />
              </Field>
              <Field label="Year covered" hint="Archive editions only.">
                <input name="period" defaultValue={row.period ?? ""} className={fieldClass} />
              </Field>
              <Field label="Field covered" hint="Archive editions only.">
                <select name="focus" defaultValue={row.focus ?? ""} className={fieldClass}>
                  <option value="">Not set</option>
                  <option value="review">Year in review</option>
                  <option value="cosmetic">Cosmetic</option>
                  <option value="clinical">Clinical</option>
                  <option value="medical">Medical</option>
                </select>
              </Field>
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-ink">Audience</legend>
              <div className="flex flex-wrap gap-4">
                {DISCIPLINES.map((d) => (
                  <label key={d} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="audience" value={d} defaultChecked={row.audience.includes(d)} /> {DISCIPLINE_LABEL[d]}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-ink">News topics</legend>
              <p className="text-xs text-muted-foreground">The news page is filled from verified news items on these topics.</p>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {NEWS_TOPICS.map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="newsTopics" value={t} defaultChecked={row.newsTopics.includes(t)} /> {t.replace("-", " ")}
                  </label>
                ))}
              </div>
            </fieldset>
            <Field label="Sources" hint="One per line, as a label, a vertical bar and the full https:// link. These are listed at the end of the edition.">
              <textarea
                name="sources"
                rows={5}
                defaultValue={(Array.isArray(row.sources) ? (row.sources as { label?: string; url?: string }[]) : []).map((s) => `${s.label ?? ""} | ${s.url ?? ""}`).join("\n")}
                className={cn(fieldClass, "font-mono text-xs")}
              />
            </Field>
            {!locked && <SubmitButton pendingLabel="Saving…">Save details</SubmitButton>}
          </fieldset>
        </form>
      )}

      {tab === "history" && (
        <Section title="Revision history" intro="Every save keeps a copy of the edition. Restoring brings back that version's pages and keeps the current one here too.">
          {revisions.length === 0 ? (
            <Empty>No revisions have been saved yet.</Empty>
          ) : (
            <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
              {revisions.map((r, i) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span>
                    <span className="text-ink">{r.note ?? "Saved"}</span>
                    <span className="text-muted-foreground">
                      {" · "}
                      {dateTime(r.createdAt)} · {r.authorId ? authors.get(r.authorId) ?? "Someone" : "Automatic"}
                    </span>
                  </span>
                  {i > 0 && !locked && (
                    <form action={restoreRevisionAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="revision" value={r.id} />
                      <SubmitButton size="xs" variant="outline" pendingLabel="Restoring…">
                        Restore these pages
                      </SubmitButton>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {canEdit && !live && !generating && (
        <form action={deleteEditionAction} className="border-t border-rule pt-6">
          <input type="hidden" name="id" value={row.id} />
          <SubmitButton size="sm" variant="ghost" className="text-destructive" pendingLabel="Deleting…">
            Delete this edition
          </SubmitButton>
        </form>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* One page                                                             */
/* ------------------------------------------------------------------ */

function PagePanel({ id, index, page, locked, live, ai }: { id: string; index: number; page: unknown; locked: boolean; live: boolean; ai: boolean }) {
  if (isPending(page)) return <PendingPanel id={id} index={index} page={page} locked={locked} ai={ai} />;
  const parsed = PageSchema.safeParse(page);
  const json = JSON.stringify(page, null, 2);

  return (
    <div className="space-y-6">
      {parsed.success ? (
        <form action={savePageAction} className="space-y-5">
          {/* Pressing Enter saves the page rather than pressing the first block button. */}
          <button type="submit" className="sr-only" tabIndex={-1} aria-hidden>
            Save
          </button>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="index" value={index} />
          <input type="hidden" name="kind" value={parsed.data.kind} />
          <fieldset disabled={locked} className="space-y-5">
            <p className="label text-muted-foreground">
              Page {index + 1} · {PAGE_KIND_LABEL[parsed.data.kind]}
            </p>
            <PageFields page={parsed.data} />
            {!locked && (
              <div className="sticky bottom-0 -mx-1 flex items-center gap-3 bg-background/90 px-1 py-3 backdrop-blur">
                <SubmitButton pendingLabel="Saving…">Save page</SubmitButton>
                <span className="text-xs text-muted-foreground">Block buttons save your changes too.</span>
              </div>
            )}
          </fieldset>
        </form>
      ) : (
        <Notice tone="danger">This page has a problem the form can&apos;t show: {describeError(parsed.error)} Fix it in the JSON below.</Notice>
      )}

      {!locked && !live && ai && (
        <Card>
          <form action={regeneratePageAction} className="space-y-3">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="index" value={index} />
            <Field label="Regenerate this page" hint="Say what should change. The page is written again with your note and the current version as a starting point.">
              <textarea name="note" rows={2} className={fieldClass} placeholder="Make it more practical for stylists, and add a checklist for the consultation." />
            </Field>
            <SubmitButton size="sm" variant="outline" pendingLabel="Starting…">
              Regenerate with this note
            </SubmitButton>
          </form>
        </Card>
      )}

      <details className="rounded-2xl border border-rule bg-card p-4">
        <summary className="cursor-pointer text-sm font-medium text-ink">Edit as JSON</summary>
        <form action={savePageJsonAction} className="mt-3 space-y-3">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="index" value={index} />
          <textarea name="json" defaultValue={json} rows={20} readOnly={locked} className={cn(fieldClass, "font-mono text-xs")} spellCheck={false} />
          {!locked && (
            <SubmitButton size="sm" variant="outline" pendingLabel="Saving…">
              Save JSON
            </SubmitButton>
          )}
        </form>
      </details>
    </div>
  );
}

function PendingPanel({ id, index, page, locked, ai }: { id: string; index: number; page: PendingPage; locked: boolean; ai: boolean }) {
  return (
    <Card className="space-y-4">
      <p className="label text-muted-foreground">
        Page {index + 1} · {PAGE_KIND_LABEL[page.kind]} · Not written yet
      </p>
      <h2 className="text-xl font-semibold text-ink">{page.title}</h2>
      <p className="text-sm text-ink-2">{page.intent}</p>
      {page.note && <p className="text-sm text-muted-foreground">Your note: {page.note}</p>}
      {!locked && ai && (
        <form action={regeneratePageAction} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="index" value={index} />
          <Field label="Note for the writer" hint="Optional. Say anything this page should include or avoid.">
            <textarea name="note" rows={2} defaultValue={page.note ?? ""} className={fieldClass} />
          </Field>
          <SubmitButton size="sm" pendingLabel="Writing…">Write this page</SubmitButton>
        </form>
      )}
    </Card>
  );
}

function PageFields({ page }: { page: EditablePage }) {
  switch (page.kind) {
    case "letter":
      return (
        <>
          <Field label="Title">
            <input name="title" defaultValue={page.title} required className={fieldClass} />
          </Field>
          <BlocksEditor prefix="b." blocks={page.blocks} />
          <Field label="Sign-off">
            <input name="signoff" defaultValue={page.signoff} required className={fieldClass} />
          </Field>
        </>
      );
    case "article":
      return (
        <>
          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <Field label="Kicker">
              <input name="kicker" defaultValue={page.kicker} required className={fieldClass} />
            </Field>
            <Field label="Title">
              <input name="title" defaultValue={page.title} required className={fieldClass} />
            </Field>
          </div>
          <Field label="Standfirst">
            <textarea name="standfirst" defaultValue={page.standfirst} rows={2} required className={fieldClass} />
          </Field>
          <ImagePicker name="imageKey" value={page.imageKey} optional label="Photograph" />
          <BlocksEditor prefix="b." blocks={page.blocks} />
        </>
      );
    case "image":
      return (
        <>
          <ImagePicker name="imageKey" value={page.imageKey} label="Photograph" />
          <Field label="Caption">
            <input name="caption" defaultValue={page.caption} required className={fieldClass} />
          </Field>
        </>
      );
    case "glance":
      return (
        <>
          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <Field label="Kicker">
              <input name="kicker" defaultValue={page.kicker} required className={fieldClass} />
            </Field>
            <Field label="Title">
              <input name="title" defaultValue={page.title} required className={fieldClass} />
            </Field>
          </div>
          <Field label="Rows" hint="One row per line: the label, a vertical bar, then the detail.">
            <textarea name="rows" rows={10} defaultValue={page.rows.map((r) => `${r.label} | ${r.value}`).join("\n")} className={fieldClass} />
          </Field>
        </>
      );
    case "interactive":
      return (
        <>
          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <Field label="Kicker">
              <input name="kicker" defaultValue={page.kicker} required className={fieldClass} />
            </Field>
            <Field label="Title">
              <input name="title" defaultValue={page.title} required className={fieldClass} />
            </Field>
          </div>
          <Field label="Introduction">
            <textarea name="intro" defaultValue={page.intro} rows={2} required className={fieldClass} />
          </Field>
          <BlocksEditor prefix="b." blocks={page.blocks} />
        </>
      );
    case "perspectives":
      return (
        <>
          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <Field label="Kicker">
              <input name="kicker" defaultValue={page.kicker} required className={fieldClass} />
            </Field>
            <Field label="Title">
              <input name="title" defaultValue={page.title} required className={fieldClass} />
            </Field>
          </div>
          <Field label="Introduction">
            <textarea name="intro" defaultValue={page.intro} rows={2} required className={fieldClass} />
          </Field>
          <input type="hidden" name="views" value={page.views.length} />
          {page.views.map((v, i) => (
            <fieldset key={i} className="space-y-4 rounded-2xl border border-rule p-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
                <Field label="Discipline">
                  <select name={`v${i}.discipline`} defaultValue={v.discipline} className={fieldClass}>
                    {DISCIPLINES.map((d) => (
                      <option key={d} value={d}>
                        {DISCIPLINE_LABEL[d]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Heading">
                  <input name={`v${i}.heading`} defaultValue={v.heading} required className={fieldClass} />
                </Field>
              </div>
              <BlocksEditor prefix={`v${i}.b.`} blocks={v.blocks} />
            </fieldset>
          ))}
        </>
      );
  }
}

function OpButton({ op, label, children, danger }: { op: string; label: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <button
      type="submit"
      name="op"
      value={op}
      aria-label={label}
      title={label}
      className={cn("rounded-md p-1 text-muted-foreground hover:bg-paper-2", danger ? "hover:text-destructive" : "hover:text-ink")}
    >
      {children}
    </button>
  );
}

function BlocksEditor({ prefix, blocks }: { prefix: string; blocks: Block[] }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-ink">Content</p>
      <input type="hidden" name={`${prefix}count`} value={blocks.length} />
      {blocks.map((b, i) => {
        const n = (field: string) => `${prefix}${i}.${field}`;
        return (
          <div key={i} className="space-y-2 rounded-xl border border-rule bg-card p-3">
            <input type="hidden" name={n("type")} value={b.type} />
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{BLOCK_LABEL[b.type]}</span>
              <span className="flex items-center">
                <OpButton op={`up|${prefix}|${i}`} label="Move up">
                  <ArrowUp className="h-3.5 w-3.5" />
                </OpButton>
                <OpButton op={`down|${prefix}|${i}`} label="Move down">
                  <ArrowDown className="h-3.5 w-3.5" />
                </OpButton>
                <OpButton op={`remove|${prefix}|${i}`} label="Remove" danger>
                  <Trash2 className="h-3.5 w-3.5" />
                </OpButton>
              </span>
            </div>
            <BlockFields block={b} n={n} />
          </div>
        );
      })}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Add:</span>
        {BLOCK_TYPES.map((t) => (
          <button key={t} type="submit" name="op" value={`add|${prefix}|${t}`} className="rounded-full border border-rule px-2.5 py-1 text-xs text-ink-2 hover:border-ink hover:text-ink">
            {BLOCK_LABEL[t]}
          </button>
        ))}
      </div>
    </div>
  );
}

function BlockFields({ block: b, n }: { block: Block; n: (field: string) => string }) {
  switch (b.type) {
    case "p":
      return <textarea name={n("text")} defaultValue={b.text} rows={4} className={fieldClass} aria-label="Paragraph" />;
    case "h":
      return <input name={n("text")} defaultValue={b.text} className={cn(fieldClass, "font-semibold")} aria-label="Subheading" />;
    case "pull":
      return (
        <>
          <input name={n("text")} defaultValue={b.text} className={cn(fieldClass, "italic")} aria-label="Pull quote" />
          <p className="text-xs text-muted-foreground">Copy a sentence from this page. Never attribute it to a person.</p>
        </>
      );
    case "list":
      return <textarea name={n("items")} defaultValue={b.items.join("\n")} rows={4} className={fieldClass} aria-label="List items, one per line" placeholder="One item per line" />;
    case "callout":
      return (
        <>
          <input name={n("title")} defaultValue={b.title} className={fieldClass} aria-label="Callout title" />
          <textarea name={n("text")} defaultValue={b.text} rows={3} className={fieldClass} aria-label="Callout text" />
        </>
      );
    case "checklist":
      return (
        <>
          <input name={n("title")} defaultValue={b.title} className={fieldClass} aria-label="Checklist title" />
          <textarea name={n("items")} defaultValue={b.items.join("\n")} rows={5} className={fieldClass} aria-label="Checklist items, one per line" placeholder="One item per line" />
        </>
      );
    case "quiz":
      return (
        <>
          <input name={n("question")} defaultValue={b.question} className={fieldClass} aria-label="Question" />
          <textarea name={n("options")} defaultValue={b.options.join("\n")} rows={4} className={fieldClass} aria-label="Options, one per line" placeholder="One option per line" />
          <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
            <Field label="Correct option" hint="Its number in the list.">
              <input name={n("answer")} type="number" min={1} max={b.options.length + 4} defaultValue={b.answer + 1} className={fieldClass} />
            </Field>
            <Field label="Explanation">
              <textarea name={n("explain")} defaultValue={b.explain} rows={2} className={fieldClass} />
            </Field>
          </div>
        </>
      );
    case "reveal":
      return (
        <>
          <input name={n("prompt")} defaultValue={b.prompt} className={fieldClass} aria-label="Question" />
          <textarea name={n("answer")} defaultValue={b.answer} rows={2} className={fieldClass} aria-label="Answer" />
        </>
      );
  }
}
