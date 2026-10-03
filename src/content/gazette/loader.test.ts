import { describe, expect, it } from "vitest";
import { archive, editions } from "./index";
import { isLive, mergeEditions, nextEditionNumber, rowToEdition, type EditionRow } from "./merge";
import type { Edition } from "./types";

const page = { kind: "letter", title: "A letter", blocks: [{ type: "p", text: "Hello." }], signoff: "The team" };

function row(over: Partial<EditionRow> = {}): EditionRow {
  return {
    id: "r1",
    slug: "studio-edition",
    number: 9,
    series: "current",
    status: "published",
    title: "A Studio edition",
    fade: "Written in Studio.",
    theme: "Studio",
    standfirst: "An edition written in Studio.",
    coverImageKey: "salon",
    coverTone: "light",
    audience: ["cosmetic"],
    period: null,
    focus: null,
    pages: [page],
    sources: null,
    newsTopics: [],
    scheduledFor: null,
    publishedAt: new Date("2026-10-10T09:00:00Z"),
    ...over,
  };
}

const quiet = () => {};

describe("rowToEdition", () => {
  it("turns a row into an edition dated by publishedAt", () => {
    const e = rowToEdition(row(), quiet)!;
    expect(e.published).toBe("2026-10-10");
    expect(e.series).toBe("current");
    expect(e.pages).toHaveLength(1);
  });

  it("drops invalid pages and rows with no valid pages", () => {
    const e = rowToEdition(row({ pages: [page, { kind: "image", imageKey: "nope", caption: "x" }] }), quiet)!;
    expect(e.pages).toHaveLength(1);
    expect(rowToEdition(row({ pages: [{ kind: "nonsense" }] }), quiet)).toBeNull();
  });

  it("adds the news page when topics are given", () => {
    const e = rowToEdition(row({ audience: ["medical", "clinical"], newsTopics: ["hair-loss", "regulation"] }), quiet)!;
    expect(e.pages.some((p) => p.kind === "news")).toBe(true);
  });
});

describe("isLive", () => {
  const now = new Date("2026-10-10T12:00:00Z");
  it("shows published and due scheduled editions only", () => {
    expect(isLive({ status: "published", scheduledFor: null }, now)).toBe(true);
    expect(isLive({ status: "scheduled", scheduledFor: new Date("2026-10-10T11:00:00Z") }, now)).toBe(true);
    expect(isLive({ status: "scheduled", scheduledFor: new Date("2026-10-11T11:00:00Z") }, now)).toBe(false);
    expect(isLive({ status: "draft", scheduledFor: null }, now)).toBe(false);
  });
});

describe("mergeEditions", () => {
  const staticAll = [...editions, ...archive];

  it("keeps the built-in edition when a Studio edition uses the same slug", () => {
    const clash: Edition = { ...rowToEdition(row(), quiet)!, slug: editions[0].slug, title: "Impostor", number: 99 };
    const merged = mergeEditions(staticAll, [clash]);
    expect(merged.all.filter((e) => e.slug === editions[0].slug)).toHaveLength(1);
    expect(merged.all.find((e) => e.slug === editions[0].slug)?.title).toBe(editions[0].title);
  });

  it("sorts new monthly editions first and files archive editions separately", () => {
    const fresh = rowToEdition(row({ number: 9 }), quiet)!;
    const look = rowToEdition(row({ slug: "look-back", series: "archive", period: "2027", focus: "review", number: 202701 }), quiet)!;
    const merged = mergeEditions(staticAll, [fresh, look]);
    expect(merged.editions[0].slug).toBe("studio-edition");
    expect(merged.archive[0].slug).toBe("look-back");
    expect(merged.editions.some((e) => e.series === "archive")).toBe(false);
    expect(merged.all).toHaveLength(staticAll.length + 2);
  });

  it("leaves the built-in lists unchanged when there are no Studio editions", () => {
    const merged = mergeEditions(staticAll, []);
    expect(merged.editions.map((e) => e.slug)).toEqual(editions.map((e) => e.slug));
    expect(merged.archive.map((e) => e.slug)).toEqual(archive.map((e) => e.slug));
  });
});

describe("nextEditionNumber", () => {
  it("counts on from the highest number in the series", () => {
    expect(nextEditionNumber([...editions, ...archive], "current")).toBe(Math.max(...editions.map((e) => e.number)) + 1);
    expect(nextEditionNumber([...editions, ...archive], "archive", "2026")).toBe(202605);
    expect(nextEditionNumber([...editions, ...archive], "archive", "2027")).toBe(202701);
  });
});
