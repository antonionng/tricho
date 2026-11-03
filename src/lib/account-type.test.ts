import { describe, expect, it } from "vitest";
import { areaRedirect, isConsumer, isHubArea, isProfessionalArea, PROFESSIONAL_ACCOUNTS } from "./account-type";
import { authConfig } from "@/auth.config";

describe("areaRedirect", () => {
  it("sends consumers from the member area and /pro to the hub", () => {
    expect(areaRedirect("/members", "consumer")).toBe("/hub");
    expect(areaRedirect("/members/community/abc", "consumer")).toBe("/hub");
    expect(areaRedirect("/pro", "consumer")).toBe("/hub");
    expect(areaRedirect("/pro/anything", "consumer")).toBe("/hub");
  });

  it("sends professionals from the hub to the member area", () => {
    expect(areaRedirect("/hub", "professional")).toBe("/members");
    expect(areaRedirect("/hub/saved", "professional")).toBe("/members");
    // An old token without an account type is a professional.
    expect(areaRedirect("/hub", undefined)).toBe("/members");
  });

  it("leaves everyone alone on their own area and the public site", () => {
    expect(areaRedirect("/hub/profile", "consumer")).toBeNull();
    expect(areaRedirect("/members/profile", "professional")).toBeNull();
    expect(areaRedirect("/directory", "consumer")).toBeNull();
    expect(areaRedirect("/directory", "professional")).toBeNull();
  });

  it("matches whole path segments only", () => {
    expect(isProfessionalArea("/membership")).toBe(false);
    expect(isProfessionalArea("/products")).toBe(false);
    expect(isHubArea("/hubspot")).toBe(false);
    expect(areaRedirect("/products", "consumer")).toBeNull();
  });
});

describe("isConsumer", () => {
  it("is true only for consumer accounts", () => {
    expect(isConsumer({ accountType: "consumer" })).toBe(true);
    expect(isConsumer({ accountType: "professional" })).toBe(false);
    expect(isConsumer({})).toBe(false);
    expect(isConsumer(null)).toBe(false);
  });

  it("filters Studio queries to professionals", () => {
    expect(PROFESSIONAL_ACCOUNTS).toEqual({ accountType: "professional" });
  });
});

describe("authorized() in the middleware", () => {
  const authorized = authConfig.callbacks.authorized;
  const run = (path: string, user: { accountType?: string } | null) =>
    authorized({ auth: user ? { user, expires: "" } : null, request: { nextUrl: new URL(`https://www.trichollective.net${path}`) } } as never);

  it("redirects a consumer away from /members", () => {
    const res = run("/members/community", { accountType: "consumer" });
    expect(res).toBeInstanceOf(Response);
    expect((res as Response).headers.get("location")).toBe("https://www.trichollective.net/hub");
  });

  it("redirects a professional away from /hub", () => {
    const res = run("/hub/saved", { accountType: "professional" });
    expect((res as Response).headers.get("location")).toBe("https://www.trichollective.net/members");
  });

  it("asks a signed-out visitor to sign in for either area", () => {
    expect(run("/hub", null)).toBe(false);
    expect(run("/members", null)).toBe(false);
    expect(run("/directory", null)).toBe(true);
  });

  it("lets each account into its own area", () => {
    expect(run("/hub", { accountType: "consumer" })).toBe(true);
    expect(run("/members", { accountType: "professional" })).toBe(true);
  });
});
