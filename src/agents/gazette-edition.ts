import "server-only";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { news, type NewsItem } from "@/content/news";
import { images } from "@/content/images";
import { allEditions, PUBLIC_PREVIEW_PAGES } from "@/content/gazette";
import { getAllEditions } from "@/content/gazette/loader";
import {
  DISCIPLINES,
  EDITABLE_KINDS,
  IMAGE_KEYS,
  PAGE_KIND_LABEL,
  PAGE_SCHEMAS,
  type EditableKind,
  type EditablePage,
} from "@/content/gazette/schema";
import type { Block, ImageKey } from "@/content/gazette/types";
import { aiAvailable, generateStructured } from "./ai";
import { readMonth } from "./gazette";
import { excerpt } from "./util";

/** The brief as typed, and the page count asked for (stored as a "[pages:8]" marker). */
export function parseBrief(brief: string | null | undefined) {
  const raw = brief ?? "";
  const target = Math.min(10, Math.max(6, Number(raw.match(/\[pages:(\d+)\]/)?.[1]) || 8));
  return { text: raw.replace(/\s*\[pages:\d+\]\s*/, " ").trim(), target };
}

/* ------------------------------------------------------------------ */
/* Pages waiting to be written                                          */
/* ------------------------------------------------------------------ */

/**
 * A planned page that hasn't been written yet. It sits in the edition's pages
 * array until generation replaces it, so an interrupted run can carry on.
 * It never passes PageSchema, so it can't be published or shown to readers.
 */
export type PendingPage = {
  pending: true;
  kind: EditableKind;
  kicker: string;
  title: string;
  intent: string;
  /** The owner's note when asking for a page to be rewritten. */
  note?: string;
  /** The page as it was, kept for context when regenerating. */
  previous?: EditablePage;
};

export function isPending(p: unknown): p is PendingPage {
  return !!p && typeof p === "object" && (p as { pending?: unknown }).pending === true;
}

/* ------------------------------------------------------------------ */
/* Schemas the model writes to                                          */
/* ------------------------------------------------------------------ */
// Deliberately loose (no length limits or refinements, which structured
// output doesn't always support). Every result is checked against the strict
// PageSchema before it is saved.

const GenBlock = z.union([
  z.object({ type: z.literal("p"), text: z.string() }),
  z.object({ type: z.literal("h"), text: z.string() }),
  z.object({ type: z.literal("list"), items: z.array(z.string()) }),
  z.object({ type: z.literal("pull"), text: z.string().describe("A sentence copied word for word from a paragraph of this same page.") }),
  z.object({ type: z.literal("callout"), title: z.string(), text: z.string() }),
  z.object({ type: z.literal("checklist"), title: z.string(), items: z.array(z.string()) }),
  z.object({
    type: z.literal("quiz"),
    question: z.string(),
    options: z.array(z.string()).describe("Three or four options."),
    answer: z.number().int().describe("Zero-based index of the correct option."),
    explain: z.string(),
  }),
  z.object({ type: z.literal("reveal"), prompt: z.string(), answer: z.string() }),
]);

const genImageKey = z.enum(IMAGE_KEYS);

export const GEN_SCHEMAS = {
  letter: z.object({ kind: z.literal("letter"), title: z.string(), blocks: z.array(GenBlock), signoff: z.string() }),
  article: z.object({
    kind: z.literal("article"),
    kicker: z.string(),
    title: z.string(),
    standfirst: z.string(),
    imageKey: genImageKey.nullable(),
    blocks: z.array(GenBlock),
  }),
  image: z.object({ kind: z.literal("image"), imageKey: genImageKey, caption: z.string() }),
  glance: z.object({
    kind: z.literal("glance"),
    kicker: z.string(),
    title: z.string(),
    rows: z.array(z.object({ label: z.string(), value: z.string() })),
  }),
  interactive: z.object({ kind: z.literal("interactive"), kicker: z.string(), title: z.string(), intro: z.string(), blocks: z.array(GenBlock) }),
  perspectives: z.object({
    kind: z.literal("perspectives"),
    kicker: z.string(),
    title: z.string(),
    intro: z.string(),
    views: z.array(z.object({ discipline: z.enum(DISCIPLINES), heading: z.string(), blocks: z.array(GenBlock) })),
  }),
} as const;

export const EditionOutlineSchema = z.object({
  title: z.string().describe("The cover title, a short phrase in sentence case."),
  fade: z.string().describe("The second cover line, one short complete sentence."),
  theme: z.string().describe("One or two words naming the theme."),
  standfirst: z.string().describe("One or two complete sentences saying what the reader will get from this edition."),
  coverTone: z.enum(["light", "dark"]),
  period: z.string().nullable().describe("For archive editions only: the year covered, such as 2025. Otherwise null."),
  focus: z.enum(["review", "cosmetic", "clinical", "medical"]).nullable().describe("For archive editions only. Otherwise null."),
  pages: z.array(
    z.object({
      kind: z.enum(EDITABLE_KINDS as [EditableKind, ...EditableKind[]]),
      kicker: z.string(),
      title: z.string(),
      intent: z.string().describe("Two or three sentences on what this page covers and why it matters to practitioners."),
    })
  ),
});
export type EditionOutline = z.infer<typeof EditionOutlineSchema>;

/* ------------------------------------------------------------------ */
/* Prompts                                                              */
/* ------------------------------------------------------------------ */

const EDITION_RULES = `You are writing an edition of Trichozette, the Trichollective members' magazine.

Rules for this edition, on top of the house rules:
- British English throughout.
- Never invent sources, studies, organisations, statistics, dates or URLs. The only news and sources you may refer to are the items listed in the prompt, and you must describe them accurately.
- Never write links or URLs in the text.
- A "pull" block must repeat a sentence that appears word for word in a paragraph of the same page. Never attribute a pull quote to a person.
- Make no medical or treatment claims and never diagnose. Where health is involved, say when to refer to a GP, a dermatologist or a qualified trichologist.
- Do not name community members or real practitioners.
- Write in full, complete sentences. Headings are complete, plain statements, not fragments or puns. No exclamation marks.
- Quizzes have three or four options, and "answer" is the zero-based index of the correct one.
- The perspectives page has exactly three views, in this order: cosmetic, clinical, medical.`;

function newsFor(topics: string[], audience: string[]): NewsItem[] {
  return news
    .map((n) => ({
      n,
      score:
        n.topics.filter((t) => topics.includes(t)).length * 2 + n.disciplines.filter((d) => audience.includes(d)).length,
    }))
    .filter((x) => x.score > (topics.length ? 1 : 0))
    .sort((a, b) => b.score - a.score || b.n.date.localeCompare(a.n.date))
    .slice(0, 8)
    .map((x) => x.n);
}

function newsBrief(items: NewsItem[]) {
  if (!items.length) return "No news items were chosen for this edition. Do not refer to specific news.";
  return items
    .map((n) => `- ${n.headline} (${n.source}, ${n.date}). ${n.summary} Why it matters: ${n.whyItMatters}`)
    .join("\n");
}

async function communityContext(now: Date) {
  try {
    const month = await readMonth(now);
    const spaces = month.spaces.slice(0, 3).map(([space, v]) => `${space} (${v.posts.length} posts)`);
    const titles = month.ranked
      .map((p) => p.title)
      .filter((t): t is string => !!t)
      .slice(0, 8);
    if (!month.ranked.length) return "";
    return `What members discussed in the community over the past month (use it to choose angles, never quote or identify anyone):
Busiest spaces: ${spaces.join(", ")}
Recurring words: ${month.keywords.join(", ") || "none"}
Thread titles: ${titles.map((t) => excerpt(t, 90)).join("; ") || "none"}`;
  } catch {
    return "";
  }
}

/** How an existing edition is put together, so new ones follow the same shape. */
function examplePlan() {
  const e = allEditions.find((x) => x.series !== "archive") ?? allEditions[0];
  return e.pages
    .filter((p) => p.kind !== "news")
    .map((p, i) => `${i + 1}. ${p.kind}${"kicker" in p ? ` (${p.kicker})` : ""}: ${"title" in p ? p.title : p.caption}`)
    .join("\n");
}

/* ------------------------------------------------------------------ */
/* Defaults and templates (used without AI)                             */
/* ------------------------------------------------------------------ */

const DEFAULT_PLAN: EditableKind[] = [
  "letter",
  "article",
  "perspectives",
  "interactive",
  "article",
  "glance",
  "image",
  "article",
  "article",
  "interactive",
];

export function defaultPlan(count: number): EditableKind[] {
  const n = Math.min(10, Math.max(6, count));
  return DEFAULT_PLAN.slice(0, n);
}

const TEMPLATE_KICKER: Record<EditableKind, string> = {
  letter: "Letter",
  article: "Feature",
  image: "Photograph",
  glance: "At a glance",
  interactive: "Test yourself",
  perspectives: "Three perspectives",
};

function firstSentence(text: string, max = 70) {
  const s = text.trim().split(/(?<=[.?])\s/)[0] ?? "";
  return s.length > max ? `${s.slice(0, max).replace(/\s+\S*$/, "")}` : s.replace(/[.?]$/, "");
}

/** An outline built from the brief alone, for when AI isn't available. */
export function templateOutline(brief: string, count: number, series: "current" | "archive"): EditionOutline {
  const topic = firstSentence(brief) || "A new edition";
  return {
    title: topic,
    fade: "Add the second cover line here.",
    theme: "New theme",
    standfirst: "Add one or two sentences that tell readers what this edition gives them.",
    coverTone: "light",
    period: series === "archive" ? String(new Date().getUTCFullYear()) : null,
    focus: series === "archive" ? "review" : null,
    pages: defaultPlan(count).map((kind, i) => ({
      kind,
      kicker: TEMPLATE_KICKER[kind],
      title: kind === "letter" ? "From the editor" : `${PAGE_KIND_LABEL[kind]} ${i + 1}`,
      intent: `Write this ${PAGE_KIND_LABEL[kind].toLowerCase()} page by hand. The brief was: ${excerpt(brief, 240)}`,
    })),
  };
}

/** A valid page with placeholder text, so the owner can fill it in by hand. */
export function templatePage(plan: Pick<PendingPage, "kind" | "kicker" | "title" | "intent">, coverKey: ImageKey): EditablePage {
  const placeholder: Block[] = [
    { type: "p", text: `Replace this paragraph with the page's text. What this page should cover: ${plan.intent}` },
  ];
  const kicker = plan.kicker || TEMPLATE_KICKER[plan.kind];
  const title = plan.title || PAGE_KIND_LABEL[plan.kind];
  switch (plan.kind) {
    case "letter":
      return { kind: "letter", title, blocks: placeholder, signoff: "The Trichollective editorial team" };
    case "article":
      return { kind: "article", kicker, title, standfirst: "Add a standfirst of one or two sentences.", blocks: placeholder };
    case "image":
      return { kind: "image", imageKey: coverKey, caption: title };
    case "glance":
      return { kind: "glance", kicker, title, rows: [{ label: "First point", value: "Add the detail here." }] };
    case "interactive":
      return {
        kind: "interactive",
        kicker,
        title,
        intro: "Add a sentence that introduces the questions.",
        blocks: [
          {
            type: "quiz",
            question: "Replace this with your question.",
            options: ["First option", "Second option", "Third option"],
            answer: 0,
            explain: "Explain why the correct answer is right.",
          },
        ],
      };
    case "perspectives":
      return {
        kind: "perspectives",
        kicker,
        title,
        intro: "Add a sentence on how each discipline approaches this topic.",
        views: DISCIPLINES.map((discipline) => ({
          discipline,
          heading: `The ${discipline} view`,
          blocks: [{ type: "p", text: `Write the ${discipline} perspective here.` }],
        })),
      };
  }
}

/* ------------------------------------------------------------------ */
/* Clean-up of generated pages                                          */
/* ------------------------------------------------------------------ */

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Keeps pull quotes only if they appear in the page's own paragraphs, and tidies quizzes. */
function cleanBlocks(blocks: z.infer<typeof GenBlock>[]): Block[] {
  const body = norm(blocks.filter((b) => b.type === "p" || b.type === "list").map((b) => ("text" in b ? b.text : b.items.join(" "))).join(" "));
  const out: Block[] = [];
  for (const b of blocks) {
    if (b.type === "pull" && !body.includes(norm(b.text))) continue;
    if (b.type === "quiz") {
      const options = b.options.filter((o) => o.trim());
      if (b.answer < 0 || b.answer >= options.length) continue;
      out.push({ ...b, options });
      continue;
    }
    out.push(b as Block);
  }
  return out;
}

function stripUrls(value: unknown): unknown {
  if (typeof value === "string") return value.replace(/https?:\/\/\S+/g, "").replace(/!/g, ".").replace(/\s{2,}/g, " ").trim();
  if (Array.isArray(value)) return value.map(stripUrls);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, k === "imageKey" ? v : stripUrls(v)]));
  return value;
}

function finishPage(kind: EditableKind, raw: unknown, intended: PendingPage): EditablePage | null {
  const page = stripUrls(raw) as Record<string, unknown>;
  page.kind = kind;
  if (kind === "article" && page.imageKey === null) delete page.imageKey;
  if ("blocks" in page && Array.isArray(page.blocks)) page.blocks = cleanBlocks(page.blocks as z.infer<typeof GenBlock>[]);
  if (kind === "perspectives" && Array.isArray(page.views)) {
    const views = page.views as { discipline: string; heading: string; blocks: z.infer<typeof GenBlock>[] }[];
    page.views = DISCIPLINES.map((d) => views.find((v) => v.discipline === d))
      .filter(Boolean)
      .map((v) => ({ ...v!, blocks: cleanBlocks(v!.blocks) }));
  }
  if (!page.title && kind !== "image") page.title = intended.title;
  const parsed = PAGE_SCHEMAS[kind].safeParse(page);
  if (!parsed.success) {
    console.warn(`[gazette-edition] generated ${kind} page failed validation`, parsed.error.issues[0]);
    return null;
  }
  return parsed.data as EditablePage;
}

/* ------------------------------------------------------------------ */
/* Generation                                                           */
/* ------------------------------------------------------------------ */

type Row = NonNullable<Awaited<ReturnType<typeof loadRow>>>;

function loadRow(id: string) {
  return prisma.gazetteEdition.findUnique({ where: { id } });
}

const asJson = (v: unknown) => JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;

/** Runs in one process at a time per edition, so a second request just waits for the first. */
const running = new Map<string, Promise<GenerationResult>>();

export type GenerationResult = { ok: boolean; written: number; failed: number; message: string };

export function generationRunning(id: string) {
  return running.has(id);
}

/** Outline (if needed), then every pending page. Safe to call again to carry on. */
export function runEditionGeneration(id: string): Promise<GenerationResult> {
  const existing = running.get(id);
  if (existing) return existing;
  const job = generate(id)
    .catch(async (error) => {
      console.error("[gazette-edition] generation failed", error);
      await prisma.gazetteEdition.update({ where: { id }, data: { status: "draft" } }).catch(() => null);
      return { ok: false, written: 0, failed: 0, message: "Generation stopped because of an error. Try again, or write the pages by hand." };
    })
    .finally(() => running.delete(id));
  running.set(id, job);
  return job;
}

async function generate(id: string): Promise<GenerationResult> {
  const row = await loadRow(id);
  if (!row) return { ok: false, written: 0, failed: 0, message: "That edition no longer exists." };

  const now = new Date();
  const series = row.series === "archive" ? "archive" : "current";
  const pages = Array.isArray(row.pages) ? [...(row.pages as unknown[])] : [];
  const relevant = newsFor(row.newsTopics, row.audience);
  const coverKey = (row.coverImageKey && row.coverImageKey in images ? row.coverImageKey : "community") as ImageKey;

  /* Stage 1: the outline. */
  if (pages.length === 0) {
    const { text: brief, target } = parseBrief(row.brief);
    const community = await communityContext(now);
    const outline =
      (await generateStructured(
        EditionOutlineSchema,
        `${EDITION_RULES}

Plan the edition. Follow the shape of existing editions: an editor's letter first, then ${PUBLIC_PREVIEW_PAGES - 1} strong article that the public can read as a preview, then the three perspectives page, then a mix of articles, an interactive page with quizzes, checklists or reveals, an at-a-glance page and, if it suits, one full-page photograph. The "In the news" page is added automatically, so do not plan one.

This is how an existing edition is laid out:
${examplePlan()}`,
        `Brief from the editor:
${brief || "No brief was given. Choose a useful practical theme."}

Series: ${series === "archive" ? "archive (a look back at a past year)" : "the monthly magazine"}
Audience: ${row.audience.join(", ") || "cosmetic, clinical and medical"}
Plan exactly ${target} pages.

News you may draw on:
${newsBrief(relevant)}

${community}`
      )) ?? null;

    const plan = outline && outline.pages.length >= 3 ? outline : templateOutline(brief, target, series);
    const usedAi = plan === outline;
    const planned: PendingPage[] = plan.pages.slice(0, 12).map((p) => ({ pending: true, ...p }));
    // Without AI, every page becomes a template page straight away.
    const firstPages = usedAi ? planned : planned.map((p) => templatePage(p, coverKey));

    await prisma.gazetteEdition.update({
      where: { id },
      data: {
        title: plan.title.trim() || row.title,
        fade: plan.fade.trim(),
        theme: plan.theme.trim() || row.theme,
        standfirst: plan.standfirst.trim(),
        coverTone: plan.coverTone,
        period: row.period ?? plan.period ?? null,
        focus: row.focus ?? plan.focus ?? null,
        pages: asJson(firstPages),
        sources:
          row.sources ??
          (relevant.length ? asJson(relevant.slice(0, 6).map((n) => ({ label: `${n.source}: ${n.headline}`, url: n.url }))) : undefined),
        ...(usedAi ? {} : { status: "draft" }),
      },
    });
    if (!usedAi) {
      return {
        ok: true,
        written: 0,
        failed: 0,
        message: aiAvailable()
          ? "The outline couldn't be generated, so the edition has template pages for you to fill in."
          : "AI isn't set up, so the edition has template pages for you to fill in by hand.",
      };
    }
    pages.splice(0, pages.length, ...firstPages);
  }

  /* Stage 2: every pending page, three at a time. */
  const fresh = (await loadRow(id)) as Row;
  const todo = pages.map((p, i) => ({ p, i })).filter((x): x is { p: PendingPage; i: number } => isPending(x.p));
  if (!todo.length) {
    await prisma.gazetteEdition.update({ where: { id }, data: { status: "draft" } });
    return { ok: true, written: 0, failed: 0, message: "Every page is written." };
  }

  const outlineText = pages
    .map((p, i) => {
      const kind = (p as { kind?: string }).kind ?? "page";
      const title = (p as { title?: string; caption?: string }).title ?? (p as { caption?: string }).caption ?? "";
      return `${i + 1}. ${kind}: ${title}`;
    })
    .join("\n");
  const community = await communityContext(now);
  const imageList = IMAGE_KEYS.map((k) => `${k}: ${images[k].alt}`).join("\n");

  // Saves are queued so parallel pages never overwrite each other.
  let saving: Promise<unknown> = Promise.resolve();
  const save = (index: number, page: EditablePage) => {
    saving = saving.then(async () => {
      const current = await loadRow(id);
      if (!current) return;
      const list = Array.isArray(current.pages) ? [...(current.pages as unknown[])] : [];
      if (!isPending(list[index])) return; // Someone changed this page meanwhile.
      list[index] = page;
      await prisma.gazetteEdition.update({ where: { id }, data: { pages: asJson(list) } });
    });
    return saving;
  };

  let written = 0;
  let failed = 0;
  const queue = [...todo];
  const worker = async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      const { p, i } = job;
      const schema = GEN_SCHEMAS[p.kind] as z.ZodType<unknown>;
      const raw = await generateStructured(
        schema,
        `${EDITION_RULES}

Write one page of the edition. Page kinds:
- letter: the editor's letter, four or five paragraphs, signed off by "The Trichollective editorial team".
- article: a feature of 500 to 800 words in paragraphs with two or three "h" subheadings, and optionally one pull quote and one callout.
- perspectives: the same topic from the cosmetic chair, the trichology clinic and the medical consulting room, each with a heading and two or three paragraphs.
- interactive: three to five quizzes, checklists or reveals that test what readers learned in this edition.
- glance: five to eight label and value rows, such as a protocol, a timeline or key facts.
- image: a full-page photograph with a one-sentence caption, chosen from the image list.`,
        `Edition: ${fresh.title}. ${fresh.fade}
Theme: ${fresh.theme}
Standfirst: ${fresh.standfirst}
Audience: ${fresh.audience.join(", ")}
Brief from the editor: ${parseBrief(fresh.brief).text || "none"}

The whole edition:
${outlineText}

Write page ${i + 1}, a ${p.kind} page.
Kicker: ${p.kicker}
Title: ${p.title}
What it should cover: ${p.intent}
${p.note ? `\nThe editor asked for this rewrite: ${p.note}\n` : ""}${p.previous ? `\nThe previous version, to improve on:\n${excerpt(JSON.stringify(p.previous), 3000)}\n` : ""}
News you may draw on (and nothing else):
${newsBrief(relevant)}

${p.kind === "article" || p.kind === "image" ? `Images you may use (key: description):\n${imageList}\n` : ""}${community}`
      );
      const page = raw ? finishPage(p.kind, raw, p) : null;
      if (page) {
        written++;
        await save(i, page);
      } else {
        failed++;
      }
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  await saving;

  // A page that failed stays pending, so "Generate remaining pages" can try again.
  await prisma.gazetteEdition.update({ where: { id }, data: { status: "draft" } });
  return {
    ok: failed === 0,
    written,
    failed,
    message: failed
      ? `${written} pages were written. ${failed} couldn't be written this time; use "Generate remaining pages" to try again, or write them by hand.`
      : `${written} pages were written. Read them through before you publish.`,
  };
}

/** Replaces every pending page with a template page, for writing by hand. */
export function fillPendingWithTemplates(pages: unknown[], coverKey: ImageKey) {
  return pages.map((p) => (isPending(p) ? templatePage(p, coverKey) : p));
}

/** The highest edition numbers so far, for numbering a new one on publish. */
export async function editionNumbers() {
  const [live, db] = await Promise.all([
    getAllEditions(),
    prisma.gazetteEdition.findMany({ where: { number: { gt: 0 } }, select: { number: true, series: true, period: true } }),
  ]);
  return [
    ...live.map((e) => ({ number: e.number, series: e.series, period: e.period })),
    ...db.map((e) => ({ number: e.number, series: e.series === "archive" ? ("archive" as const) : ("current" as const), period: e.period ?? undefined })),
  ];
}
