import { describe, expect, it } from "vitest";
import { cleanName, shortName } from "./names";

describe("shortName", () => {
  it("uses the first name", () => expect(shortName("Aoife Murphy")).toBe("Aoife"));
  it("keeps a title with the surname", () => {
    expect(shortName("Dr Sample Okafor")).toBe("Dr Okafor");
    expect(shortName("Prof. Jane Smith")).toBe("Prof Smith");
  });
  it("falls back when there is nothing usable", () => {
    expect(shortName("", "there")).toBe("there");
    expect(shortName("Dr", "them")).toBe("them");
  });
});

describe("cleanName", () => {
  it("tidies spacing", () => {
    expect(cleanName("  Richard   Coach ")).toBe("Richard Coach");
  });
  it("rejects anything too short or not text", () => {
    expect(cleanName("")).toBeNull();
    expect(cleanName(" R ")).toBeNull();
    expect(cleanName(null)).toBeNull();
  });
  it("caps the length", () => {
    expect(cleanName("a".repeat(200))).toHaveLength(80);
  });
});
