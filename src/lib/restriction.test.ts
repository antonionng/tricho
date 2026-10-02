import { describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: async () => null }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const { restrictionOf } = await import("./member");

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-10-02T12:00:00Z");

describe("restrictionOf", () => {
  it("is empty for an active member", () => {
    expect(restrictionOf({ accessStatus: "active" }, now)).toBeNull();
  });

  it("keeps a ban in place with no end", () => {
    expect(restrictionOf({ accessStatus: "banned", accessReason: "Spam" }, now)).toEqual({ status: "banned", until: null, reason: "Spam" });
  });

  it("ends a suspension on its own once the date passes", () => {
    const future = new Date(now.getTime() + DAY);
    const past = new Date(now.getTime() - DAY);
    expect(restrictionOf({ accessStatus: "suspended", accessUntil: future }, now)?.status).toBe("suspended");
    expect(restrictionOf({ accessStatus: "suspended", accessUntil: past }, now)).toBeNull();
    expect(restrictionOf({ accessStatus: "suspended", accessUntil: null }, now)?.status).toBe("suspended");
  });

  it("reports a mute only while it lasts", () => {
    expect(restrictionOf({ accessStatus: "active", mutedUntil: new Date(now.getTime() + DAY) }, now)?.status).toBe("muted");
    expect(restrictionOf({ accessStatus: "active", mutedUntil: new Date(now.getTime() - DAY) }, now)).toBeNull();
  });
});
