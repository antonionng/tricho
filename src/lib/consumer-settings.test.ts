import { describe, expect, it } from "vitest";
import { consumerExport, consumerSettingsFromForm } from "./consumer-settings";

const form = (v: Record<string, string | string[]>) => {
  const f = new FormData();
  for (const [k, val] of Object.entries(v)) for (const x of [val].flat()) f.append(k, x);
  return f;
};
const none = { marketingConsentAt: null, healthDataConsentAt: null };
const now = new Date("2026-11-03T12:00:00Z");

describe("consumerSettingsFromForm", () => {
  it("turns everything off when nothing is ticked", () => {
    expect(consumerSettingsFromForm(form({}), none, now)).toEqual({
      marketing: false,
      activity: false,
      marketingConsentAt: null,
      healthDataConsentAt: null,
      concerns: [],
      region: null,
      country: null,
    });
  });

  it("keeps concerns only with health-data consent, and only known categories", () => {
    const without = consumerSettingsFromForm(form({ concerns: ["shedding", "thinning"] }), none, now);
    expect(without.concerns).toEqual([]);
    expect(without.healthDataConsentAt).toBeNull();

    const withConsent = consumerSettingsFromForm(form({ healthConsent: "on", concerns: ["shedding", "made-up", "shedding", "my scalp bleeds"] }), none, now);
    expect(withConsent.concerns).toEqual(["shedding"]);
    expect(withConsent.healthDataConsentAt).toEqual(now);
  });

  it("clears concerns when consent is withdrawn", () => {
    const r = consumerSettingsFromForm(form({ concerns: ["shedding"] }), { marketingConsentAt: null, healthDataConsentAt: new Date("2026-01-01") }, now);
    expect(r).toMatchObject({ healthDataConsentAt: null, concerns: [] });
  });

  it("keeps the original consent date while consent stays given", () => {
    const first = new Date("2026-01-01");
    const r = consumerSettingsFromForm(form({ marketing: "on", healthConsent: "on" }), { marketingConsentAt: first, healthDataConsentAt: first }, now);
    expect(r.marketingConsentAt).toBe(first);
    expect(r.healthDataConsentAt).toBe(first);
  });

  it("tidies the place", () => {
    expect(consumerSettingsFromForm(form({ region: "  Cork   city ", country: " " }), none, now)).toMatchObject({ region: "Cork city", country: null });
  });
});

describe("consumerExport", () => {
  it("includes everything we hold, in plain words", () => {
    const d = new Date("2026-11-01T00:00:00Z");
    const out = consumerExport({
      user: { name: "Aoife", email: "a@example.com", createdAt: d, emailUpdates: false, emailActivity: true },
      profile: { displayMode: "alias", alias: "Willow-428", region: null, country: "Ireland", concerns: ["scalp"], marketingConsentAt: null, healthDataConsentAt: d, createdAt: d },
      saved: [{ createdAt: d, listing: { name: "Walsh Clinic", slug: "walsh-clinic" } }],
      enquiries: [{ createdAt: d, status: "new", message: "Hello", listing: { name: "Walsh Clinic" } }],
    });
    expect(out.account).toMatchObject({ name: "Aoife", email: "a@example.com", emails: { newsAndUpdates: false, aboutYourEnquiries: true } });
    expect(out.profile).toMatchObject({ shownToOthersAs: "alias", alias: "Willow-428", concerns: ["scalp"], healthDataConsentAt: d.toISOString() });
    expect(out.savedProfessionals).toEqual([{ name: "Walsh Clinic", slug: "walsh-clinic", savedAt: d.toISOString() }]);
    expect(out.enquiries[0]).toMatchObject({ to: "Walsh Clinic", status: "new", message: "Hello" });
  });
});
