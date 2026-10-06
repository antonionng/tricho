import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
const { generateCode, hashCode } = await import("./login-code");

describe("sign-in codes", () => {
  it("are six digits", () => {
    for (let i = 0; i < 200; i++) expect(generateCode()).toMatch(/^\d{6}$/);
  });

  it("hash differently for each email", () => {
    expect(hashCode("a@example.com", "123456")).not.toBe(hashCode("b@example.com", "123456"));
    expect(hashCode("a@example.com", "123456")).toBe(hashCode("a@example.com", "123456"));
  });
});
