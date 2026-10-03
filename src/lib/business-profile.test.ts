import { describe, expect, it } from "vitest";
import { nextSetupStep, readyToPublish, setupProgress, socialLinks, socialUrl, stepAfter } from "./business-profile";

const page = {
  name: "Scalp Co",
  category: "Scalp care",
  blurb: "Professional scalp treatments sold through salons and clinics.",
  logoUrl: null,
  perk: null,
  contactEmail: null,
  published: false,
};

describe("business setup progress", () => {
  it("starts with brand details when there is no page yet", () => {
    const progress = setupProgress({ page: null, org: null, seats: 0 });
    expect(Object.values(progress).every((done) => !done)).toBe(true);
    expect(nextSetupStep(progress)).toBe("details");
  });

  it("resumes at the first step that isn't done", () => {
    const progress = setupProgress({ page, org: null, seats: 0 });
    expect(progress.details).toBe(true);
    expect(nextSetupStep(progress)).toBe("logo");
  });

  it("counts the address only when it is complete enough for an invoice", () => {
    const org = { phone: null, socials: null, addressLine1: "1 High St", postcode: null, country: "GB" };
    expect(setupProgress({ page, org, seats: 0 }).address).toBe(false);
    expect(setupProgress({ page, org: { ...org, postcode: "N1 1AA" }, seats: 0 }).address).toBe(true);
  });

  it("counts socials as contact details", () => {
    const org = { phone: null, socials: { instagram: "scalpco" }, addressLine1: null, postcode: null, country: null };
    expect(setupProgress({ page, org, seats: 0 }).contact).toBe(true);
  });

  it("needs a name, category and real description before publishing", () => {
    expect(readyToPublish(page)).toBe(true);
    expect(readyToPublish({ ...page, blurb: "Short" })).toBe(false);
    expect(readyToPublish(null)).toBe(false);
  });

  it("moves through the steps in order and stops at the preview", () => {
    expect(stepAfter("details")).toBe("logo");
    expect(stepAfter("team")).toBe("publish");
    expect(stepAfter("publish")).toBe("publish");
  });
});

describe("social links", () => {
  it("turns handles and links into safe links on the right network", () => {
    expect(socialUrl("instagram", "@scalpco")).toBe("https://www.instagram.com/scalpco");
    expect(socialUrl("tiktok", "scalpco")).toBe("https://www.tiktok.com/@scalpco");
    expect(socialUrl("linkedin", "linkedin.com/company/scalp-co")).toBe("https://linkedin.com/company/scalp-co");
    expect(socialUrl("instagram", "http://www.instagram.com/scalpco")).toBe("https://www.instagram.com/scalpco");
  });

  it("refuses links to other sites and unsafe schemes", () => {
    expect(socialUrl("instagram", "https://evil.example/instagram.com")).toBeNull();
    expect(socialUrl("facebook", "javascript:alert(1)")).toBeNull();
    expect(socialUrl("youtube", "")).toBeNull();
  });

  it("lists saved socials in a fixed order and skips bad values", () => {
    expect(socialLinks({ youtube: "@scalpco", instagram: "scalpco", facebook: "https://evil.example" }).map((l) => l.id)).toEqual([
      "instagram",
      "youtube",
    ]);
    expect(socialLinks(null)).toEqual([]);
  });
});
