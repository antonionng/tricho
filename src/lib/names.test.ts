import { describe, expect, it } from "vitest";
import { shortName } from "./names";

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
