import { describe, expect, it } from "vitest";
import {
  paragraphs,
  partnerAllowance,
  PRACTITIONER,
  readHighlights,
  readOfferings,
  readSections,
  safeHex,
  textOn,
  tint,
  videoEmbedUrl,
} from "./showcase";

describe("partnerAllowance", () => {
  it("gives Business pages 8 photos and no video", () => {
    const a = partnerAllowance({ tier: "business" });
    expect(a.photos).toBe(8);
    expect(a.video).toBe(false);
    expect(a.sections).toBe(1);
  });
  it("gives Premium and charities 16 photos, video and 4 sections", () => {
    for (const p of [{ tier: "premium" }, { tier: "business", kind: "charity" }]) {
      const a = partnerAllowance(p);
      expect(a.photos).toBe(16);
      expect(a.video).toBe(true);
      expect(a.sections).toBe(4);
    }
  });
  it("gives gifted pages the Premium allowance", () => {
    expect(partnerAllowance({ tier: "business", kind: "gifted" }).photos).toBe(16);
  });
  it("gives practitioners 6 photos and a cover", () => {
    expect(PRACTITIONER.photos).toBe(6);
    expect(PRACTITIONER.cover).toBe(true);
  });
});

describe("reading stored content", () => {
  it("drops incomplete or malformed items", () => {
    expect(readHighlights([{ value: "20", label: "a month" }, { value: "" }, "x", null])).toEqual([{ value: "20", label: "a month" }]);
    expect(readHighlights("nope")).toEqual([]);
    expect(readOfferings([{ title: "Wigs", body: 3 }], 1)).toEqual([{ title: "Wigs", body: "" }]);
    expect(readSections([{ title: "Hair Fairy", steps: ["One", "", 4] }])[0].steps).toEqual(["One"]);
  });
  it("respects the limit", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ value: String(i), label: "x" }));
    expect(readHighlights(many, 3)).toHaveLength(3);
  });
});

describe("colours", () => {
  it("only accepts #rrggbb", () => {
    expect(safeHex("#d4007a")).toBe("#D4007A");
    expect(safeHex("red")).toBe("#0B0B0B");
    expect(safeHex("#fff;background:url(x)")).toBe("#0B0B0B");
  });
  it("picks readable text", () => {
    expect(textOn("#D4007A")).toBe("#FFFFFF");
    expect(textOn("#FCBEDA")).toBe("#0B0B0B");
    expect(textOn("#FFE600")).toBe("#0B0B0B");
    expect(textOn("#0B3D91")).toBe("#FFFFFF");
  });
  it("tints towards white", () => {
    expect(tint("#000000", 0)).toBe("#FFFFFF");
    expect(tint("#D4007A", 1)).toBe("#D4007A");
  });
});

describe("videoEmbedUrl", () => {
  it("handles YouTube and Vimeo links", () => {
    expect(videoEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(videoEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(videoEmbedUrl("https://vimeo.com/123456789")).toBe("https://player.vimeo.com/video/123456789?dnt=1");
  });
  it("refuses anything else", () => {
    expect(videoEmbedUrl("https://evil.example/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(videoEmbedUrl("javascript:alert(1)")).toBeNull();
  });
});

describe("paragraphs", () => {
  it("splits on blank lines, including the \\r\\n line breaks forms send", () => {
    expect(paragraphs("## Title\r\n\r\nOne.\r\n\r\nTwo.")).toEqual(["## Title", "One.", "Two."]);
    expect(paragraphs("A\n\n\nB")).toEqual(["A", "B"]);
    expect(paragraphs(null)).toEqual([]);
  });
});
