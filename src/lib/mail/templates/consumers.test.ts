import { describe, expect, it } from "vitest";
import { consumerDigestBody, consumerDigestEmail, enquiryUpdateEmail, samples } from "./consumers";

describe("enquiryUpdateEmail", () => {
  it("tells them a held message has reached the professional", () => {
    const e = enquiryUpdateEmail({ name: "Aoife Byrne", professional: "Niamh Walsh", update: "delivered" });
    expect(e.subject).toBe("Your message has reached Niamh Walsh");
    expect(e.content.body).toContain("Hello Aoife,");
    expect(e.content.reason).toContain("turn these emails off");
  });

  it("explains a closed enquiry and offers the directory", () => {
    const e = enquiryUpdateEmail({ name: null, professional: "Niamh Walsh", update: "closed" });
    expect(e.subject).toContain("closed");
    expect(e.content.cta?.href).toBe("/directory");
  });
});

describe("the hub digest", () => {
  const items = [{ kind: "guide" as const, title: "Shedding", summary: "Why it happens.", href: "/guides/shedding", date: "2026-10-20" }];

  it("lists only what it is given, with full links, and points to a GP", () => {
    const body = consumerDigestBody(items, "October 2026");
    expect(body).toContain("Guide: Shedding. Why it happens.");
    expect(body).toMatch(/https?:\/\/\S+\/guides\/shedding/);
    expect(body).toContain("GP or pharmacist");
  });

  it("says plainly when there is nothing new", () => {
    expect(consumerDigestBody([], "October 2026")).toContain("nothing new to read");
  });

  it("uses an edited subject line from the draft", () => {
    expect(consumerDigestEmail({ title: "T", body: "B" }, { subject: "Edited" }).subject).toBe("Edited");
    expect(consumerDigestEmail({ title: "T", body: "B" }, {}).subject).toBe("T");
  });

  it("never links into the professional area", () => {
    expect(JSON.stringify(samples)).not.toContain("/members");
  });
});
