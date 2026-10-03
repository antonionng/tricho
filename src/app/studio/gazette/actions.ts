"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { GazetteEdition, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit, requirePermission, type Staff } from "@/lib/staff";
import { allEditions, PUBLIC_PREVIEW_PAGES, type Block } from "@/content/gazette";
import {
  BLOCK_TYPES,
  checkPages,
  describeError,
  DISCIPLINES,
  EDITABLE_KINDS,
  EditionMetaSchema,
  IMAGE_KEYS,
  NEWS_TOPICS,
  PAGE_KIND_LABEL,
  PageSchema,
  type EditableKind,
  type EditablePage,
} from "@/content/gazette/schema";
import { nextEditionNumber } from "@/content/gazette/merge";
import {
  editionNumbers,
  fillPendingWithTemplates,
  isPending,
  templatePage,
  type PendingPage,
} from "@/agents/gazette-edition";
import type { ImageKey } from "@/content/gazette/types";

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function s(form: FormData, key: string, max = 20000) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

function withParams(path: string, params: Record<string, string | number | undefined>) {
  const url = new URL(path, "http://studio.local");
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  return `${url.pathname}${url.search}`;
}

const editorUrl = (id: string, params: Record<string, string | number | undefined> = {}) =>
  withParams(`/studio/gazette/${id}`, params);

const asJson = (v: unknown) => JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;

function pagesOf(row: Pick<GazetteEdition, "pages">): unknown[] {
  return Array.isArray(row.pages) ? [...(row.pages as unknown[])] : [];
}

function coverKeyOf(row: Pick<GazetteEdition, "coverImageKey">): ImageKey {
  return (IMAGE_KEYS as string[]).includes(row.coverImageKey ?? "") ? (row.coverImageKey as ImageKey) : "community";
}

async function loadEdition(id: string) {
  const row = await prisma.gazetteEdition.findUnique({ where: { id } });
  if (!row) redirect(withParams("/studio/gazette", { notice: "That edition no longer exists.", tone: "danger" }));
  return row;
}

function snapshotOf(row: GazetteEdition) {
  const rest: Partial<GazetteEdition> = { ...row };
  delete rest.id;
  delete rest.createdAt;
  delete rest.updatedAt;
  return asJson(rest);
}

/** Saves a change, keeps a revision of the result, and records it in the audit log. */
async function commit(
  staff: Staff,
  before: GazetteEdition,
  data: Prisma.GazetteEditionUpdateInput,
  entry: { summary: string; note: string; action?: string }
) {
  const after = await prisma.gazetteEdition.update({ where: { id: before.id }, data: { ...data, updatedById: staff.userId } });
  await prisma.gazetteRevision.create({
    data: { editionId: after.id, snapshot: snapshotOf(after), authorId: staff.userId, note: entry.note },
  });
  await audit(staff, {
    action: entry.action ?? "gazette.edit",
    targetType: "gazette_edition",
    targetId: after.id,
    summary: entry.summary,
    before: diffable(before),
    after: diffable(after),
  });
  if (after.status === "published" || after.status === "scheduled") revalidatePublic(after.slug);
  revalidatePath("/studio/gazette");
  return after;
}

/** The parts of an edition worth showing in the audit log, without the full page text. */
function diffable(row: GazetteEdition) {
  return {
    slug: row.slug,
    status: row.status,
    title: row.title,
    number: row.number,
    pages: pagesOf(row).length,
    scheduledFor: row.scheduledFor,
    publishedAt: row.publishedAt,
  };
}

function revalidatePublic(slug?: string) {
  revalidatePath("/trichozette", "layout");
  if (slug) revalidatePath(`/trichozette/${slug}`);
  revalidatePath("/members/trichozette");
  revalidatePath("/members");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/g, "");
}

async function slugTaken(slug: string, exceptId?: string) {
  if (allEditions.some((e) => e.slug === slug)) return true;
  const row = await prisma.gazetteEdition.findUnique({ where: { slug }, select: { id: true } });
  return !!row && row.id !== exceptId;
}

async function uniqueSlug(base: string, exceptId?: string) {
  const root = slugify(base) || "edition";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    if (!(await slugTaken(candidate, exceptId))) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

function lines(value: string) {
  return value
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

/** "2026-10-12T09:00" typed in London time, as a Date. */
function londonDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const asUtc = new Date(`${value}:00Z`);
  // Work out London's offset at that moment and correct for it.
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
      .formatToParts(asUtc)
      .map((p) => [p.type, p.value])
  );
  const londonAsUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return new Date(asUtc.getTime() - (londonAsUtc - asUtc.getTime()));
}

function assertEditable(row: GazetteEdition, index?: number) {
  if (row.status === "generating") {
    redirect(editorUrl(row.id, { page: index, notice: "Pages are still being written. Wait for generation to finish before editing.", tone: "danger" }));
  }
}

/* ------------------------------------------------------------------ */
/* Create                                                               */
/* ------------------------------------------------------------------ */

export async function createEditionAction(form: FormData) {
  const staff = await requirePermission("gazette.edit");
  const brief = s(form, "brief", 4000);
  const audience = form.getAll("audience").map(String).filter((a) => (DISCIPLINES as readonly string[]).includes(a));
  const series = s(form, "series") === "archive" ? "archive" : "current";
  const newsTopics = form.getAll("newsTopics").map(String).filter((t) => (NEWS_TOPICS as readonly string[]).includes(t));
  const cover = s(form, "coverImageKey");
  const coverImageKey = (IMAGE_KEYS as string[]).includes(cover) ? cover : null;
  const target = Math.min(10, Math.max(6, Number(s(form, "pages")) || 8));
  const period = series === "archive" ? s(form, "period", 4) || null : null;

  if (brief.length < 20) {
    redirect(withParams("/studio/gazette/new", { notice: "Please write a brief of at least a sentence, so the edition has a clear theme.", tone: "danger" }));
  }
  if (!audience.length) {
    redirect(withParams("/studio/gazette/new", { notice: "Please choose at least one audience for the edition.", tone: "danger" }));
  }

  const row = await prisma.gazetteEdition.create({
    data: {
      slug: `draft-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      status: "generating",
      series,
      title: "New edition",
      theme: "New theme",
      audience,
      newsTopics,
      coverImageKey,
      period,
      brief: `${brief} [pages:${target}]`,
      createdById: staff.userId,
      updatedById: staff.userId,
    },
  });
  await audit(staff, {
    action: "gazette.create",
    targetType: "gazette_edition",
    targetId: row.id,
    summary: "Started a new Trichozette edition from a brief.",
    after: { brief, audience, series, newsTopics, coverImageKey, target },
  });
  revalidatePath("/studio/gazette");
  redirect(editorUrl(row.id));
}

/* ------------------------------------------------------------------ */
/* Metadata                                                             */
/* ------------------------------------------------------------------ */

export async function saveMetaAction(form: FormData) {
  const staff = await requirePermission("gazette.edit");
  const row = await loadEdition(s(form, "id", 64));
  assertEditable(row);
  const back = (notice: string, tone?: string) => editorUrl(row.id, { tab: "meta", notice, tone });

  const sourcesRaw = lines(s(form, "sources", 8000));
  const sources = sourcesRaw.map((l) => {
    const [label, url] = l.includes("|") ? l.split("|").map((x) => x.trim()) : [l, l];
    return { label, url };
  });
  const series = s(form, "series") === "archive" ? "archive" : "current";
  const candidate = {
    slug: s(form, "slug", 80) || row.slug,
    title: s(form, "title", 200),
    fade: s(form, "fade", 200),
    theme: s(form, "theme", 80),
    standfirst: s(form, "standfirst", 1000),
    coverImageKey: s(form, "coverImageKey") || undefined,
    coverTone: s(form, "coverTone") === "dark" ? "dark" : "light",
    audience: form.getAll("audience").map(String),
    series,
    period: s(form, "period", 10) || undefined,
    focus: s(form, "focus") || undefined,
    sources: sources.length ? sources : undefined,
  };
  const parsed = EditionMetaSchema.safeParse(candidate);
  if (!parsed.success) redirect(back(`The details weren't saved. ${describeError(parsed.error)}`, "danger"));
  const meta = parsed.data;

  const isDraftSlug = meta.slug.startsWith("draft-");
  if (meta.slug !== row.slug && !isDraftSlug && (await slugTaken(meta.slug, row.id))) {
    redirect(back("That web address is already used by another edition. Please choose another.", "danger"));
  }
  if (meta.slug !== row.slug && (row.status === "published" || row.status === "scheduled")) {
    redirect(back("The web address of a published edition can't change, because links to it are already shared.", "danger"));
  }

  const scheduledRaw = s(form, "scheduledFor", 20);
  const scheduledFor = scheduledRaw ? londonDate(scheduledRaw) : null;
  if (scheduledRaw && !scheduledFor) redirect(back("Please give the publication time as a full date and time.", "danger"));

  const newsTopics = form.getAll("newsTopics").map(String).filter((t) => (NEWS_TOPICS as readonly string[]).includes(t));

  await commit(
    staff,
    row,
    {
      slug: meta.slug,
      title: meta.title,
      fade: meta.fade,
      theme: meta.theme,
      standfirst: meta.standfirst,
      coverImageKey: meta.coverImageKey ?? null,
      coverTone: meta.coverTone,
      audience: meta.audience,
      series: meta.series ?? "current",
      period: meta.period ?? null,
      focus: meta.focus ?? null,
      sources: meta.sources ? asJson(meta.sources) : undefined,
      newsTopics,
      scheduledFor,
      // A scheduled edition moves with its schedule.
      ...(row.status === "scheduled" && scheduledFor ? { publishedAt: scheduledFor } : {}),
    },
    { summary: `Updated the details of the Trichozette edition "${meta.title}".`, note: "Details saved" }
  );
  redirect(back("The edition's details are saved."));
}

/* ------------------------------------------------------------------ */
/* Pages                                                                */
/* ------------------------------------------------------------------ */

const NEW_BLOCK: Record<Block["type"], Block> = {
  p: { type: "p", text: "Write the new paragraph here." },
  h: { type: "h", text: "Write the subheading here" },
  list: { type: "list", items: ["First item"] },
  pull: { type: "pull", text: "Copy a sentence from this page here." },
  callout: { type: "callout", title: "Callout title", text: "Write the callout text here." },
  checklist: { type: "checklist", title: "Checklist title", items: ["First item"] },
  quiz: { type: "quiz", question: "Write the question here.", options: ["First option", "Second option", "Third option"], answer: 0, explain: "Explain the correct answer here." },
  reveal: { type: "reveal", prompt: "Write the question here.", answer: "Write the answer here." },
};

/** Reads the blocks a page form posted under one prefix, such as "b." or "v0.b.". */
function readBlocks(form: FormData, prefix: string): Block[] {
  const count = Number(s(form, `${prefix}count`)) || 0;
  const blocks: Block[] = [];
  for (let i = 0; i < count; i++) {
    const k = (field: string) => s(form, `${prefix}${i}.${field}`);
    const type = k("type") as Block["type"];
    switch (type) {
      case "p":
      case "h":
      case "pull":
        blocks.push({ type, text: k("text") });
        break;
      case "list":
        blocks.push({ type, items: lines(k("items")) });
        break;
      case "checklist":
        blocks.push({ type, title: k("title"), items: lines(k("items")) });
        break;
      case "callout":
        blocks.push({ type, title: k("title"), text: k("text") });
        break;
      case "quiz":
        blocks.push({ type, question: k("question"), options: lines(k("options")), answer: Math.max(0, (Number(k("answer")) || 1) - 1), explain: k("explain") });
        break;
      case "reveal":
        blocks.push({ type, prompt: k("prompt"), answer: k("answer") });
        break;
    }
  }
  return blocks;
}

/** Applies a block button ("add", "up", "down", "remove") to the blocks under its prefix. */
function applyBlockOp(blocks: Block[], prefix: string, op: string): Block[] {
  const [verb, opPrefix, arg] = op.split("|");
  if (opPrefix !== prefix) return blocks;
  const list = [...blocks];
  const i = Number(arg);
  if (verb === "add" && (BLOCK_TYPES as readonly string[]).includes(arg)) list.push(NEW_BLOCK[arg as Block["type"]]);
  if (verb === "remove" && i >= 0 && i < list.length) list.splice(i, 1);
  if (verb === "up" && i > 0) [list[i - 1], list[i]] = [list[i], list[i - 1]];
  if (verb === "down" && i >= 0 && i < list.length - 1) [list[i + 1], list[i]] = [list[i], list[i + 1]];
  return list;
}

function readPage(form: FormData, kind: EditableKind, op: string): unknown {
  const blocks = (prefix: string) => applyBlockOp(readBlocks(form, prefix), prefix, op);
  const imageKey = s(form, "imageKey") || undefined;
  switch (kind) {
    case "letter":
      return { kind, title: s(form, "title"), blocks: blocks("b."), signoff: s(form, "signoff") };
    case "article":
      return { kind, kicker: s(form, "kicker"), title: s(form, "title"), standfirst: s(form, "standfirst"), ...(imageKey ? { imageKey } : {}), blocks: blocks("b.") };
    case "image":
      return { kind, imageKey, caption: s(form, "caption") };
    case "glance":
      return {
        kind,
        kicker: s(form, "kicker"),
        title: s(form, "title"),
        rows: lines(s(form, "rows")).map((l) => {
          const at = l.indexOf("|");
          return at === -1 ? { label: l, value: "" } : { label: l.slice(0, at).trim(), value: l.slice(at + 1).trim() };
        }),
      };
    case "interactive":
      return { kind, kicker: s(form, "kicker"), title: s(form, "title"), intro: s(form, "intro"), blocks: blocks("b.") };
    case "perspectives": {
      const count = Number(s(form, "views")) || 0;
      return {
        kind,
        kicker: s(form, "kicker"),
        title: s(form, "title"),
        intro: s(form, "intro"),
        views: Array.from({ length: count }, (_, v) => ({
          discipline: s(form, `v${v}.discipline`),
          heading: s(form, `v${v}.heading`),
          blocks: blocks(`v${v}.b.`),
        })),
      };
    }
  }
}

function pageLabel(p: unknown, index: number) {
  const title = (p as { title?: string; caption?: string })?.title ?? (p as { caption?: string })?.caption;
  return title ? `page ${index + 1}, "${title}"` : `page ${index + 1}`;
}

async function writePage(staff: Staff, row: GazetteEdition, index: number, page: EditablePage, note: string) {
  const pages = pagesOf(row);
  pages[index] = page;
  await commit(staff, row, { pages: asJson(pages) }, { summary: `Edited ${pageLabel(page, index)} of the Trichozette edition "${row.title}".`, note });
}

/** Saves the structured page form. Block buttons save the page and then make their change. */
export async function savePageAction(form: FormData) {
  const staff = await requirePermission("gazette.edit");
  const row = await loadEdition(s(form, "id", 64));
  const index = Number(s(form, "index"));
  assertEditable(row, index);
  const pages = pagesOf(row);
  const kind = s(form, "kind") as EditableKind;
  if (!(index >= 0 && index < pages.length) || !EDITABLE_KINDS.includes(kind)) {
    redirect(editorUrl(row.id, { notice: "That page couldn't be found. It may have been moved.", tone: "danger" }));
  }
  const op = s(form, "op", 100);
  const parsed = PageSchema.safeParse(readPage(form, kind, op));
  if (!parsed.success) {
    redirect(editorUrl(row.id, { page: index, notice: `The page wasn't saved. ${describeError(parsed.error)}`, tone: "danger" }));
  }
  await writePage(staff, row, index, parsed.data, op ? "Page edited" : "Page saved");
  redirect(editorUrl(row.id, { page: index, notice: op ? undefined : "The page is saved." }));
}

/** Saves a page written as JSON, for anything the form doesn't cover. */
export async function savePageJsonAction(form: FormData) {
  const staff = await requirePermission("gazette.edit");
  const row = await loadEdition(s(form, "id", 64));
  const index = Number(s(form, "index"));
  assertEditable(row, index);
  const pages = pagesOf(row);
  if (!(index >= 0 && index < pages.length)) redirect(editorUrl(row.id, { notice: "That page couldn't be found.", tone: "danger" }));
  let raw: unknown;
  try {
    raw = JSON.parse(s(form, "json", 200000));
  } catch {
    redirect(editorUrl(row.id, { page: index, notice: "The JSON couldn't be read. Check for a missing comma or quotation mark.", tone: "danger" }));
  }
  const parsed = PageSchema.safeParse(raw);
  if (!parsed.success) redirect(editorUrl(row.id, { page: index, notice: `The page wasn't saved. ${describeError(parsed.error)}`, tone: "danger" }));
  await writePage(staff, row, index, parsed.data, "Page saved as JSON");
  redirect(editorUrl(row.id, { page: index, notice: "The page is saved." }));
}

export async function addPageAction(form: FormData) {
  const staff = await requirePermission("gazette.edit");
  const row = await loadEdition(s(form, "id", 64));
  assertEditable(row);
  const kind = s(form, "kind") as EditableKind;
  if (!EDITABLE_KINDS.includes(kind)) redirect(editorUrl(row.id, { notice: "Please choose a kind of page.", tone: "danger" }));
  const pages = pagesOf(row);
  const after = Number(s(form, "after"));
  const at = Number.isFinite(after) && after >= 0 && after < pages.length ? after + 1 : pages.length;
  const page = templatePage({ kind, kicker: "", title: `New ${PAGE_KIND_LABEL[kind].toLowerCase()} page`, intent: "Write this page by hand." }, coverKeyOf(row));
  pages.splice(at, 0, page);
  await commit(staff, row, { pages: asJson(pages) }, { summary: `Added a ${PAGE_KIND_LABEL[kind].toLowerCase()} page to the Trichozette edition "${row.title}".`, note: "Page added" });
  redirect(editorUrl(row.id, { page: at, notice: "A new page is added. Replace the placeholder text and save." }));
}

export async function movePageAction(form: FormData) {
  const staff = await requirePermission("gazette.edit");
  const row = await loadEdition(s(form, "id", 64));
  const index = Number(s(form, "index"));
  assertEditable(row, index);
  const dir = s(form, "dir") === "up" ? -1 : 1;
  const pages = pagesOf(row);
  const to = index + dir;
  if (!(index >= 0 && index < pages.length && to >= 0 && to < pages.length)) redirect(editorUrl(row.id, { page: index }));
  [pages[index], pages[to]] = [pages[to], pages[index]];
  await commit(staff, row, { pages: asJson(pages) }, { summary: `Moved ${pageLabel(pages[to], index)} of the Trichozette edition "${row.title}" to position ${to + 1}.`, note: "Page moved" });
  redirect(editorUrl(row.id, { page: to }));
}

export async function deletePageAction(form: FormData) {
  const staff = await requirePermission("gazette.edit");
  const row = await loadEdition(s(form, "id", 64));
  const index = Number(s(form, "index"));
  assertEditable(row, index);
  const pages = pagesOf(row);
  if (!(index >= 0 && index < pages.length)) redirect(editorUrl(row.id));
  if ((row.status === "published" || row.status === "scheduled") && pages.length <= PUBLIC_PREVIEW_PAGES + 1) {
    redirect(editorUrl(row.id, { page: index, notice: "A published edition needs more pages than this. Withdraw it first if you want to rebuild it.", tone: "danger" }));
  }
  const [removed] = pages.splice(index, 1);
  await commit(staff, row, { pages: asJson(pages) }, { summary: `Deleted ${pageLabel(removed, index)} from the Trichozette edition "${row.title}".`, note: "Page deleted" });
  redirect(editorUrl(row.id, { page: Math.max(0, Math.min(index, pages.length - 1)), notice: "The page is deleted. Earlier versions are kept in the revision history." }));
}

/** Marks a page to be written again with the owner's note, then starts generation. */
export async function regeneratePageAction(form: FormData) {
  const staff = await requirePermission("gazette.edit");
  const row = await loadEdition(s(form, "id", 64));
  const index = Number(s(form, "index"));
  assertEditable(row, index);
  if (row.status === "published" || row.status === "scheduled") {
    redirect(editorUrl(row.id, { page: index, notice: "Withdraw the edition before regenerating its pages.", tone: "danger" }));
  }
  const pages = pagesOf(row);
  const current = pages[index];
  if (!current) redirect(editorUrl(row.id));
  const parsed = PageSchema.safeParse(current);
  const note = s(form, "note", 1000);
  const pending: PendingPage = isPending(current)
    ? { ...current, note: note || current.note }
    : parsed.success
      ? {
          pending: true,
          kind: parsed.data.kind,
          kicker: "kicker" in parsed.data ? parsed.data.kicker : PAGE_KIND_LABEL[parsed.data.kind],
          title: parsed.data.kind === "image" ? parsed.data.caption : parsed.data.title,
          intent: "Rewrite this page, keeping its place in the edition.",
          note: note || undefined,
          previous: parsed.data,
        }
      : { pending: true, kind: "article", kicker: "Feature", title: "Untitled page", intent: "Write this page.", note: note || undefined };
  pages[index] = pending;
  await commit(staff, row, { pages: asJson(pages), status: "generating" }, { summary: `Asked for ${pageLabel(current, index)} of the Trichozette edition "${row.title}" to be rewritten.`, note: "Page sent for regeneration" });
  redirect(editorUrl(row.id, { page: index }));
}

/** Starts generation for every page still waiting to be written. */
export async function generateRemainingAction(form: FormData) {
  await requirePermission("gazette.edit");
  const row = await loadEdition(s(form, "id", 64));
  if (row.status === "published" || row.status === "scheduled") redirect(editorUrl(row.id));
  await prisma.gazetteEdition.update({ where: { id: row.id }, data: { status: "generating" } });
  redirect(editorUrl(row.id));
}

/** Turns every page still waiting to be written into a template page, to write by hand. */
export async function fillTemplatesAction(form: FormData) {
  const staff = await requirePermission("gazette.edit");
  const row = await loadEdition(s(form, "id", 64));
  const pages = fillPendingWithTemplates(pagesOf(row), coverKeyOf(row));
  await commit(
    staff,
    row,
    { pages: asJson(pages), ...(row.status === "generating" ? { status: "draft" } : {}) },
    { summary: `Filled the unwritten pages of the Trichozette edition "${row.title}" with templates.`, note: "Templates added" }
  );
  redirect(editorUrl(row.id, { notice: "The unwritten pages now have placeholder text for you to replace." }));
}

/** Puts an earlier revision back, keeping the current one in the history. */
export async function restoreRevisionAction(form: FormData) {
  const staff = await requirePermission("gazette.edit");
  const row = await loadEdition(s(form, "id", 64));
  assertEditable(row);
  const rev = await prisma.gazetteRevision.findFirst({ where: { id: s(form, "revision", 64), editionId: row.id } });
  const snap = (rev?.snapshot ?? null) as { pages?: unknown } | null;
  if (!rev || !snap || !Array.isArray(snap.pages)) redirect(editorUrl(row.id, { tab: "history", notice: "That revision couldn't be found.", tone: "danger" }));
  await commit(staff, row, { pages: asJson(snap.pages) }, { summary: `Restored the pages of the Trichozette edition "${row.title}" from an earlier revision.`, note: `Restored the revision from ${rev.createdAt.toISOString()}` });
  redirect(editorUrl(row.id, { notice: "The earlier pages are back. The version you replaced is kept in the history." }));
}

/* ------------------------------------------------------------------ */
/* Publishing                                                           */
/* ------------------------------------------------------------------ */

export async function publishEditionAction(form: FormData) {
  const staff = await requirePermission("gazette.publish");
  const row = await loadEdition(s(form, "id", 64));
  const fail = (notice: string) => redirect(editorUrl(row.id, { notice, tone: "danger" }));
  if (row.status === "generating") fail("Pages are still being written. Publish once generation has finished.");

  const raw = pagesOf(row);
  const pending = raw.filter(isPending).length;
  if (pending) fail(`${pending} ${pending === 1 ? "page has" : "pages have"} not been written yet. Generate or fill ${pending === 1 ? "it" : "them"} in before publishing.`);
  const checked = checkPages(raw);
  if (checked.errors.length) {
    const e = checked.errors[0];
    fail(`Page ${e.index + 1} isn't ready to publish. ${e.message}`);
  }
  if (checked.pages.length < PUBLIC_PREVIEW_PAGES + 1) fail(`An edition needs at least ${PUBLIC_PREVIEW_PAGES + 1} pages, so members have something to read beyond the free preview.`);
  const placeholders = JSON.stringify(checked.pages).match(/Replace this paragraph|Write the new paragraph here|Write this page by hand|Add the second cover line here/);
  if (placeholders) fail("Some placeholder text is still in the edition. Replace it before publishing.");

  const slug = row.slug.startsWith("draft-") ? await uniqueSlug(row.title, row.id) : row.slug;
  const meta = EditionMetaSchema.safeParse({
    slug,
    title: row.title,
    fade: row.fade,
    theme: row.theme,
    standfirst: row.standfirst,
    coverImageKey: row.coverImageKey ?? undefined,
    coverTone: row.coverTone,
    audience: row.audience,
    series: row.series === "archive" ? "archive" : "current",
    period: row.period ?? undefined,
    focus: row.focus ?? undefined,
    sources: Array.isArray(row.sources) && row.sources.length ? row.sources : undefined,
  });
  if (!meta.success) fail(`The edition's details aren't ready. ${describeError(meta.error)}`);
  if (await slugTaken(slug, row.id)) fail("Another edition already uses this web address. Change it in the details before publishing.");
  if (row.series === "archive" && !row.period) fail("Archive editions need the year they cover. Add it in the details.");

  const series = row.series === "archive" ? "archive" : "current";
  const number = row.number > 0 ? row.number : nextEditionNumber(await editionNumbers(), series, row.period);
  const now = new Date();
  const scheduled = !!row.scheduledFor && row.scheduledFor.getTime() > now.getTime();
  const after = await prisma.gazetteEdition.update({
    where: { id: row.id },
    data: {
      slug,
      number,
      pages: asJson(checked.pages),
      status: scheduled ? "scheduled" : "published",
      publishedAt: scheduled ? row.scheduledFor : now,
      updatedById: staff.userId,
    },
  });
  await prisma.gazetteRevision.create({
    data: { editionId: after.id, snapshot: snapshotOf(after), authorId: staff.userId, note: scheduled ? "Scheduled" : "Published" },
  });
  await audit(staff, {
    action: "gazette.publish",
    targetType: "gazette_edition",
    targetId: after.id,
    summary: scheduled
      ? `Scheduled the Trichozette edition "${after.title}" for ${after.scheduledFor!.toISOString()}.`
      : `Published the Trichozette edition "${after.title}".`,
    before: diffable(row),
    after: diffable(after),
  });
  revalidatePublic(after.slug);
  revalidatePath("/studio/gazette");
  redirect(
    editorUrl(after.id, {
      notice: scheduled
        ? "The edition is scheduled. Readers will see it from the time you set."
        : "The edition is published. Readers can see it now, and the release announcer will draft an email about it.",
    })
  );
}

export async function withdrawEditionAction(form: FormData) {
  const staff = await requirePermission("gazette.publish");
  const row = await loadEdition(s(form, "id", 64));
  if (row.status !== "published" && row.status !== "scheduled") redirect(editorUrl(row.id));
  const after = await prisma.gazetteEdition.update({ where: { id: row.id }, data: { status: "withdrawn", updatedById: staff.userId } });
  await audit(staff, {
    action: "gazette.withdraw",
    targetType: "gazette_edition",
    targetId: row.id,
    summary: `Withdrew the Trichozette edition "${row.title}" from readers.`,
    before: diffable(row),
    after: diffable(after),
  });
  revalidatePublic(row.slug);
  revalidatePath("/studio/gazette");
  redirect(editorUrl(row.id, { notice: "The edition is withdrawn. Readers can no longer see it, and you can edit it again." }));
}

export async function deleteEditionAction(form: FormData) {
  const row = await loadEdition(s(form, "id", 64));
  const staff = await requirePermission(row.status === "withdrawn" ? "gazette.publish" : "gazette.edit");
  if (row.status === "published" || row.status === "scheduled") {
    redirect(editorUrl(row.id, { notice: "Withdraw the edition before deleting it.", tone: "danger" }));
  }
  await prisma.gazetteEdition.delete({ where: { id: row.id } });
  await audit(staff, {
    action: "gazette.delete",
    targetType: "gazette_edition",
    targetId: row.id,
    summary: `Deleted the Trichozette edition "${row.title}".`,
    before: diffable(row),
  });
  revalidatePath("/studio/gazette");
  redirect(withParams("/studio/gazette", { notice: `"${row.title}" is deleted.` }));
}
