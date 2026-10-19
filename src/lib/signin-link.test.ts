import { describe, expect, it } from "vitest";
import { confirmLinkFor, safeCallbackLink } from "./signin-link";

const hosts = ["www.trichollective.net"];
const callback = "https://www.trichollective.net/api/auth/callback/resend?callbackUrl=%2Fmembers&token=abc123&email=a%40b.com";

describe("confirmLinkFor", () => {
  it("points at the confirm page on the same host and round-trips the link", () => {
    const confirm = new URL(confirmLinkFor(callback));
    expect(confirm.host).toBe("www.trichollective.net");
    expect(confirm.pathname).toBe("/login/confirm");
    expect(confirm.searchParams.get("link")).toBe(callback);
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
