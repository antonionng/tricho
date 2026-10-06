import { describe, expect, it } from "vitest";
import { JOB_DAYS, jobExpiry, jobParagraphs, jobPhase, parseJobForm } from "./jobs";

const valid: Record<string, string> = {
  title: "Senior trichologist",
  employment: "full_time",
  workplace: "on_site",
  location: "Dublin 2",
  country: "Ireland",
  pay: "€40,000 to €48,000 a year",
  summary: "Lead consultations for shedding and scalp conditions in a busy city clinic.",
  description:
    "You will run new and follow-up consultations, use trichoscopy to track progress and work with GPs when bloods are needed.\n\nWe offer CPD support and four days a week.",
  applyUrl: "",
  applyEmail: "Jobs@Clinic.ie",
};
const form = (overrides: Record<string, string> = {}) => (key: string) => ({ ...valid, ...overrides })[key] ?? "";

describe("parseJobForm", () => {
  it("accepts a complete role and tidies the email", () => {
    const r = parseJobForm(form());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.applyEmail).toBe("jobs@clinic.ie");
      expect(r.value.applyUrl).toBeNull();
    }
  });

  it("needs a way to apply", () => {
    const r = parseJobForm(form({ applyEmail: "" }));
    expect(r).toEqual({ ok: false, error: expect.stringContaining("where candidates can apply") });
  });

  it("adds https to a bare link and refuses other schemes", () => {
    const ok = parseJobForm(form({ applyEmail: "", applyUrl: "clinic.ie/careers" }));
    expect(ok.ok && ok.value.applyUrl).toBe("https://clinic.ie/careers");
    const bad = parseJobForm(form({ applyUrl: "javascript:alert(1)" }));
    expect(bad.ok).toBe(false);
  });

  it("rejects unknown role types and very short descriptions", () => {
    expect(parseJobForm(form({ employment: "astronaut" })).ok).toBe(false);
    expect(parseJobForm(form({ description: "Come and work here." })).ok).toBe(false);
  });
});

describe("job helpers", () => {
  it("closes a role after the set number of days", () => {
    const from = new Date("2026-10-05T09:00:00Z");
    expect(jobExpiry(from).getTime() - from.getTime()).toBe(JOB_DAYS * 86_400_000);
  });

  it("splits a description into paragraphs", () => {
    expect(jobParagraphs("One.\n\n  Two.\n \nThree.")).toEqual(["One.", "Two.", "Three."]);
  });
});

describe("jobPhase", () => {
  const now = new Date("2026-10-06T12:00:00Z");
  const later = new Date("2026-11-01T00:00:00Z");
  const earlier = new Date("2026-10-01T00:00:00Z");
  it("is live while open and in date", () => {
    expect(jobPhase({ status: "open", hiddenAt: null, expiresAt: later }, now)).toBe("live");
  });
  it("has ended once the date passes", () => {
    expect(jobPhase({ status: "open", hiddenAt: null, expiresAt: earlier }, now)).toBe("ended");
  });
  it("is closed when the business closed it", () => {
    expect(jobPhase({ status: "closed", hiddenAt: null, expiresAt: later }, now)).toBe("closed");
  });
  it("puts a role taken down by the team before everything else", () => {
    expect(jobPhase({ status: "closed", hiddenAt: earlier, expiresAt: earlier }, now)).toBe("hidden");
  });
});
