import { describe, expect, it } from "vitest";
import { allEditions } from "./index";
import { BlockSchema, EditionMetaSchema, PageSchema } from "./schema";

describe("Trichozette page schema", () => {
  it("accepts every written page of every built-in edition", () => {
    for (const e of allEditions)
      for (const [i, p] of e.pages.entries()) {
        if (p.kind === "news") continue;
        const parsed = PageSchema.safeParse(p);
        expect(parsed.success, `${e.slug} page ${i}: ${parsed.success ? "" : JSON.stringify(parsed.error.issues[0])}`).toBe(true);
      }
  });

  it("accepts the metadata of every built-in edition", () => {
    for (const e of allEditions) {
      const parsed = EditionMetaSchema.safeParse(e);
      expect(parsed.success, `${e.slug}: ${parsed.success ? "" : JSON.stringify(parsed.error.issues[0])}`).toBe(true);
    }
  });

  it("rejects a quiz whose answer is not one of the options", () => {
    const bad = { type: "quiz", question: "Which?", options: ["A", "B"], answer: 2, explain: "Because." };
    expect(BlockSchema.safeParse(bad).success).toBe(false);
    expect(BlockSchema.safeParse({ ...bad, answer: 1 }).success).toBe(true);
  });

  it("rejects an image key that does not exist", () => {
    expect(PageSchema.safeParse({ kind: "image", imageKey: "notAnImage", caption: "A caption." }).success).toBe(false);
    expect(PageSchema.safeParse({ kind: "image", imageKey: "salon", caption: "A caption." }).success).toBe(true);
  });

  it("does not accept news pages, which are generated", () => {
    expect(PageSchema.safeParse({ kind: "news", kicker: "In the news", title: "News", intro: "Intro.", items: [] }).success).toBe(false);
  });
});
