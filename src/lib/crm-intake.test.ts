import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const { cleanWebsite, mergeIntake, nextStage, websiteHost } = await import("./crm-intake");

describe("nextStage", () => {
  it("only moves forward through the pipeline", () => {
    expect(nextStage("lead", "customer")).toBe("customer");
    expect(nextStage("proposal", "won")).toBe("won");
    expect(nextStage("customer", "lead")).toBe("customer");
    expect(nextStage("won", "contacted")).toBe("won");
  });

  it("keeps the current stage when no stage is offered", () => {
    expect(nextStage("proposal", null)).toBe("proposal");
    expect(nextStage(null, null)).toBe("lead");
  });

  it("applies lost and churned only when asked for", () => {
    expect(nextStage("customer", "churned")).toBe("churned");
    expect(nextStage("proposal", "lost")).toBe("lost");
  });

  it("lets a lost or churned business come back into the pipeline", () => {
    expect(nextStage("churned", "customer")).toBe("customer");
    expect(nextStage("lost", "lead")).toBe("lead");
  });
});

describe("websiteHost", () => {
  it("reduces a link to its host", () => {
    expect(websiteHost("https://www.Example.co.uk/shop?x=1")).toBe("example.co.uk");
    expect(websiteHost("example.com")).toBe("example.com");
  });

  it("ignores links that can't identify a business", () => {
    expect(websiteHost("https://instagram.com/brand")).toBeNull();
    expect(websiteHost("not a website")).toBeNull();
    expect(websiteHost("")).toBeNull();
  });

  it("stores only http and https websites", () => {
    expect(cleanWebsite("example.com")).toBe("https://example.com/");
    expect(cleanWebsite("javascript:alert(1)")).toBeNull();
  });
});

describe("mergeIntake", () => {
  const input = {
    name: "Scalp Co",
    category: "Scalp care",
    website: "scalpco.com",
    email: "Jo@ScalpCo.com",
    phone: "+44 20 7946 0000",
    address: { line1: "1 High Street", city: "London", postcode: "N1 1AA", country: "GB" },
    source: "business-checkout",
    interest: "business",
    stage: "customer" as const,
    accountEmail: "Jo@ScalpCo.com",
    intake: { brandName: "Scalp Co" },
  };

  it("creates a full record for a new business", () => {
    const data = mergeIntake(null, input);
    expect(data).toMatchObject({
      name: "Scalp Co",
      kind: "brand",
      category: "Scalp care",
      website: "https://scalpco.com/",
      email: "jo@scalpco.com",
      accountEmail: "jo@scalpco.com",
      addressLine1: "1 High Street",
      postcode: "N1 1AA",
      stage: "customer",
      source: "business-checkout",
      intake: { brandName: "Scalp Co" },
    });
  });

  it("never overwrites what the team has already filled in", () => {
    const data = mergeIntake(
      {
        name: "Scalp Company Ltd",
        category: "Haircare",
        website: "https://scalpco.com/",
        email: "hello@scalpco.com",
        phone: null,
        stage: "proposal",
        source: "application",
        intake: { application: true },
      },
      input
    );
    expect(data.name).toBeUndefined();
    expect(data.category).toBeUndefined();
    expect(data.email).toBeUndefined();
    expect(data.source).toBeUndefined();
    expect(data.intake).toBeUndefined();
    expect(data.phone).toBe("+44 20 7946 0000");
    expect(data.stage).toBe("customer");
  });

  it("leaves the stage alone when it would move backwards", () => {
    const data = mergeIntake({ name: "Scalp Co", stage: "customer" }, { name: "Scalp Co", source: "enquiry", stage: "lead" });
    expect(data.stage).toBeUndefined();
  });

  it("drops an unknown kind and falls back to a brand for new records", () => {
    expect(mergeIntake(null, { name: "X", kind: "spaceship", source: "enquiry" }).kind).toBe("brand");
    expect(mergeIntake({ name: "X" }, { name: "X", kind: "spaceship", source: "enquiry" }).kind).toBeUndefined();
    expect(mergeIntake(null, { name: "X", kind: "clinic", source: "enquiry" }).kind).toBe("clinic");
  });
});
