import { describe, expect, it } from "vitest";
import { plainTextBlocks } from "./plain-text";

describe("plainTextBlocks", () => {
  it("splits paragraphs on blank lines and keeps line breaks inside them", () => {
    expect(plainTextBlocks("One\ntwo\n\n\nThree")).toEqual([
      { type: "p", text: "One\ntwo" },
      { type: "p", text: "Three" },
    ]);
  });

  it("turns a line starting with ## into a heading", () => {
    expect(plainTextBlocks("Intro\n## What to look for\nA paragraph.\r\n")).toEqual([
      { type: "p", text: "Intro" },
      { type: "h2", text: "What to look for" },
      { type: "p", text: "A paragraph." },
    ]);
  });

  it("returns nothing for an empty body", () => {
    expect(plainTextBlocks("")).toEqual([]);
    expect(plainTextBlocks(null)).toEqual([]);
  });
});
