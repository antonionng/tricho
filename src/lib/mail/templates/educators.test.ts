import { describe, expect, it } from "vitest";
import { absoluteUrl, esc, renderEmail } from "../layout";
import { courseBuildQuoteEmail, samples } from "./educators";

describe("educator emails", () => {
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

  it("states the fee with VAT and the educator's share in the quote", () => {
    const email = courseBuildQuoteEmail({ name: "Áine Byrne", title: "Scalp assessment", tierName: "Build", amountPence: 145000, note: null, sharePct: 60 });
    expect(email.content.facts).toContainEqual(["Fee", "£1,450.00, including VAT"]);
    expect(email.content.facts).toContainEqual(["Your share of each sale", "60%"]);
    expect(email.content.body).not.toContain("What the quote covers");
  });
});
