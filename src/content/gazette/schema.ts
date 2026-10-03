/**
 * Runtime validation for Trichozette editions written in Studio. Pure and
 * client-safe: it mirrors src/content/gazette/types.ts exactly, and the checks
 * at the bottom fail to compile if the two drift apart.
 */
import { z } from "zod";
import { images } from "@/content/images";
import type { NewsItem } from "@/content/news";
import type { Block, Edition, ImageKey, Page } from "./types";

export const IMAGE_KEYS = Object.keys(images) as [ImageKey, ...ImageKey[]];
export const ImageKeySchema = z.enum(IMAGE_KEYS);

export const DISCIPLINES = ["cosmetic", "clinical", "medical"] as const;
export const DisciplineSchema = z.enum(DISCIPLINES);

export const NEWS_TOPICS = [
  "hair-loss",
  "regulation",
  "products",
  "devices",
  "research",
  "head-spa",
  "business",
  "events",
] as const satisfies readonly NewsItem["topics"][number][];
export const NewsTopicSchema = z.enum(NEWS_TOPICS);

const text = z.string().trim().min(1);

export const QuizBlockSchema = z
  .object({
    type: z.literal("quiz"),
    question: text,
    options: z.array(text).min(2).max(6),
    answer: z.number().int().min(0),
    explain: text,
  })
  .refine((b) => b.answer < b.options.length, {
    message: "The correct answer must be one of the options.",
    path: ["answer"],
  });

export const BlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("p"), text }),
  z.object({ type: z.literal("h"), text }),
  z.object({ type: z.literal("list"), items: z.array(text).min(1) }),
  z.object({ type: z.literal("pull"), text }),
  z.object({ type: z.literal("callout"), title: text, text }),
  z.object({ type: z.literal("checklist"), title: text, items: z.array(text).min(1) }),
  QuizBlockSchema,
  z.object({ type: z.literal("reveal"), prompt: text, answer: text }),
]);

export const BLOCK_TYPES = ["p", "h", "list", "pull", "callout", "checklist", "quiz", "reveal"] as const satisfies readonly Block["type"][];

const blocks = z.array(BlockSchema).min(1);

export const LetterPageSchema = z.object({ kind: z.literal("letter"), title: text, blocks, signoff: text });
export const ArticlePageSchema = z.object({
  kind: z.literal("article"),
  kicker: text,
  title: text,
  standfirst: text,
  imageKey: ImageKeySchema.optional(),
  blocks,
});
export const ImagePageSchema = z.object({ kind: z.literal("image"), imageKey: ImageKeySchema, caption: text });
export const GlancePageSchema = z.object({
  kind: z.literal("glance"),
  kicker: text,
  title: text,
  rows: z.array(z.object({ label: text, value: text })).min(1),
});
export const InteractivePageSchema = z.object({
  kind: z.literal("interactive"),
  kicker: text,
  title: text,
  intro: text,
  blocks,
});
export const PerspectivesPageSchema = z.object({
  kind: z.literal("perspectives"),
  kicker: text,
  title: text,
  intro: text,
  views: z.array(z.object({ discipline: DisciplineSchema, heading: text, blocks })).min(1),
});

/** Every page kind an editor can write. "news" is left out: it is filled automatically from src/content/news.ts. */
export const PageSchema = z.discriminatedUnion("kind", [
  LetterPageSchema,
  ArticlePageSchema,
  ImagePageSchema,
  GlancePageSchema,
  InteractivePageSchema,
  PerspectivesPageSchema,
]);

export const PAGE_SCHEMAS = {
  letter: LetterPageSchema,
  article: ArticlePageSchema,
  image: ImagePageSchema,
  glance: GlancePageSchema,
  interactive: InteractivePageSchema,
  perspectives: PerspectivesPageSchema,
} as const;

export type EditablePage = Exclude<Page, { kind: "news" }>;
export type EditableKind = EditablePage["kind"];
export const EDITABLE_KINDS = Object.keys(PAGE_SCHEMAS) as EditableKind[];

export const PAGE_KIND_LABEL: Record<EditableKind, string> = {
  letter: "Letter",
  article: "Article",
  image: "Photograph",
  glance: "At a glance",
  interactive: "Interactive",
  perspectives: "Three perspectives",
};

export const SourceSchema = z.object({ label: text, url: z.string().trim().regex(/^https:\/\/\S+$/, "Use a full https:// link.") });

export const EditionMetaSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lower-case letters, numbers and hyphens."),
  title: text,
  fade: z.string().trim(),
  theme: text,
  standfirst: text,
  coverImageKey: ImageKeySchema.optional(),
  coverTone: z.enum(["light", "dark"]),
  audience: z.array(DisciplineSchema).min(1),
  series: z.enum(["current", "archive"]).optional(),
  period: z.string().trim().min(1).optional(),
  focus: z.enum(["review", "cosmetic", "clinical", "medical"]).optional(),
  sources: z.array(SourceSchema).optional(),
});

export type EditionMeta = z.infer<typeof EditionMetaSchema>;

/** Validates a whole list of pages and reports which ones fail. */
export function checkPages(pages: unknown): { pages: EditablePage[]; errors: { index: number; message: string }[] } {
  const list = Array.isArray(pages) ? pages : [];
  const ok: EditablePage[] = [];
  const errors: { index: number; message: string }[] = [];
  list.forEach((raw, index) => {
    const parsed = PageSchema.safeParse(raw);
    if (parsed.success) ok.push(parsed.data);
    else errors.push({ index, message: describeError(parsed.error) });
  });
  return { pages: ok, errors };
}

/** A short, readable account of the first problem in a zod error. */
export function describeError(error: z.ZodError) {
  const issue = error.issues[0];
  if (!issue) return "Something in this page is not valid.";
  const where = issue.path.length ? `${issue.path.join(" › ")}: ` : "";
  return `${where}${issue.message}`;
}

/* ------------------------------------------------------------------ */
/* Compile-time checks: the schemas must stay in step with types.ts.    */
/* ------------------------------------------------------------------ */

type Assert<T extends true> = T;
type Extends<A, B> = [A] extends [B] ? true : false;

export type _PageMatches = Assert<Extends<z.infer<typeof PageSchema>, Page>>;
export type _PageCovers = Assert<Extends<EditablePage, z.infer<typeof PageSchema>>>;
export type _BlockMatches = Assert<Extends<z.infer<typeof BlockSchema>, Block>>;
export type _BlockCovers = Assert<Extends<Block, z.infer<typeof BlockSchema>>>;
export type _MetaMatches = Assert<
  Extends<
    EditionMeta,
    Pick<Edition, "slug" | "title" | "fade" | "theme" | "standfirst" | "coverImageKey" | "coverTone" | "audience" | "series" | "period" | "focus" | "sources">
  >
>;
