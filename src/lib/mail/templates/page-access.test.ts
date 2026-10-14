import { describe, expect, it } from "vitest";
import { pageAccessEmail, type PageAccessFacts } from "./page-access";

const base: PageAccessFacts = {
  pageName: "The Hair & Skin Clinic MK",
  kind: "gifted",
  email: "contact@clinic.example",
  pagePath: "/partners/the-hair-and-skin-clinic-mk",
  published: true,
  photos: 5,
  photoLimit: 16,
  video: true,
};

const text = (e: ReturnType<typeof pageAccessEmail>) => [e.subject, e.content.heading, e.content.preheader, e.content.body].join(" ");

describe("pageAccessEmail", () => {
  it("never calls a gifted page a partnership or sponsorship", () => {
    expect(text(pageAccessEmail(base))).not.toMatch(/partner|sponsor/i);
  });

  it("tells a charity the page is free and will stay free", () => {
    const t = text(pageAccessEmail({ ...base, kind: "charity", pageName: "Little Lady Locks" }));
    expect(t).toContain("free");
    expect(t).not.toMatch(/sponsor|paying/i);
  });

  it("explains how to sign in with the linked address, with no password", () => {
    const e = pageAccessEmail(base);
    expect(e.content.body).toContain("contact@clinic.example");
    expect(e.content.body).toMatch(/no password/);
    expect(e.content.cta?.href).toBe("/login?next=/members/business/setup");
  });

  it("only mentions a video when the package includes one", () => {
    expect(pageAccessEmail({ ...base, video: false, photoLimit: 8 }).content.body).not.toMatch(/video/i);
    expect(pageAccessEmail({ ...base, video: false, photoLimit: 8 }).content.body).toContain("up to 8 photos");
  });

  it("says a hidden page stays hidden until it is published", () => {
    const e = pageAccessEmail({ ...base, published: false });
    expect(e.content.body).toMatch(/stays hidden/);
    expect(e.content.secondary).toBeUndefined();
  });
});
