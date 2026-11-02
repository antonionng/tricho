import { headingsOf } from "./index";
import type { BlogPost } from "./types";

/**
 * How ready a post is for search engines and AI answer engines. Pure, so the
 * Studio editor can score a post live as it is typed, and tests can hold the
 * posts in code to the same bar.
 */

export const BANNED = /\b(unlock|elevate|seamless|empower(ing)?|game-?changer|revolutioni[sz]e|delve|cutting-edge|world-class|journey)\b/i;

export type CheckGroup = "Search" | "Answer engines" | "Trust" | "Style";

export type Check = {
  id: string;
  group: CheckGroup;
  label: string;
  ok: boolean;
  /** What to change, shown when the check fails. */
  hint: string;
  weight: number;
};

export type Scorable = Pick<
  BlogPost,
  "title" | "description" | "slug" | "answer" | "takeaways" | "body" | "faqs" | "sources" | "tags" | "category" | "reviewer"
> & { targetQuery?: string };

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const STOP = new Set("a an the and or of to in on for with what when how why is are do does can you your my i it be at by from vs".split(" "));
const keyTerms = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));

export function checkPost(p: Scorable): Check[] {
  const h2 = headingsOf(p.body);
  const internal = [...p.body.matchAll(/\]\((\/[^)]+)\)/g)].length;
  const bodyWords = words(p.body.replace(/[#*_>`-]/g, " "));
  const sentences = p.body
    .replace(/^#+ .*$/gm, "")
    .replace(/^- .*$/gm, "")
    .split(/[.?]\s/)
    .map((s) => words(s))
    .filter((n) => n > 3);
  const avgSentence = sentences.length ? sentences.reduce((a, b) => a + b, 0) / sentences.length : 0;
  const answerWords = words(p.answer);
  const query = keyTerms(p.targetQuery ?? "");
  const titleTerms = new Set(keyTerms(p.title));
  const queryHit = query.length === 0 || query.filter((t) => titleTerms.has(t)).length / query.length >= 0.5;
  const health = ["hair-loss", "scalp-health", "consultations"].includes(p.category);
  const allText = [p.title, p.description, p.answer, ...p.takeaways, p.body, ...p.faqs.flatMap((f) => [f.q, f.a])].join(" ");

  return [
    { id: "title", group: "Search", weight: 3, label: "Title is 30 to 60 characters", ok: p.title.length >= 30 && p.title.length <= 60, hint: `It is ${p.title.length}. Google cuts titles off at about 60 characters.` },
    { id: "description", group: "Search", weight: 3, label: "Description is 120 to 160 characters", ok: p.description.length >= 120 && p.description.length <= 160, hint: `It is ${p.description.length}. This is the snippet under the link in search results.` },
    { id: "query", group: "Search", weight: 3, label: "Title uses the words people search for", ok: queryHit, hint: `Bring more of "${p.targetQuery}" into the title.` },
    { id: "slug", group: "Search", weight: 1, label: "Web address is short and readable", ok: /^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug) && p.slug.length <= 60, hint: "Use lower-case words joined by hyphens, 60 characters at most." },
    { id: "internal", group: "Search", weight: 2, label: "Links to at least two other pages on the site", ok: internal >= 2, hint: "Link to a guide, a glossary term or the directory where it helps the reader." },
    { id: "tags", group: "Search", weight: 1, label: "Has three to eight tags", ok: p.tags.length >= 3 && p.tags.length <= 8, hint: `It has ${p.tags.length}.` },

    { id: "answer", group: "Answer engines", weight: 4, label: "Short answer is 40 to 75 words", ok: answerWords >= 40 && answerWords <= 75, hint: `It is ${answerWords} words. AI assistants quote answers of about this length whole.` },
    { id: "answer-first", group: "Answer engines", weight: 2, label: "Short answer answers straight away", ok: !/^(this|in this|here|we)\b/i.test(p.answer.trim()), hint: "Start with the answer itself, not with 'This post…'." },
    { id: "sections", group: "Answer engines", weight: 2, label: "Has at least four sections", ok: h2.length >= 4, hint: `It has ${h2.length}. Use "## " for each section heading.` },
    { id: "questions", group: "Answer engines", weight: 3, label: "Most section headings are questions", ok: h2.length > 0 && h2.filter((h) => h.text.trim().endsWith("?")).length / h2.length >= 0.5, hint: "Phrase headings as the questions people ask, so each section can answer one." },
    { id: "takeaways", group: "Answer engines", weight: 2, label: "Has three to five key points", ok: p.takeaways.length >= 3 && p.takeaways.length <= 5, hint: `It has ${p.takeaways.length}.` },
    { id: "faqs", group: "Answer engines", weight: 2, label: "Has three to five common questions", ok: p.faqs.length >= 3 && p.faqs.length <= 5 && p.faqs.every((f) => f.q.trim().endsWith("?") && words(f.a) >= 12), hint: "Each question should end with a question mark and have an answer of a sentence or two." },

    { id: "sources", group: "Trust", weight: 4, label: "Cites at least two trusted sources", ok: p.sources.length >= 2 && p.sources.every((s) => /^https:\/\//.test(s.url)), hint: "Add the pages each fact comes from, such as the NHS, HSE or DermNet." },
    { id: "gp", group: "Trust", weight: 3, label: "Says when to see a GP", ok: !health || /\bGP\b/.test(p.body), hint: "Health posts should say plainly when someone should see their GP." },
    { id: "reviewer", group: "Trust", weight: 1, label: "Reviewed by a named clinician", ok: !!p.reviewer, hint: "Optional, but it helps Google and readers trust health content." },

    { id: "banned", group: "Style", weight: 2, label: "Avoids the words we never use", ok: !BANNED.test(allText), hint: `Remove "${allText.match(BANNED)?.[0] ?? ""}".` },
    { id: "exclaim", group: "Style", weight: 1, label: "No exclamation marks", ok: !allText.includes("!"), hint: "House style has no exclamation marks." },
    { id: "length", group: "Style", weight: 2, label: "Body is 600 to 2,500 words", ok: bodyWords >= 600 && bodyWords <= 2500, hint: `It is ${bodyWords} words.` },
    { id: "sentences", group: "Style", weight: 1, label: "Sentences are easy to read", ok: avgSentence > 0 && avgSentence <= 24, hint: `Sentences average ${Math.round(avgSentence)} words. Aim for under 24.` },
  ];
}

/** 0 to 100. */
export function scorePost(p: Scorable) {
  const checks = checkPost(p);
  const total = checks.reduce((a, c) => a + c.weight, 0);
  const got = checks.filter((c) => c.ok).reduce((a, c) => a + c.weight, 0);
  return { score: Math.round((got / total) * 100), checks };
}
