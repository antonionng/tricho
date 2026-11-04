import { describe, expect, it } from "vitest";
import { cleanFullName, cleanPhone, signupDetailsFromForm } from "./signup-details";

describe("cleanFullName", () => {
  it("keeps a first name and surname, tidied", () => {
    expect(cleanFullName("  Anneliese   Hesse ")).toBe("Anneliese Hesse");
    expect(cleanFullName("Dr Sample O'Neill")).toBe("Dr Sample O'Neill");
    expect(cleanFullName("Siobhán Ní Bhriain")).toBe("Siobhán Ní Bhriain");
  });

  it("refuses a single name, an empty value or no letters", () => {
    expect(cleanFullName("Anneliese")).toBeNull();
    expect(cleanFullName("   ")).toBeNull();
    expect(cleanFullName("12 34")).toBeNull();
    expect(cleanFullName(null)).toBeNull();
  });
});

describe("cleanPhone", () => {
  it("is optional", () => {
    expect(cleanPhone("")).toBe("");
    expect(cleanPhone("  ")).toBe("");
    expect(cleanPhone(null)).toBe("");
  });

  it("keeps UK, Irish and international numbers as typed", () => {
    expect(cleanPhone("07700 900123")).toBe("07700 900123");
    expect(cleanPhone("+353 (0)87 123 4567")).toBe("+353 (0)87 123 4567");
    expect(cleanPhone("+44-20-7946-0958")).toBe("+44-20-7946-0958");
  });

  it("refuses letters and numbers too short or long", () => {
    expect(cleanPhone("call me")).toBeNull();
    expect(cleanPhone("12345")).toBeNull();
    expect(cleanPhone("1234567890123456")).toBeNull();
  });
});

describe("signupDetailsFromForm", () => {
  const form = (v: Record<string, string>) => {
    const f = new FormData();
    for (const [k, val] of Object.entries(v)) f.set(k, val);
    return f;
  };
  const full = { name: "Niamh Walsh", profession: "clinical", city: "Galway", country: "Ireland" };

  it("needs a full name, discipline, town and country", () => {
    expect(signupDetailsFromForm(form(full)).ok).toBe(true);
    expect(signupDetailsFromForm(form({ ...full, name: "Niamh" })).ok).toBe(false);
    expect(signupDetailsFromForm(form({ ...full, profession: "wizard" })).ok).toBe(false);
    expect(signupDetailsFromForm(form({ ...full, city: " " })).ok).toBe(false);
  });

  it("keeps optional answers and drops unknown ones", () => {
    const r = signupDetailsFromForm(form({ ...full, practiceName: " Walsh  Clinic ", heardFrom: "made-up", phone: "087 123 4567" }));
    expect(r).toMatchObject({ ok: true, details: { practiceName: "Walsh Clinic", heardFrom: "", phone: "087 123 4567" } });
  });
});
