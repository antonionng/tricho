import { describe, expect, it } from "vitest";
import { absoluteUrl, esc, renderEmail } from "../layout";
import { samples as directory } from "./directory";
import { samples as billing } from "./billing";

const all = [...directory, ...billing];

describe("directory and billing emails", () => {
  it("have unique ids", () => {
    const ids = all.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(all.map((s) => [s.id, s] as const))("%s renders", (_id, s) => {
    const { html, text } = renderEmail(s.content);
    expect(html).toContain(esc(s.content.heading));
    expect(text).toContain(s.content.heading);
    if (s.content.cta) expect(text).toContain(absoluteUrl(s.content.cta.href));
  });

  it.each(all.map((s) => [s.id, s] as const))("%s has no em dash in its subject or heading", (_id, s) => {
    expect(s.subject).not.toMatch(/—/);
    expect(s.content.heading).not.toMatch(/—/);
    expect(s.content.body).not.toMatch(/—/);
  });

  it("headings are full sentences", () => {
    for (const s of all) expect(s.content.heading.trim()).toMatch(/[.?]$/);
  });
});
