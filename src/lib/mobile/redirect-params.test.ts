import { describe, expect, it } from "vitest";
import { idAfter, outcomeFromRedirect, redirectParams } from "./redirect-outcome";

const messages = {
  saved: { seat: "Your team member is added." },
  error: (code: string, message?: string) => (code === "cap" && message ? message : code === "seat-full" ? "All seats are in use." : null),
};

describe("outcomeFromRedirect", () => {
  it("turns ?saved= into the saved sentence", () => {
    expect(outcomeFromRedirect("/members/business?saved=seat", messages)).toEqual({ ok: true, saved: "seat", message: "Your team member is added." });
  });
  it("turns ?error= into the error sentence", () => {
    expect(outcomeFromRedirect("/members/business?error=seat-full", messages)).toEqual({ ok: false, error: "All seats are in use." });
  });
  it("uses the message carried with some error codes", () => {
    expect(outcomeFromRedirect("/members/business?error=cap&message=Two+premium+partners+already", messages)).toEqual({
      ok: false,
      error: "Two premium partners already",
    });
  });
  it("falls back to a general sentence for an unknown error", () => {
    expect(outcomeFromRedirect("/x?error=nope", messages)).toEqual({ ok: false, error: "Something went wrong. Please try again." });
  });
  it("treats a redirect without parameters as success without a message", () => {
    expect(outcomeFromRedirect("/members/business", messages)).toEqual({ ok: true, saved: null, message: null });
    expect(outcomeFromRedirect(null, messages)).toEqual({ ok: true, saved: null, message: null });
  });
  it("reads setup redirects that carry a step as well", () => {
    expect(redirectParams("/members/business/setup?step=team&saved=seat").get("saved")).toBe("seat");
  });
});

describe("idAfter", () => {
  it("finds the id after a prefix and ignores the query", () => {
    expect(idAfter("/members/referrals/abc123?sent=1", "/members/referrals/")).toBe("abc123");
    expect(idAfter("/members/messages/c_9", "/members/messages/")).toBe("c_9");
  });
  it("returns null for another path", () => {
    expect(idAfter("/members/referrals", "/members/referrals/")).toBeNull();
    expect(idAfter("/login?next=/x", "/members/referrals/")).toBeNull();
    expect(idAfter(null, "/members/referrals/")).toBeNull();
  });
});
