import { describe, expect, it } from "vitest";
import { concernLabels, consentLines, consumerWhere } from "./consumers-admin";
import { can } from "@/config/staff";
import { STAFF_ROLES } from "@/config/staff";

describe("consumerWhere", () => {
  it("is always limited to consumer accounts", () => {
    expect(consumerWhere("")).toEqual({ accountType: "consumer" });
    expect(consumerWhere("willow")).toMatchObject({ accountType: "consumer" });
    expect(JSON.stringify(consumerWhere("willow"))).toContain("alias");
  });
});

describe("concernLabels", () => {
  it("shows concerns only while health-data consent stands", () => {
    expect(concernLabels({ concerns: ["thinning"], healthDataConsentAt: new Date() })).toEqual(["Thinning hair"]);
    expect(concernLabels({ concerns: ["thinning"], healthDataConsentAt: null })).toEqual([]);
    expect(concernLabels({ concerns: ["made-up"], healthDataConsentAt: new Date() })).toEqual([]);
  });
});

describe("consentLines", () => {
  it("counts news only with both the consent date and the email setting", () => {
    const at = new Date();
    expect(consentLines({ marketingConsentAt: at, healthDataConsentAt: null }, { emailUpdates: true, emailActivity: true }).news).toBe(true);
    expect(consentLines({ marketingConsentAt: at, healthDataConsentAt: null }, { emailUpdates: false, emailActivity: true }).news).toBe(false);
    expect(consentLines({ marketingConsentAt: null, healthDataConsentAt: null }, { emailUpdates: true, emailActivity: true }).news).toBe(false);
  });
});

describe("who can open consumer accounts in Studio", () => {
  it("is owners and support only, and only owners can delete", () => {
    const viewers = STAFF_ROLES.filter((r) => can(r, "consumers.view"));
    expect(viewers.sort()).toEqual(["owner", "support"]);
    expect(STAFF_ROLES.filter((r) => can(r, "consumers.delete"))).toEqual(["owner"]);
  });
});
