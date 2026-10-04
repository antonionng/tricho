import { describe, expect, it } from "vitest";
import { cleanEmail, isCheckoutSessionId } from "@/lib/signin-email";
import { cleanSource, sourceLabel } from "@/lib/source";

describe("sign-in email after checkout", () => {
  it("accepts only Stripe Checkout Session ids", () => {
    expect(isCheckoutSessionId("cs_test_a1B2c3D4e5F6g7H8")).toBe(true);
    expect(isCheckoutSessionId("cs_live_a1B2c3D4e5F6g7H8")).toBe(true);
    expect(isCheckoutSessionId("{CHECKOUT_SESSION_ID}")).toBe(false);
    expect(isCheckoutSessionId("pi_123")).toBe(false);
    expect(isCheckoutSessionId(undefined)).toBe(false);
  });

  it("keeps a plausible email, lowercased", () => {
    expect(cleanEmail("  Niamh@Example.com ")).toBe("niamh@example.com");
    expect(cleanEmail("not an email")).toBeNull();
    expect(cleanEmail(null)).toBeNull();
  });
});

describe("sources", () => {
  it("names the event source Trichollective Ireland, including the old dublin links", () => {
    expect(sourceLabel("ireland")).toBe("Trichollective Ireland");
    expect(sourceLabel("dublin")).toBe("Trichollective Ireland");
    expect(sourceLabel("email")).toBe("email");
    expect(sourceLabel(null)).toBeNull();
  });

  it("cleans a source to a short safe value", () => {
    expect(cleanSource("Ireland!")).toBe("ireland");
    expect(cleanSource("")).toBeNull();
  });
});
