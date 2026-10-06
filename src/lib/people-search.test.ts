import { describe, expect, it } from "vitest";
import { cleanQuery, parseProfession, peopleSearchWhere, personSubtitle } from "./people-search";

describe("cleanQuery", () => {
  it("trims and caps the search", () => {
    expect(cleanQuery("  Dublin ")).toBe("Dublin");
    expect(cleanQuery("x".repeat(100))).toHaveLength(80);
    expect(cleanQuery(null)).toBe("");
  });
});

describe("parseProfession", () => {
  it("accepts only known disciplines", () => {
    expect(parseProfession("clinical")).toBe("clinical");
    expect(parseProfession("astronaut")).toBeNull();
    expect(parseProfession(undefined)).toBeNull();
  });
});

describe("peopleSearchWhere", () => {
  it("matches nothing extra for an empty search", () => {
    expect(peopleSearchWhere("")).toBeUndefined();
  });

  it("finds clinical members when someone types trichologist", () => {
    const or = peopleSearchWhere("trichologist")!.OR!;
    expect(or).toContainEqual({ profile: { profession: { in: ["clinical"] } } });
    expect(or).toContainEqual({ name: { contains: "trichologist", mode: "insensitive" } });
  });

  it("leaves out the discipline clause when no discipline matches", () => {
    const or = peopleSearchWhere("Galway")!.OR!;
    expect(or.some((c) => JSON.stringify(c).includes("profession"))).toBe(false);
  });
});

describe("personSubtitle", () => {
  it("joins discipline, practice and place", () => {
    expect(personSubtitle({ discipline: "Clinical", practiceName: "Scalp Clinic", specialization: "Alopecia", place: "Cork" })).toBe(
      "Clinical · Scalp Clinic · Cork"
    );
    expect(personSubtitle({ specialization: "Alopecia" })).toBe("Alopecia");
    expect(personSubtitle({})).toBe("Member");
  });
});
