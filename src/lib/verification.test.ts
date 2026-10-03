import { describe, expect, it } from "vitest";
import {
  canApply,
  isVerificationKind,
  statusSentence,
  statusSummary,
  verificationKindLabel,
  VERIFICATION_KINDS,
  type RequestLike,
} from "./verification";

const day = (n: number) => new Date(Date.UTC(2026, 9, n));

describe("verification kinds", () => {
  it("have unique ids matching the schema", () => {
    expect(VERIFICATION_KINDS.map((k) => k.id)).toEqual(["training", "registration", "membership", "insurance", "other"]);
  });

  it("describe each kind in a full sentence", () => {
    for (const k of VERIFICATION_KINDS) {
      expect(k.description).toMatch(/^[A-Z].*\.$/);
      expect(k.description).not.toContain("!");
    }
  });

  it("recognise valid kinds and label unknown ones", () => {
    expect(isVerificationKind("training")).toBe(true);
    expect(isVerificationKind("passport")).toBe(false);
    expect(verificationKindLabel("membership")).toBe("Membership of a professional body");
    expect(verificationKindLabel("nope")).toBe("Document");
  });
});

describe("canApply", () => {
  it("lets paid professional members apply", () => {
    expect(canApply({ professional: true, hasListing: false })).toBe(true);
  });
  it("lets practitioners with a free listing apply", () => {
    expect(canApply({ professional: false, hasListing: true })).toBe(true);
  });
  it("keeps Community-only members out", () => {
    expect(canApply({ professional: false, hasListing: false })).toBe(false);
  });
  it("keeps suspended or banned members out", () => {
    expect(canApply({ professional: true, hasListing: true, blocked: true })).toBe(false);
  });
});

describe("statusSummary", () => {
  const pending: RequestLike = { status: "pending", createdAt: day(5) };
  const rejected: RequestLike = { status: "rejected", createdAt: day(1), reviewedAt: day(3), reviewNote: "  The name is unreadable. " };
  const approved: RequestLike = { status: "approved", createdAt: day(2), reviewedAt: day(4) };

  it("is none with no requests", () => {
    expect(statusSummary([], false)).toEqual({ state: "none", pending: 0 });
  });

  it("is verified whenever the badge is on, counting anything still waiting", () => {
    expect(statusSummary([pending, rejected], true)).toEqual({ state: "verified", pending: 1 });
  });

  it("is pending when something is waiting and the badge is off", () => {
    expect(statusSummary([rejected, pending, pending], false)).toEqual({ state: "pending", pending: 2 });
  });

  it("gives the team's reason after a rejection", () => {
    expect(statusSummary([rejected], false)).toEqual({ state: "rejected", pending: 0, reason: "The name is unreadable." });
  });

  it("uses the most recent decision", () => {
    expect(statusSummary([rejected, approved], false).state).toBe("removed");
    const later: RequestLike = { ...rejected, reviewedAt: day(9) };
    expect(statusSummary([approved, later], false).state).toBe("rejected");
  });

  it("has a full sentence for every state", () => {
    for (const s of [
      statusSummary([], false),
      statusSummary([pending], false),
      statusSummary([pending, pending], false),
      statusSummary([rejected], false),
      statusSummary([approved], false),
      statusSummary([], true),
    ]) {
      expect(statusSentence(s)).toMatch(/^[A-Z].*\.$/);
    }
  });
});
