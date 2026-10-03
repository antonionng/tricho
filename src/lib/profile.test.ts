import { describe, expect, it } from "vitest";
import {
  filledSteps,
  parseList,
  parseQualifications,
  parseSocial,
  parseSocials,
  parseWebsite,
  parseYearsInPractice,
  profileCompleteness,
  profileDataFromForm,
  readQualifications,
  readSocials,
  resumeStep,
} from "./profile";

const now = new Date("2026-10-02T12:00:00Z");

describe("parseList", () => {
  it("splits on commas and new lines, trims and removes duplicates", () => {
    expect(parseList("Head spa, Scalp analysis\n head spa ,, Hair loss")).toEqual(["Head spa", "Scalp analysis", "Hair loss"]);
  });
  it("caps the number and length of items", () => {
    expect(parseList("a,b,c,d", 2)).toEqual(["a", "b"]);
    expect(parseList("x".repeat(100), 5, 10)).toEqual(["x".repeat(10)]);
    expect(parseList(null)).toEqual([]);
  });
});

describe("parseQualifications", () => {
  it("reads one qualification per line with an optional year", () => {
    expect(parseQualifications("Diploma in Trichology, 2019\nMSc Dermatology (2021)\nHead spa certificate", 12, now)).toEqual([
      { title: "Diploma in Trichology", year: 2019 },
      { title: "MSc Dermatology", year: 2021 },
      { title: "Head spa certificate" },
    ]);
  });
  it("accepts structured rows and drops empty or implausible values", () => {
    expect(
      parseQualifications(
        [
          { title: " Fellowship ", year: "2030" },
          { title: "", year: "2020" },
          { title: "Certificate", year: "2018", body: "IAT" },
        ],
        12,
        now
      )
    ).toEqual([{ title: "Fellowship" }, { title: "Certificate", body: "IAT", year: 2018 }]);
  });
  it("reads stored JSON safely", () => {
    expect(readQualifications(null)).toEqual([]);
    expect(readQualifications([{ title: "A", year: 2001 }, "junk"])).toEqual([{ title: "A", year: 2001 }]);
  });
});

describe("parseSocials", () => {
  it("turns handles into profile links", () => {
    expect(parseSocial("instagram", "@jane.hair")).toBe("https://www.instagram.com/jane.hair");
    expect(parseSocial("tiktok", "jane")).toBe("https://www.tiktok.com/@jane");
    expect(parseSocial("linkedin", "jane-doe")).toBe("https://www.linkedin.com/in/jane-doe");
    expect(parseSocial("youtube", "@clinic")).toBe("https://www.youtube.com/@clinic");
  });
  it("normalises links and refuses other sites", () => {
    expect(parseSocial("instagram", "instagram.com/jane/")).toBe("https://instagram.com/jane");
    expect(parseSocial("facebook", "http://www.facebook.com/clinic")).toBe("https://www.facebook.com/clinic");
    expect(parseSocial("instagram", "https://evil.example/instagram.com/jane")).toBeUndefined();
    expect(parseSocial("instagram", "not a handle")).toBeUndefined();
  });
  it("keeps only valid networks", () => {
    expect(parseSocials({ instagram: "jane", twitter: "jane", tiktok: "" })).toEqual({
      instagram: "https://www.instagram.com/jane",
    });
    expect(readSocials("nope")).toEqual({});
  });
});

describe("parseWebsite and parseYearsInPractice", () => {
  it("adds https and rejects things that aren't addresses", () => {
    expect(parseWebsite("example.com")).toBe("https://example.com");
    expect(parseWebsite("https://clinic.ie/about")).toBe("https://clinic.ie/about");
    expect(parseWebsite("localhost")).toBeNull();
    expect(parseWebsite("")).toBeNull();
  });
  it("accepts whole numbers of years only", () => {
    expect(parseYearsInPractice("12")).toBe(12);
    expect(parseYearsInPractice("")).toBeNull();
    expect(parseYearsInPractice("-1")).toBeNull();
    expect(parseYearsInPractice("2.5")).toBeNull();
  });
});

describe("profileDataFromForm", () => {
  it("only includes the fields a form shows", () => {
    const fd = new FormData();
    fd.set("headline", "  Trichologist  ");
    fd.set("specialisms", "Alopecia, Scalp health");
    expect(profileDataFromForm(fd)).toEqual({
      headline: "Trichologist",
      specialisms: ["Alopecia", "Scalp health"],
      specialization: "Alopecia, Scalp health",
    });
  });
  it("treats unticked checkboxes as cleared when the group was shown", () => {
    const fd = new FormData();
    fd.append("_present", "goals");
    fd.append("_present", "showPhone");
    fd.append("_present", "memberships");
    fd.append("memberships", "IAT");
    fd.append("memberships", "made-up");
    fd.set("membershipsOther", "Irish Medical Council");
    expect(profileDataFromForm(fd)).toEqual({ goals: [], showPhone: false, memberships: ["IAT", "Irish Medical Council"] });
  });
  it("reads qualification rows and social links", () => {
    const fd = new FormData();
    for (const [t, y] of [["Diploma", "2019"], ["", ""], ["MSc", ""]]) {
      fd.append("qualTitle", t);
      fd.append("qualYear", y);
    }
    fd.set("social_instagram", "@jane");
    fd.set("social_tiktok", "");
    const data = profileDataFromForm(fd);
    expect(data.qualifications).toEqual([{ title: "Diploma", year: 2019 }, { title: "MSc" }]);
    expect(data.socials).toEqual({ instagram: "https://www.instagram.com/jane" });
  });
});

describe("profileCompleteness", () => {
  it("is zero for an empty profile and lists what is missing", () => {
    const c = profileCompleteness(null, null);
    expect(c.percent).toBe(0);
    expect(c.missing[0]).toBe("your name");
  });
  it("counts a full profile as complete", () => {
    const c = profileCompleteness(
      {
        profession: "clinical",
        photoFileId: "f1",
        headline: "h",
        city: "Dublin",
        bio: "b",
        specialisms: ["a"],
        services: ["s"],
        qualifications: [{ title: "q" }],
        memberships: ["IAT"],
        socials: { instagram: "https://www.instagram.com/x" },
        goals: ["referrals"],
      },
      { name: "Jane Doe" }
    );
    expect(c).toEqual({ percent: 100, missing: [] });
  });
});

describe("onboarding progress", () => {
  it("starts at the discipline step until it is saved", () => {
    expect(resumeStep(filledSteps(null, null), 5)).toBe(1);
  });
  it("resumes at the first empty step after the furthest step reached", () => {
    const filled = filledSteps({ profession: "clinical", city: "Cork" }, { name: "J" });
    expect(resumeStep(filled, 0)).toBe(3);
    // Steps 3 and 4 were skipped, so they are not asked again.
    expect(resumeStep(filled, 4)).toBe(5);
    expect(resumeStep(filled, 7)).toBe(8);
  });
});
