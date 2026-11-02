import { describe, expect, it } from "vitest";
import {
  allowedHostsFor,
  authCallbackHref,
  cleanToken,
  confirmLinkFor,
  generateSignInCode,
  hostAliases,
  resolveSignInFromSearch,
  safeCallbackLink,
  safeReturnPath,
} from "./signin-link";

const hosts = ["www.trichollective.net"];
const callback =
  "https://www.trichollective.net/api/auth/callback/resend?callbackUrl=%2Fmembers&token=482917&email=a%40b.com";

describe("confirmLinkFor", () => {
  it("puts token, email and return path on the confirm page, not a nested callback URL", () => {
    const confirm = new URL(confirmLinkFor(callback));
    expect(confirm.host).toBe("www.trichollective.net");
    expect(confirm.pathname).toBe("/login/confirm");
    expect(confirm.searchParams.get("token")).toBe("482917");
    expect(confirm.searchParams.get("email")).toBe("a@b.com");
    expect(confirm.searchParams.get("callbackUrl")).toBe("/members");
    expect(confirm.searchParams.get("link")).toBeNull();
    expect(confirm.toString().length).toBeLessThan(180);
  });
});

describe("resolveSignInFromSearch", () => {
  it("accepts first-class token and email", () => {
    expect(resolveSignInFromSearch({ token: "482917", email: "A@B.com", callbackUrl: "/members" }, hosts)).toEqual({
      token: "482917",
      email: "a@b.com",
      callbackUrl: "/members",
    });
  });

  it("accepts a legacy nested Auth.js callback on our host", () => {
    expect(resolveSignInFromSearch({ link: callback }, hosts)).toEqual({
      token: "482917",
      email: "a@b.com",
      callbackUrl: "/members",
    });
  });

  it("reassembles a nested link after an email client decodes it once", () => {
    // iOS Mail / Gmail turn %26token= into a sibling &token= of /login/confirm.
    const split = "https://www.trichollective.net/api/auth/callback/resend?callbackUrl=%2Fmembers";
    expect(
      resolveSignInFromSearch({ link: split, token: "482917", email: "a@b.com" }, hosts),
    ).toEqual({
      token: "482917",
      email: "a@b.com",
      callbackUrl: "/members",
    });
  });

  it("accepts the apex host when the member landed on www", () => {
    const apex = callback.replaceAll("www.trichollective.net", "trichollective.net");
    expect(resolveSignInFromSearch({ link: apex }, ["www.trichollective.net", "trichollective.net"])).toMatchObject({
      token: "482917",
      email: "a@b.com",
    });
  });

  it("refuses other hosts and missing pieces", () => {
    expect(resolveSignInFromSearch({ link: callback.replace("www.trichollective.net", "evil.example") }, hosts)).toBeNull();
    expect(resolveSignInFromSearch({ link: "https://www.trichollective.net/members?token=x" }, hosts)).toBeNull();
    expect(resolveSignInFromSearch({ token: "482917" }, hosts)).toBeNull();
    expect(resolveSignInFromSearch({ email: "a@b.com" }, hosts)).toBeNull();
    expect(resolveSignInFromSearch({}, hosts)).toBeNull();
  });

  it("refuses a return path that would leave the site", () => {
    expect(resolveSignInFromSearch({ token: "482917", email: "a@b.com", callbackUrl: "https://evil.example" }, hosts)?.callbackUrl).toBe(
      "/members",
    );
    expect(resolveSignInFromSearch({ token: "482917", email: "a@b.com", callbackUrl: "//evil.example" }, hosts)?.callbackUrl).toBe(
      "/members",
    );
  });
});

describe("safeCallbackLink", () => {
  it("accepts an Auth.js email callback on our own host", () => {
    expect(safeCallbackLink(callback, hosts)).toBe(callback);
  });

  it("refuses other hosts, other paths, missing tokens and junk", () => {
    expect(safeCallbackLink(callback.replace("www.trichollective.net", "evil.example"), hosts)).toBeNull();
    expect(safeCallbackLink("https://www.trichollective.net/members?token=x", hosts)).toBeNull();
    expect(safeCallbackLink("https://www.trichollective.net/api/auth/callback/resend", hosts)).toBeNull();
    expect(safeCallbackLink(callback.replace("https:", "http:"), hosts)).toBeNull();
    expect(safeCallbackLink("javascript:alert(1)", hosts)).toBeNull();
    expect(safeCallbackLink(undefined, hosts)).toBeNull();
  });
});

describe("host aliases and helpers", () => {
  it("treats www and the bare domain as the same site", () => {
    expect(hostAliases("www.trichollective.net")).toEqual(["www.trichollective.net", "trichollective.net"]);
    expect(hostAliases("trichollective.net")).toEqual(["trichollective.net", "www.trichollective.net"]);
    expect(hostAliases("localhost:3000")).toEqual(["localhost:3000"]);
  });

  it("includes the request host and hosts from AUTH_URL", () => {
    expect(allowedHostsFor("www.trichollective.net", ["https://trichollective.net"])).toEqual(
      expect.arrayContaining(["www.trichollective.net", "trichollective.net"]),
    );
  });

  it("builds a relative Auth.js callback so cookies stay on this host", () => {
    expect(
      authCallbackHref({ token: "482917", email: "a@b.com", callbackUrl: "/members" }),
    ).toBe("/api/auth/callback/resend?callbackUrl=%2Fmembers&token=482917&email=a%40b.com");
  });

  it("cleans typed codes and keeps older long tokens", () => {
    expect(cleanToken(" 482 917 ")).toBe("482917");
    expect(cleanToken("c7a3f2e1b0")).toBe("c7a3f2e1b0");
    expect(cleanToken("12")).toBeNull();
    expect(safeReturnPath("/members/profile")).toBe("/members/profile");
    expect(safeReturnPath("https://evil.example")).toBe("/members");
  });

  it("generates a six-digit sign-in code", () => {
    const code = generateSignInCode();
    expect(code).toMatch(/^[1-9]\d{5}$/);
  });
});
