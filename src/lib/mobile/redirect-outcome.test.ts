import { describe, expect, it } from "vitest";
import { redirectOutcome } from "./redirect-outcome";

const ERRORS = { name: "Please add your name, at least two letters." };

describe("redirectOutcome", () => {
  it("turns an error code into the page's message", () => {
    expect(redirectOutcome("/members/profile?error=name#about", ERRORS)).toEqual({
      error: ERRORS.name,
      code: "name",
      params: { error: "name" },
    });
  });

  it("uses the action's own message when the page shows it", () => {
    const out = redirectOutcome("/members/profile?error=cover&message=Too%20large#cover", ERRORS);
    expect(out.error).toBe("Too large");
  });

  it("falls back to a general message for an unknown code", () => {
    expect(redirectOutcome("/x?error=zzz", ERRORS).error).toBe("Something went wrong. Please try again.");
  });

  it("reports success and the params for any other redirect", () => {
    expect(redirectOutcome("/members/onboarding?step=3", ERRORS)).toEqual({ error: null, code: null, params: { step: "3" } });
  });
});
