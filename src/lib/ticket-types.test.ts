import { describe, expect, it } from "vitest";
import { penceToPounds, poundsToPence, validateTicketType } from "./ticket-types";

const base = { name: " Early   bird ", price: "149.50", memberPrice: "", capacity: "", maxPerOrder: "", sortOrder: "", active: "on" };

describe("poundsToPence", () => {
  it("reads whole pounds, pence and a pound sign", () => {
    expect(poundsToPence("60")).toBe(6000);
    expect(poundsToPence("£149.5")).toBe(14950);
    expect(poundsToPence("1,200.00")).toBe(120000);
    expect(poundsToPence("")).toBeNull();
    expect(poundsToPence("12.345")).toBeNull();
    expect(poundsToPence("free")).toBeNull();
  });
  it("shows pence back as pounds", () => {
    expect(penceToPounds(6000)).toBe("60");
    expect(penceToPounds(14950)).toBe("149.50");
    expect(penceToPounds(null)).toBe("");
  });
});

describe("validateTicketType", () => {
  it("normalises a valid type", () => {
    const r = validateTicketType(base, "Europe/London");
    expect(r).toEqual({
      ok: true,
      data: {
        name: "Early bird",
        description: "",
        pricePence: 14950,
        memberPricePence: null,
        membersOnly: false,
        capacity: null,
        salesStart: null,
        salesEnd: null,
        maxPerOrder: 4,
        sortOrder: 0,
        active: true,
        kind: "attendee",
        placesIncluded: 1,
        includesStand: false,
        includesStageSlot: false,
        addonForTypeIds: [],
      },
    });
  });

  it("reads the sales window as wall-clock time in the event's zone", () => {
    const r = validateTicketType({ ...base, salesStart: "2026-12-01T09:00", salesEnd: "2027-04-01T23:59" }, "Europe/London");
    expect(r.ok && r.data.salesStart?.toISOString()).toBe("2026-12-01T09:00:00.000Z");
    // 1 April 2027 is in British Summer Time.
    expect(r.ok && r.data.salesEnd?.toISOString()).toBe("2027-04-01T22:59:00.000Z");
  });

  it("asks for a name and a price Stripe can take", () => {
    expect(validateTicketType({ ...base, name: "" }, "Europe/London").ok).toBe(false);
    expect(validateTicketType({ ...base, price: "0" }, "Europe/London").ok).toBe(false);
    expect(validateTicketType({ ...base, price: "0.29" }, "Europe/London").ok).toBe(false);
    expect(validateTicketType({ ...base, memberPrice: "0" }, "Europe/London").ok).toBe(false);
    const member = validateTicketType({ ...base, memberPrice: "99" }, "Europe/London");
    expect(member.ok && member.data.memberPricePence).toBe(9900);
  });

  it("keeps limits sensible", () => {
    expect(validateTicketType({ ...base, capacity: "0" }, "Europe/London").ok).toBe(false);
    const r = validateTicketType({ ...base, capacity: "120", maxPerOrder: "50", membersOnly: "on", active: undefined }, "Europe/London");
    expect(r.ok && r.data).toMatchObject({ capacity: 120, maxPerOrder: 20, membersOnly: true, active: false });
    const low = validateTicketType({ ...base, maxPerOrder: "0" }, "Europe/London");
    expect(low.ok && low.data.maxPerOrder).toBe(1);
  });

  it("needs the sales window the right way round and complete", () => {
    expect(validateTicketType({ ...base, salesStart: "2027-01-02T09:00", salesEnd: "2027-01-01T09:00" }, "Europe/London").ok).toBe(false);
    expect(validateTicketType({ ...base, salesStart: "next week" }, "Europe/London").ok).toBe(false);
  });
});

describe("validateTicketType for packages and extra places", () => {
  const pkg = { ...base, name: "Evolve", price: "750", kind: "package", placesIncluded: "3", includesStand: "on", includesStageSlot: "on", memberPrice: "500", membersOnly: "on", maxPerOrder: "9" };

  it("keeps a package's places, stand and stage slot, and sells it one at a time with no member price", () => {
    const r = validateTicketType(pkg, "Europe/London");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toMatchObject({
      kind: "package",
      pricePence: 75_000,
      placesIncluded: 3,
      includesStand: true,
      includesStageSlot: true,
      maxPerOrder: 1,
      memberPricePence: null,
      membersOnly: false,
      addonForTypeIds: [],
    });
  });

  it("allows a package with no places, such as Sponsor, but not a missing or negative number", () => {
    expect(validateTicketType({ ...pkg, placesIncluded: "0" }, "Europe/London")).toMatchObject({ ok: true, data: { placesIncluded: 0 } });
    expect(validateTicketType({ ...pkg, placesIncluded: "" }, "Europe/London").ok).toBe(false);
    expect(validateTicketType({ ...pkg, placesIncluded: "-1" }, "Europe/London").ok).toBe(false);
  });

  it("keeps a package's benefits one per line", () => {
    const r = validateTicketType({ ...pkg, description: "  Prime stand \r\n\n A stage slot  " }, "Europe/London");
    expect(r.ok && r.data.description).toBe("Prime stand\nA stage slot");
  });

  it("keeps only real packages on an add-on, and defaults it to five per package", () => {
    const r = validateTicketType({ ...base, name: "Extra exhibitor ticket", price: "100", kind: "addon", maxPerOrder: "" }, "Europe/London", {
      addonFor: ["p1", "p2", "p2", "stranger"],
      packageIds: ["p1", "p2"],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toMatchObject({ kind: "addon", maxPerOrder: 5, placesIncluded: 1, addonForTypeIds: ["p1", "p2"], includesStand: false });
  });

  it("caps an add-on at twenty places per package", () => {
    const r = validateTicketType({ ...base, kind: "addon", maxPerOrder: "50" }, "Europe/London");
    expect(r.ok && r.data.maxPerOrder).toBe(20);
  });

  it("names the right thing when the name is missing", () => {
    expect(validateTicketType({ ...pkg, name: "" }, "Europe/London")).toEqual({ ok: false, error: "Please give the package a name, such as Elevate." });
  });
});
