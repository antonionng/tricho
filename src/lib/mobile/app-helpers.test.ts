import { describe, expect, it, vi } from "vitest";
import { packagesByPlan, periodLabel, planForProduct } from "../../../mobile/src/components/membership/plans";
import { draftFrom, fieldsFor, toggleIn } from "../../../mobile/src/components/profile/draft";
import { planFromProduct } from "./store";
import { profileDataFromForm } from "@/lib/profile";
import { formData } from "./api";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/member", () => ({ getMemberContext: vi.fn() }));

describe("app paywall: store package to plan", () => {
  it("reads the plan from the product id, as the server does", () => {
    for (const id of ["tc_professional_annual", "tc.community.monthly", "TC_BUSINESS_M", "tc_premium"]) {
      expect(planForProduct(id)).toBe(planFromProduct(id));
    }
    expect(planForProduct(null)).toBeNull();
  });

  it("labels store periods", () => {
    expect(periodLabel("P1M")).toBe("month");
    expect(periodLabel("P1Y")).toBe("year");
    expect(periodLabel("P12M")).toBe("year");
    expect(periodLabel("P3M")).toBe("3 months");
    expect(periodLabel(null)).toBeNull();
  });

  it("groups packages by plan in plan order, monthly first, and drops unknown products", () => {
    const pkg = (id: string, period: string) => ({ identifier: id, product: { identifier: id, priceString: "£1", subscriptionPeriod: period } });
    const groups = packagesByPlan(
      [pkg("tc_professional_annual", "P1Y"), pkg("tc_community_monthly", "P1M"), pkg("tc_professional_monthly", "P1M"), pkg("tips", "P1M")],
      ["community", "professional", "business"]
    );
    expect(groups.map((g) => g.plan)).toEqual(["community", "professional"]);
    expect(groups[1].packages.map((p) => p.identifier)).toEqual(["tc_professional_monthly", "tc_professional_annual"]);
  });
});

const empty = {
  headline: null,
  practiceName: null,
  city: null,
  country: null,
  bio: null,
  specialisms: [],
  services: [],
  yearsInPractice: null,
  qualifications: [],
  memberships: [],
  phone: null,
  website: null,
  socials: {},
  addressLine1: null,
  addressLine2: null,
  postcode: null,
  showPhone: false,
  showAddress: false,
  goals: [],
  interests: [],
};

describe("app profile forms", () => {
  it("splits saved memberships into ticked bodies and other bodies", () => {
    const d = draftFrom({ ...empty, memberships: ["IAT", "Local guild"] }, { knownBodies: ["IAT", "WTS"] });
    expect(d.memberships).toEqual(["IAT"]);
    expect(d.membershipsOther).toBe("Local guild");
    expect(d.quals).toHaveLength(3);
  });

  it("posts fields the website's parser saves, including emptied choices", () => {
    const d = draftFrom({ ...empty, goals: ["peers"], qualifications: [{ title: "Diploma in Trichology", year: 2019 }] });
    d.goals = toggleIn(d.goals, "peers");
    d.showPhone = true;
    d.socials.instagram = "@jane.hair";
    const fd = formData(fieldsFor(["qualifications", "contact", "goals"], d, ["instagram"]));
    const data = profileDataFromForm(fd);
    expect(data.goals).toEqual([]);
    expect(data.interests).toEqual([]);
    expect(data.showPhone).toBe(true);
    expect(data.showAddress).toBe(false);
    expect(data.qualifications).toEqual([{ title: "Diploma in Trichology", year: 2019 }]);
    expect(data.socials).toEqual({ instagram: "https://www.instagram.com/jane.hair" });
  });

  it("clears qualifications when every row is emptied", () => {
    const d = draftFrom(empty);
    d.quals = [];
    expect(profileDataFromForm(formData(fieldsFor(["qualifications"], d))).qualifications).toEqual([]);
  });

  it("sends 'none' for no chapter", () => {
    expect(fieldsFor(["about"], draftFrom(empty, { name: " Jane " }))).toEqual({ name: "Jane", profession: "", chapter: "none" });
  });
});
