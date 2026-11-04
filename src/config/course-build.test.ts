import { describe, expect, it } from "vitest";
import { buildSharePct, buildTierById, courseBuild } from "./course-build";
import { educatorMembership } from "./subscriptions";

describe("course build tiers", () => {
  it("offers Tailor, Build and Build + film, in that order", () => {
    expect(courseBuild.tiers.map((t) => t.name)).toEqual(["Tailor", "Build", "Build + film"]);
  });

  it("prices each tier in whole pounds, cheapest first", () => {
    const prices = courseBuild.tiers.map((t) => t.fromPrice);
    for (const p of prices) expect(Number.isInteger(p) && p > 0).toBe(true);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });

  it("keeps any share override between 0 and the usual share", () => {
    for (const t of courseBuild.tiers) {
      if (t.defaultSharePct === undefined) continue;
      expect(t.defaultSharePct).toBeGreaterThanOrEqual(0);
      expect(t.defaultSharePct).toBeLessThanOrEqual(educatorMembership.defaultSharePct);
    }
  });

  it("uses the tier's share when it has one, and the educator's rate otherwise", () => {
    expect(buildSharePct("tailor", 70)).toBe(70);
    expect(buildSharePct("build", 70)).toBe(buildTierById("build")?.defaultSharePct ?? 70);
    expect(buildSharePct(null, 65)).toBe(65);
    expect(buildSharePct("unknown", 65)).toBe(65);
  });
});
