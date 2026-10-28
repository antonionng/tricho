import "server-only";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { BlogArticle, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { site } from "@/config/site";
import { authors } from "@/content/authors";
import { BLOG_CATEGORIES, filePosts, headingsOf, type BlogPost } from "@/content/blog";
import { scorePost } from "@/content/blog/quality";
import { AUTHOR_IDS, CATEGORY_SLUGS, IMAGE_KEYS } from "@/content/blog/schema";
import { SOURCE_LIBRARY } from "@/content/blog/sources";
import { writerState, type WriterPlan, type WriterReview, type WriterState, type WriterStep } from "@/content/blog/writer";
import { DISCIPLINES } from "@/content/disciplines";
import { glossary } from "@/content/glossary";
import { guides } from "@/content/guides";
import { images } from "@/content/images";
import { news } from "@/content/news";
import { AGENT_MODEL, HOUSE_RULES, aiAvailable, tidy } from "./ai";
import { readSource } from "./research";

/** The blog is our best shot at search and AI answers, so it can use a stronger model than the daily agents. */
export const BLOG_MODEL = process.env.TRICHO_BLOG_MODEL || AGENT_MODEL;

/** Stop starting new steps after this long, so one request never runs into the platform's time limit. */
const STEP_BUDGET_MS = 150_000;
const LEASE_MS = 6 * 60_000;

/* ------------------------------------------------------------------ */
/* What the writer knows about the site                                 */
/* ------------------------------------------------------------------ */

async function siteMap() {
  const rows = await prisma.blogArticle
    .findMany({ where: { status: { in: ["published", "draft"] } }, select: { slug: true, title: true, status: true } })
    .catch(() => []);
  const posts = [
    ...filePosts.map((p) => ({ slug: p.slug, title: p.title, live: true })),
    ...rows.map((r) => ({ slug: r.slug, title: r.title, live: r.status === "published" })),
  ];
  const links = new Map<string, string>([
    ["/directory", "Directory of hair and scalp professionals"],
    ["/find", "Help choosing the right kind of professional"],
    ["/learn", "Courses for professionals"],
    ["/pricing", "Trichollective membership"],
    ...DISCIPLINES.map((d) => [`/directory/${d.slug}`, `Directory: ${d.plural}`] as [string, string]),
    ...guides.map((g) => [`/guides/${g.slug}`, `Guide: ${g.title}`] as [string, string]),
    ...glossary.map((t) => [`/glossary/${t.slug}`, `Glossary: ${t.term}`] as [string, string]),
    ...posts.filter((p) => p.live).map((p) => [`/blog/${p.slug}`, `Blog: ${p.title}`] as [string, string]),
  ]);
  return { posts, links };
}

/* ------------------------------------------------------------------ */
/* Model calls                                                          */
/* ------------------------------------------------------------------ */

async function structured<T>(schema: z.ZodType<T>, system: string, prompt: string): Promise<T> {
  const { output } = await generateText({
    model: BLOG_MODEL,
    system: `${HOUSE_RULES}\n\n${system}`,
    prompt,
    output: Output.object({ schema }),
  });
  if (!output) throw new Error("The model didn't return anything usable.");
  return output as T;
}

const FORMAT = `For this task only, ignore the house rule about plain text. Write the body in Markdown:
- "## " for each section heading and "### " for sub-sections. Never use "# ".
- "- " for bullet lists. No bold, italics, tables, images or HTML.
- Links as [words](/path). Only link to the internal pages you are given, and never to outside websites in the body.`;

const EDITOR = `You are the senior editor of the ${site.name} blog. Your job is to publish the single most useful, trustworthy answer on the internet to one question about hair and scalp care, written so that Google ranks it and AI assistants such as ChatGPT, Claude and Perplexity quote it and cite us.

What makes a post excellent here:
- It answers the question in the first sentences, then goes deeper. Every section heading is a question someone would actually type or ask, and the first sentence under it answers that question directly.
- It is written for the UK and Ireland: GPs, the NHS and the HSE, British spelling.
- It is practical. Professionals get consultation language, red flags, referral pathways, case notes and scope of practice. The public get plain explanations and clear next steps.
- It never diagnoses or promises results, and says plainly when someone should see their GP.
- Every fact can be traced to the numbered source extracts you are given. If the extracts don't support a detail, leave it out or speak generally. Never invent figures, studies, quotes, organisations or rules.
- Short paragraphs of two to four sentences. Complete sentences. No filler, no "In this post we will", no "In conclusion".`;

/* ------------------------------------------------------------------ */
/* Step 1: plan                                                         */
/* ------------------------------------------------------------------ */

const PlanOut = z.object({
  searchIntent: z.string().describe("One sentence: what the person searching really wants to know or do."),
  titleOptions: z.array(z.string()).describe("Three titles, each 40 to 60 characters, using the words people search with."),
  slug: z.string().describe("Short web address, lower-case words joined by hyphens."),
  category: z.string(),
  audience: z.string().describe("public, professional or both"),
  image: z.string().describe("One image key from the list."),
  tags: z.array(z.string()).describe("Four to six lower-case topical tags."),
  outline: z.array(z.object({ heading: z.string().describe("A question, ending with ?"), covers: z.string() })).describe("Five to seven sections."),
  sourceIds: z.array(z.string()).describe("Two to five library source ids to read before writing."),
  relatedGuides: z.array(z.string()),
  relatedGlossary: z.array(z.string()),
  discipline: z.string().describe("cosmetic, clinical, medical or none: who the reader should find in the directory."),
});

async function plan(row: BlogArticle, state: WriterState) {
  const { posts, links } = await siteMap();
  const imageList = (Object.keys(images) as (keyof typeof images)[]).map((k) => `${k}: ${images[k].alt}`).join("\n");
  const out = await structured(
    PlanOut,
    `${EDITOR}\n\nPlan the post before it is written. Pick sources that will let every important point be supported. Do not plan a post that repeats one we already have; find the angle that adds something.`,
    [
      `Question to answer: ${row.targetQuery}`,
      row.brief ? `Editor's brief: ${row.brief}` : "",
      state.note ? `Rewrite instruction from the editor: ${state.note}\nCurrent title: ${row.title}\nCurrent outline: ${headingsOf(row.body).map((h) => h.text).join(" | ")}` : "",
      `Suggested audience: ${row.audience}. Suggested category: ${row.category}.`,
      `Categories: ${BLOG_CATEGORIES.map((c) => `${c.slug} (${c.description})`).join("; ")}`,
      `Posts we already have (avoid repeating them):\n${posts.map((p) => `- ${p.title}`).join("\n")}`,
      `Guides: ${guides.map((g) => g.slug).join(", ")}`,
      `Glossary terms: ${glossary.map((t) => t.slug).join(", ")}`,
      `Source library (id: what it covers):\n${SOURCE_LIBRARY.map((s) => `${s.id}: ${s.label}, ${s.covers}`).join("\n")}`,
      row.sourceUrls.length ? `The editor also asked you to read: ${row.sourceUrls.join(", ")}` : "",
      `Images (key: description):\n${imageList}`,
      `Recent news, for context only:\n${news.slice(0, 6).map((n) => `- ${n.headline} (${n.source})`).join("\n")}`,
      `Internal pages that exist: ${links.size}.`,
    ]
      .filter(Boolean)
      .join("\n\n")
  );

  const titles = out.titleOptions.map((t) => t.trim()).filter(Boolean);
  const title = titles.find((t) => t.length >= 30 && t.length <= 60) ?? titles[0] ?? row.targetQuery;
  const urls = [
    ...SOURCE_LIBRARY.filter((s) => out.sourceIds.includes(s.id)).map((s) => s.url),
    ...row.sourceUrls,
  ];
  const fallbackSources = urls.length ? urls : SOURCE_LIBRARY.slice(0, 2).map((s) => s.url);
  const planState: WriterPlan = {
    searchIntent: out.searchIntent,
    titleOptions: titles,
    outline: out.outline,
    sourceUrls: [...new Set(fallbackSources)].slice(0, 7),
  };
  const discipline = ["cosmetic", "clinical", "medical"].includes(out.discipline) ? out.discipline : undefined;
  return {
    plan: planState,
    fields: {
      title: row.title && state.note ? row.title : title,
      slug: row.status === "published" ? row.slug : await uniqueSlug(out.slug || title, row.id),
      category: (CATEGORY_SLUGS as string[]).includes(out.category) ? out.category : row.category,
      audience: ["public", "professional", "both"].includes(out.audience) ? out.audience : row.audience,
      image: (IMAGE_KEYS as string[]).includes(out.image) ? out.image : row.image,
      tags: out.tags.map((t) => t.toLowerCase().trim()).filter(Boolean).slice(0, 8),
      related: {
        guides: out.relatedGuides.filter((g) => guides.some((x) => x.slug === g)).slice(0, 3),
        glossary: out.relatedGlossary.filter((g) => glossary.some((x) => x.slug === g)).slice(0, 5),
        ...(discipline ? { discipline } : {}),
      },
    },
  };
}

export function slugify(s: string) {
  const slug = s
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  // Cut long addresses at a whole word.
  return slug.length <= 60 ? slug : slug.slice(0, 61).replace(/-[^-]*$/, "");
}

export async function uniqueSlug(wanted: string, exceptId?: string) {
  const base = slugify(wanted) || "post";
  for (let i = 1; i < 50; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    if (filePosts.some((p) => p.slug === slug)) continue;
    const taken = await prisma.blogArticle.findFirst({ where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { id: true } });
    if (!taken) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/* ------------------------------------------------------------------ */
/* Step 2: research                                                     */
/* ------------------------------------------------------------------ */

async function research(state: WriterState) {
  const urls = state.plan?.sourceUrls ?? [];
  const read = await Promise.all(urls.map((url) => readSource(url, SOURCE_LIBRARY.find((s) => s.url === url)?.label)));
  const ok = read.filter((r) => r.ok);
  if (ok.length === 0) {
    throw new Error(`None of the sources could be read (${read.map((r) => `${r.url}: ${r.error}`).join("; ")}). Add a source URL in the brief and try again.`);
  }
  return {
    research: read.map((r) => ({ url: r.url, label: r.label, ok: r.ok, error: r.error, chars: r.text.length })),
    extracts: ok.map((r) => ({ url: r.url, label: r.label, text: r.text })),
  };
}

const extractsBlock = (state: WriterState) =>
  (state.extracts ?? []).map((e, i) => `[${i + 1}] ${e.label} (${e.url})\n${e.text}`).join("\n\n---\n\n");

/* ------------------------------------------------------------------ */
/* Steps 3 and 5: write and revise                                      */
/* ------------------------------------------------------------------ */

const DraftOut = z.object({
  title: z.string().describe("40 to 60 characters."),
  description: z.string().describe("Meta description, 130 to 155 characters, a complete sentence that promises the answer."),
  standfirst: z.string().describe("Two or three sentences under the headline that tell the reader why this matters to them."),
  answer: z.string().describe("The direct answer in 45 to 70 words. Starts with the answer itself. Quotable on its own."),
  takeaways: z.array(z.string()).describe("Three to five key points, each one complete sentence."),
  body: z.string().describe("Markdown body, 900 to 1,500 words, five to seven '## ' sections whose headings are questions."),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).describe("Four follow-up questions people also ask, each answered in one to three sentences, not repeating the body."),
  sourcesUsed: z.array(z.number()).describe("The numbers of the extracts the post relies on."),
});
type Draft = z.infer<typeof DraftOut>;

function voiceFor(audience: string) {
  if (audience === "professional")
    return "Write for hair and scalp professionals (hairdressers, barbers, head spa therapists, trichologists, nurses and doctors). Speak to them as peers, use their working vocabulary, and make it useful in a consultation tomorrow.";
  if (audience === "public")
    return "Write for members of the public who are worried about their hair or scalp. Be calm, kind and plain. Explain any technical word the first time you use it.";
  return "Write so that a member of the public can follow it and a professional still learns something. Explain technical words once.";
}

async function write(row: BlogArticle, state: WriterState, links: Map<string, string>) {
  return structured(
    DraftOut,
    `${EDITOR}\n\n${voiceFor(row.audience)}\n\n${FORMAT}`,
    [
      `Question to answer: ${row.targetQuery}`,
      `What the searcher wants: ${state.plan?.searchIntent ?? ""}`,
      `Working title: ${row.title}`,
      row.brief ? `Editor's brief: ${row.brief}` : "",
      state.note ? `The editor asked for this rewrite: ${state.note}\n\nThe current version, to improve on:\n${row.body}` : "",
      `Outline:\n${(state.plan?.outline ?? []).map((o) => `## ${o.heading}\n${o.covers}`).join("\n")}`,
      `Internal pages you may link to (use two to four, where they genuinely help):\n${[...links.entries()].map(([path, name]) => `${path}  ${name}`).join("\n")}`,
      `Source extracts. Every fact must come from these:\n\n${extractsBlock(state)}`,
    ]
      .filter(Boolean)
      .join("\n\n")
  );
}

async function revise(row: BlogArticle, state: WriterState, links: Map<string, string>, issues: string[]) {
  return structured(
    DraftOut,
    `${EDITOR}\n\n${voiceFor(row.audience)}\n\n${FORMAT}\n\nYou are revising a draft. Fix every issue listed. Remove or soften any claim the sources don't support rather than defending it. Keep everything else that works.`,
    [
      `Question to answer: ${row.targetQuery}`,
      `Issues to fix:\n${issues.map((i) => `- ${i}`).join("\n")}`,
      `The draft:\nTitle: ${row.title}\nDescription: ${row.description}\nStandfirst: ${row.standfirst}\nShort answer: ${row.answer}\nKey points:\n${row.takeaways.map((t) => `- ${t}`).join("\n")}\n\n${row.body}\n\nFAQs:\n${(row.faqs as { q: string; a: string }[]).map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n")}`,
      `Internal pages you may link to:\n${[...links.keys()].join("\n")}`,
      `Source extracts:\n\n${extractsBlock(state)}`,
    ].join("\n\n")
  );
}

/** Keep only links to pages that exist; anything else becomes plain words. */
export function cleanLinks(markdown: string, allowed: Set<string>) {
  return markdown.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (whole, words: string, href: string) => {
    const path = href.replace(/^https?:\/\/(www\.)?trichollective\.net/, "").replace(/[#?].*$/, "").replace(/\/$/, "") || "/";
    return allowed.has(path) ? `[${words}](${path})` : words;
  });
}

function draftFields(d: Draft, state: WriterState, allowed: Set<string>) {
  const extracts = state.extracts ?? [];
  const used = [...new Set(d.sourcesUsed)].map((n) => extracts[n - 1]).filter(Boolean);
  const sources = (used.length >= 2 ? used : extracts).map((e) => ({ label: e.label, url: e.url }));
  const clean = (s: string) => tidy(s).replace(/^# .*\n+/m, "");
  return {
    title: tidy(d.title).replace(/\.$/, ""),
    description: tidy(d.description),
    standfirst: tidy(d.standfirst),
    answer: tidy(d.answer),
    takeaways: d.takeaways.map(tidy).filter(Boolean).slice(0, 5),
    body: cleanLinks(clean(d.body), allowed),
    faqs: d.faqs.map((f) => ({ q: tidy(f.q).replace(/\.$/, "?"), a: tidy(f.a) })).slice(0, 5),
    sources,
  };
}

/* ------------------------------------------------------------------ */
/* Step 4: check                                                        */
/* ------------------------------------------------------------------ */

const ReviewOut = z.object({
  verdict: z.string().describe("ready or needs-work"),
  summary: z.string().describe("Two sentences for the editor on how trustworthy the draft is."),
  unsupported: z.array(z.object({ claim: z.string(), why: z.string() })).describe("Specific statements the extracts do not support."),
  safety: z.array(z.string()).describe("Anything that diagnoses, promises results, could delay medical care or gives medicine advice."),
  style: z.array(z.string()).describe("Breaches of the house style."),
});

async function check(row: BlogArticle, state: WriterState): Promise<WriterReview> {
  const out = await structured(
    ReviewOut,
    `You are a meticulous fact-checker for a health-adjacent publication. Compare the draft with the source extracts line by line. List only real problems, quoting the exact words. A general statement of good practice (such as "keep notes securely") needs no source; a medical fact, timescale, figure, rule or claim about an organisation does. Be strict about safety: nothing may diagnose, promise an outcome or suggest delaying a GP visit.`,
    [
      `Draft:\nTitle: ${row.title}\nShort answer: ${row.answer}\nKey points:\n${row.takeaways.map((t) => `- ${t}`).join("\n")}\n\n${row.body}\n\nFAQs:\n${(row.faqs as { q: string; a: string }[]).map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n")}`,
      `Source extracts:\n\n${extractsBlock(state)}`,
    ].join("\n\n")
  );
  return {
    verdict: out.verdict === "ready" && !out.unsupported.length && !out.safety.length ? "ready" : "needs-work",
    summary: out.summary,
    unsupported: out.unsupported.slice(0, 12),
    safety: out.safety.slice(0, 8),
    style: out.style.slice(0, 8),
  };
}

/** Problems the scorer can see, worded as instructions for the reviser. */
function scoreIssues(row: BlogArticle, post: Partial<BlogPost>) {
  const { checks } = scorePost({
    title: row.title,
    description: row.description,
    slug: row.slug,
    answer: row.answer,
    takeaways: row.takeaways,
    body: row.body,
    faqs: (row.faqs as BlogPost["faqs"]) ?? [],
    sources: (row.sources as BlogPost["sources"]) ?? [],
    tags: row.tags,
    category: row.category as BlogPost["category"],
    reviewer: null,
    targetQuery: row.targetQuery,
    ...post,
  });
  return checks.filter((c) => !c.ok && !["reviewer", "slug", "tags"].includes(c.id)).map((c) => `${c.label} (${c.hint})`);
}

/* ------------------------------------------------------------------ */
/* The run                                                              */
/* ------------------------------------------------------------------ */

const asJson = (v: unknown) => JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;

/** Start (or restart) writing. The run itself happens in runBlogWriter, called by the editor page. */
export function freshState(note?: string): WriterState {
  return { step: "planning", ...(note ? { note } : {}), model: BLOG_MODEL, startedAt: new Date().toISOString() };
}

export type WriterResult = { ok: boolean; done: boolean; message: string };

/**
 * Carries a post through plan → research → write → check → revise. Each step is
 * saved as it finishes, so a run that stops (a timeout, a deploy) carries on
 * from the same place next time. A lease on the row stops two runs overlapping.
 */
export async function runBlogWriter(id: string): Promise<WriterResult> {
  if (!aiAvailable()) return { ok: false, done: false, message: "The AI writer needs AI_GATEWAY_API_KEY to be set." };
  const started = Date.now();

  let row = await prisma.blogArticle.findUnique({ where: { id } });
  if (!row) return { ok: false, done: false, message: "That post no longer exists." };
  let state = writerState(row.ai);
  if (!state || state.step === "done") return { ok: true, done: true, message: "This post has already been written." };
  if (state.lockedUntil && new Date(state.lockedUntil) > new Date()) return { ok: true, done: false, message: "The writer is already working on this post." };

  // Claim the post. updatedAt makes this an optimistic lock: if another run got there first, nothing changes.
  if (state.step === "failed") state = { ...state, step: state.failedAt ?? "planning", error: undefined, failedAt: undefined };
  const claimed = await prisma.blogArticle.updateMany({
    where: { id, updatedAt: row.updatedAt },
    data: { status: row.status === "published" ? "published" : "writing", ai: asJson({ ...state, lockedUntil: new Date(Date.now() + LEASE_MS).toISOString() }) },
  });
  if (claimed.count === 0) return { ok: true, done: false, message: "The writer is already working on this post." };

  const save = async (step: WriterStep, patch: Partial<WriterState>, data: Prisma.BlogArticleUpdateInput = {}) => {
    // The lease is renewed on every save unless the patch releases it.
    state = { ...state!, lockedUntil: new Date(Date.now() + LEASE_MS).toISOString(), ...patch, step };
    row = await prisma.blogArticle.update({ where: { id }, data: { ...data, ai: asJson(state) } });
  };

  try {
    const { links } = await siteMap();
    const allowed = new Set(links.keys());

    while (state.step !== "done" && Date.now() - started < STEP_BUDGET_MS) {
      switch (state.step) {
        case "planning": {
          const { plan: p, fields } = await plan(row, state);
          await save("researching", { plan: p }, { ...fields, related: asJson(fields.related) });
          break;
        }
        case "researching": {
          const r = await research(state);
          await save("writing", r);
          break;
        }
        case "writing": {
          const d = draftFields(await write(row, state, links), state, allowed);
          await save("checking", {}, { ...d, faqs: asJson(d.faqs), sources: asJson(d.sources) });
          break;
        }
        case "checking": {
          const review = await check(row, state);
          const needsWork = review.unsupported.length + review.safety.length + review.style.length > 0 || scoreIssues(row, {}).length > 0;
          await save(needsWork ? "revising" : "done", { review });
          break;
        }
        case "revising": {
          const review = state.review!;
          const issues = [
            ...review.unsupported.map((u) => `Unsupported: "${u.claim}" (${u.why})`),
            ...review.safety.map((s) => `Safety: ${s}`),
            ...review.style.map((s) => `Style: ${s}`),
            ...scoreIssues(row, {}),
          ];
          const d = draftFields(await revise(row, state, links, issues), state, allowed);
          await save("done", { fixed: issues }, { ...d, faqs: asJson(d.faqs), sources: asJson(d.sources) });
          break;
        }
        default:
          state.step = "done";
      }
    }

    if (state.step !== "done") {
      await save(state.step, { lockedUntil: undefined });
      return { ok: true, done: false, message: "Still writing. Carrying on in a moment." };
    }
    await save("done", { lockedUntil: undefined, finishedAt: new Date().toISOString(), note: undefined }, { status: row.status === "published" ? "published" : "draft" });
    return { ok: true, done: true, message: "The draft is ready to edit." };
  } catch (error) {
    console.error(`[blog-writer] ${id} failed at ${state.step}`, error);
    const message = error instanceof Error ? error.message.split("\n")[0].slice(0, 400) : "Something went wrong.";
    await prisma.blogArticle.update({
      where: { id },
      data: {
        status: row.body ? (row.status === "published" ? "published" : "draft") : "writing",
        ai: asJson({ ...state, step: "failed", failedAt: state.step, error: message, lockedUntil: undefined }),
      },
    });
    return { ok: false, done: false, message };
  }
}

/** For the agent and the editor: the author to credit by default. */
export const DEFAULT_AUTHOR: keyof typeof authors = AUTHOR_IDS.includes("editorial") ? "editorial" : AUTHOR_IDS[0];
