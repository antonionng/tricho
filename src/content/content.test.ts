import { describe, expect, it } from "vitest";
import { allEditions, archive, editions, pageTitle, PUBLIC_PREVIEW_PAGES, type Block, type Page } from "./gazette";
import { guides } from "./guides";
import { glossary } from "./glossary";
import { news } from "./news";
import { courses } from "./courses";
import { images } from "./images";

const BANNED = /\b(unlock|elevate|seamless|empower(ing)?|game-?changer|revolutioni[sz]e|delve|cutting-edge|world-class)\b/i;

function blocksOf(p: Page): Block[] {
  if (p.kind === "perspectives") return p.views.flatMap((v) => v.blocks);
  return "blocks" in p ? p.blocks : [];
}

describe("Trichozette editions", () => {
  it("have unique slugs and numbers", () => {
    expect(new Set(allEditions.map((e) => e.slug)).size).toBe(allEditions.length);
    expect(new Set(allEditions.map((e) => e.number)).size).toBe(allEditions.length);
  });

  it("each have a public preview followed by the three perspectives", () => {
    for (const e of editions) {
      expect(e.pages.length).toBeGreaterThan(PUBLIC_PREVIEW_PAGES + 2);
      expect(e.pages[PUBLIC_PREVIEW_PAGES].kind).toBe("perspectives");
      const views = (e.pages[PUBLIC_PREVIEW_PAGES] as Extract<Page, { kind: "perspectives" }>).views.map((v) => v.discipline);
      expect(views).toEqual(["cosmetic", "clinical", "medical"]);
    }
  });

  it("have answerable quizzes", () => {
    for (const e of allEditions)
      for (const p of e.pages)
        for (const b of blocksOf(p))
          if (b.type === "quiz") {
            expect(b.answer, `${e.slug}: ${b.question}`).toBeGreaterThanOrEqual(0);
            expect(b.answer).toBeLessThan(b.options.length);
          }
  });

  it("every page has a title", () => {
    for (const e of allEditions) for (const p of e.pages) expect(pageTitle(p).length).toBeGreaterThan(2);
  });
});

describe("the four-year archive", () => {
  it("covers 2023 to 2026, four editions a year, one per field", () => {
    for (const year of ["2023", "2024", "2025", "2026"]) {
      const focus = archive.filter((e) => e.period === year).map((e) => e.focus).sort();
      expect(focus, year).toEqual(["clinical", "cosmetic", "medical", "review"]);
    }
  });

  it("sources every edition with real links", () => {
    for (const e of archive) {
      expect(e.sources?.length ?? 0, e.slug).toBeGreaterThanOrEqual(4);
      for (const s of e.sources ?? []) expect(s.url, e.slug).toMatch(/^https:\/\//);
    }
  });

  it("is published now, not backdated", () => {
    for (const e of archive) expect(e.published, e.slug).toBe("2026-09-30");
  });

  it("gives every edition enough to read behind the gate", () => {
    for (const e of archive) expect(e.pages.length, e.slug).toBeGreaterThan(PUBLIC_PREVIEW_PAGES + 2);
  });
});

describe("copy quality", () => {
  const texts: [string, string][] = [
    ...allEditions.flatMap((e) => e.pages.flatMap((p) => blocksOf(p).map((b) => [e.slug, JSON.stringify(b)] as [string, string]))),
    ...guides.map((g) => [g.slug, JSON.stringify(g)] as [string, string]),
    ...glossary.map((t) => [t.slug, JSON.stringify(t)] as [string, string]),
  ];

  it("avoids buzzwords", () => {
    for (const [where, t] of texts) expect(BANNED.test(t), `${where}: ${t.match(BANNED)?.[0]}`).toBe(false);
  });

  it("uses no exclamation marks", () => {
    for (const [where, t] of texts) expect(t.includes("!"), where).toBe(false);
  });
});

describe("news", () => {
  it("every item has a real source link and a date", () => {
    for (const n of news) {
      expect(n.url).toMatch(/^https:\/\//);
      expect(n.date).toMatch(/^\d{4}-\d{2}(-\d{2})?$/);
      expect(n.disciplines.length).toBeGreaterThan(0);
    }
  });

  it("is sorted newest first", () => {
    const dates = news.map((n) => n.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });
});

describe("glossary", () => {
  it("has no broken cross-references", () => {
    const slugs = new Set(glossary.map((t) => t.slug));
    for (const t of glossary) for (const s of t.see) expect(slugs.has(s), `${t.slug} → ${s}`).toBe(true);
    for (const g of guides) for (const s of g.related.glossary) expect(slugs.has(s), `${g.slug} → ${s}`).toBe(true);
  });
});

describe("Course images", () => {
  it("are unique across the catalogue", () => {
    const keys = courses.map((c) => c.imageKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("all exist in the image registry", () => {
    for (const c of courses) expect(images, c.slug).toHaveProperty(c.imageKey);
  });
});
