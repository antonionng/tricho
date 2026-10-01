import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
const { slugify, cityKey } = await import("./directory");

describe("directory slugs", () => {
  it("makes readable, accent-free slugs", () => {
    expect(slugify("Sinéad Ní Bhriain Galway")).toBe("sinead-ni-bhriain-galway");
    expect(slugify("  Dr. Jane O'Neill — London ")).toBe("dr-jane-o-neill-london");
  });
  it("keys cities consistently", () => {
    expect(cityKey("Dún Laoghaire")).toBe("dun-laoghaire");
  });
});
