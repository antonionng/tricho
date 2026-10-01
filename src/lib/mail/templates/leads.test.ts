import { describe, expect, it } from "vitest";
import { absoluteUrl, esc, renderEmail } from "../layout";
import { samples, subscribeEmail } from "./leads";

describe("lead and sign-in emails", () => {
  it.each(samples.map((s) => [s.id, s] as const))("%s renders", (_id, s) => {
    const { html, text } = renderEmail(s.content);
    expect(html).toContain(esc(s.content.heading));
    if (s.content.cta) expect(text).toContain(absoluteUrl(s.content.cta.href));
  });

  it("has no em dashes in subjects or headings", () => {
    for (const s of samples) {
      expect(s.subject).not.toContain("—");
      expect(s.content.heading).not.toContain("—");
    }
  });

  it("has unique sample ids", () => {
    expect(new Set(samples.map((s) => s.id)).size).toBe(samples.length);
  });

  it("picks the confirmation that fits the sign-up source", () => {
    expect(subscribeEmail("starter-guide").subject).toMatch(/starter guide/i);
    expect(subscribeEmail("course:abc", () => "Scalp basics").content.heading).toContain("Scalp basics");
    expect(subscribeEmail("course:missing", () => undefined).subject).toMatch(/newsletter/i);
    expect(subscribeEmail("dublin").content.cta?.href).toBe("/founding");
    expect(subscribeEmail("footer").subject).toMatch(/newsletter/i);
  });
});
