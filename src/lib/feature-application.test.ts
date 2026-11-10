import { describe, expect, it } from "vitest";
import { parseFeatureApplication } from "./feature-application";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const valid = {
  name: " Aoife Brennan ",
  email: "Aoife@Example.com",
  share: "I would like to show how I explain a first scalp check to a client who has never had one.",
  format: "podcast",
  role: "host",
  place: " Galway ",
};

describe("parseFeatureApplication", () => {
  it("accepts a complete application and tidies the fields", () => {
    const parsed = parseFeatureApplication(form(valid));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok || !("application" in parsed)) return;
    expect(parsed.application).toMatchObject({
      name: "Aoife Brennan",
      email: "aoife@example.com",
      format: "podcast",
      formatLabel: "The podcast",
      role: "host",
      roleLabel: "I'd like to lead the feature",
      place: "Galway",
    });
  });

  it("allows the place to be left empty", () => {
    const parsed = parseFeatureApplication(form({ ...valid, place: "  " }));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok || !("application" in parsed)) return;
    expect(parsed.application.place).toBe("");
  });

  it("ignores a submission that fills the honeypot", () => {
    const parsed = parseFeatureApplication(form({ ...valid, company_site: "https://spam.example" }));
    expect(parsed).toEqual({ ok: true, ignored: true });
  });

  it("asks for a name, a real email, a format and a role", () => {
    expect(parseFeatureApplication(form({ ...valid, name: "A" })).ok).toBe(false);
    expect(parseFeatureApplication(form({ ...valid, email: "not-an-email" })).ok).toBe(false);
    expect(parseFeatureApplication(form({ ...valid, share: "Too short" })).ok).toBe(false);
    expect(parseFeatureApplication(form({ ...valid, format: "radio" })).ok).toBe(false);
    expect(parseFeatureApplication(form({ ...valid, role: "both" })).ok).toBe(false);
  });

  it("keeps what was typed when a field needs another look", () => {
    const parsed = parseFeatureApplication(form({ ...valid, format: "" }));
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.message).toMatch(/podcast/i);
    expect(parsed.fields.name).toBe("Aoife Brennan");
    expect(parsed.fields.email).toBe("aoife@example.com");
  });
});
