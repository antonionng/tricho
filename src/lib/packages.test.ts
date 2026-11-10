import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/mail/send", () => ({ deliverOnce: vi.fn(), alertOwners: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  DEFAULT_EXTRA_PLACES,
  DEFAULT_PACKAGES,
  addonsFor,
  bookletBlurb,
  bookletCsvRows,
  exhibitorDetails,
  extrasLeft,
  invoiceFields,
  kindOf,
  normaliseVat,
  normaliseWebsite,
  packageAvailability,
  packageBlocked,
  packageIncludes,
  packagePlaces,
  sharedLeft,
  type PackageOrder,
  type PackageRule,
} from "./packages";

const startsAt = new Date("2027-04-26T08:30:00Z");
const now = new Date("2026-11-10T12:00:00Z");

function pkg(over: Partial<PackageRule> = {}): PackageRule {
  return {
    id: "evolve",
    name: "Evolve",
    pricePence: 75_000,
    memberPricePence: null,
    membersOnly: false,
    capacity: null,
    salesStart: null,
    salesEnd: null,
    maxPerOrder: 1,
    active: true,
    kind: "package",
    placesIncluded: 3,
    includesStand: true,
    includesStageSlot: true,
    ...over,
  };
}

const order = (ticketTypeId: string, over: Partial<PackageOrder> = {}): PackageOrder => ({
  ticketTypeId,
  quantity: 1,
  includesStand: false,
  includesStageSlot: false,
  ...over,
});

describe("Karley's default packages", () => {
  it("match the price list", () => {
    expect(DEFAULT_PACKAGES.map((p) => [p.name, p.pricePence / 100, p.placesIncluded, p.includesStand, p.includesStageSlot])).toEqual([
      ["Sponsor", 150, 0, false, false],
      ["Exhibit", 250, 1, false, false],
      ["Elevate", 500, 1, true, false],
      ["Evolve", 750, 3, true, true],
      ["Elite", 1000, 5, true, true],
    ]);
    expect(DEFAULT_EXTRA_PLACES).toMatchObject({ pricePence: 10_000, maxPerOrder: 5 });
  });

  it("describe positioning as standard, priority and prime", () => {
    const stand = (name: string) => DEFAULT_PACKAGES.find((p) => p.name === name)!.description.split("\n")[0];
    expect(stand("Elevate")).toMatch(/standard stand/);
    expect(stand("Evolve")).toMatch(/priority/);
    expect(stand("Elite")).toMatch(/prime stand/);
  });
});

describe("kindOf", () => {
  it("treats anything unknown, including today's types, as an attendee ticket", () => {
    expect(kindOf({})).toBe("attendee");
    expect(kindOf(null)).toBe("attendee");
    expect(kindOf({ kind: "package" })).toBe("package");
    expect(kindOf({ kind: "addon" })).toBe("addon");
  });
});

describe("packageAvailability", () => {
  it("counts the package's own stock", () => {
    const a = packageAvailability(pkg({ capacity: 2, includesStand: false, includesStageSlot: false }), { startsAt }, [order("evolve")], { now });
    expect(a).toMatchObject({ state: "on_sale", left: 1 });
    const gone = packageAvailability(pkg({ capacity: 1 }), { startsAt }, [order("evolve")], { now });
    expect(gone.state).toBe("sold_out");
  });

  it("shares stage slots between Evolve and Elite", () => {
    const orders = [order("elite", { includesStand: true, includesStageSlot: true }), order("evolve", { includesStand: true, includesStageSlot: true })];
    const event = { startsAt, stageSlots: 2, standSpaces: 20 };
    expect(packageAvailability(pkg(), event, orders, { now })).toMatchObject({ state: "sold_out", left: 0 });
    expect(packageAvailability(pkg({ id: "elite", name: "Elite" }), event, orders, { now }).state).toBe("sold_out");
    // Elevate has a stand but no stage slot, so it is still on sale.
    expect(packageAvailability(pkg({ id: "elevate", includesStageSlot: false }), event, orders, { now })).toMatchObject({ state: "on_sale", left: 18 });
  });

  it("shares stand spaces between every package with a stand", () => {
    const orders = [order("elevate", { includesStand: true }), order("elevate", { includesStand: true })];
    const elevate = pkg({ id: "elevate", includesStageSlot: false, capacity: 10 });
    expect(packageAvailability(elevate, { startsAt, standSpaces: 3 }, orders, { now }).left).toBe(1);
    // Exhibit has no stand, so stands never stop it.
    const exhibit = pkg({ id: "exhibit", includesStand: false, includesStageSlot: false });
    expect(packageAvailability(exhibit, { startsAt, standSpaces: 2 }, orders, { now })).toMatchObject({ state: "on_sale", left: null });
  });

  it("uses the smallest of the package's stock, stands and stage slots", () => {
    const a = packageAvailability(pkg({ capacity: 5 }), { startsAt, standSpaces: 4, stageSlots: 3 }, [], { now });
    expect(a.left).toBe(3);
  });

  it("explains why a package cannot be bought", () => {
    const p = pkg();
    expect(packageBlocked(p, { state: "sold_out", left: 0, opensAt: null })).toBe("The Evolve package has sold out.");
    expect(packageBlocked(p, { state: "on_sale", left: 2, opensAt: null })).toBeNull();
    expect(packageAvailability(pkg({ active: false }), { startsAt }, [], { now }).state).toBe("closed");
  });

  it("counts shared stock only from packages", () => {
    expect(sharedLeft({ standSpaces: null, stageSlots: 4 }, [order("x", { includesStageSlot: true })])).toEqual({ stands: null, stage: 3 });
  });
});

describe("extrasLeft", () => {
  const addon = { id: "extra", maxPerOrder: 5, capacity: null };
  it("allows up to five per package across all its orders", () => {
    const orders = [order("extra", { quantity: 2, packageTicketId: "pkgA" }), order("extra", { quantity: 1, packageTicketId: "pkgA" }), order("extra", { quantity: 4, packageTicketId: "pkgB" })];
    expect(extrasLeft(addon, "pkgA", orders)).toBe(2);
    expect(extrasLeft(addon, "pkgB", orders)).toBe(1);
    expect(extrasLeft(addon, "pkgC", orders)).toBe(5);
  });
  it("never goes beyond the add-on's own stock", () => {
    const orders = [order("extra", { quantity: 4, packageTicketId: "pkgB" })];
    expect(extrasLeft({ ...addon, capacity: 6 }, "pkgA", orders)).toBe(2);
  });
});

describe("addonsFor", () => {
  it("offers an add-on only to the packages it lists, and only while on", () => {
    const types = [
      { id: "extra", kind: "addon", addonForTypeIds: ["exhibit", "elevate"], active: true },
      { id: "old", kind: "addon", addonForTypeIds: ["exhibit"], active: false },
      { id: "elite", kind: "package", addonForTypeIds: [], active: true },
    ];
    expect(addonsFor(types, "exhibit").map((t) => t.id)).toEqual(["extra"]);
    expect(addonsFor(types, "elite")).toEqual([]);
  });
});

describe("packageIncludes", () => {
  it("lists places, then the stand and stage slot when the description leaves them out", () => {
    expect(packageIncludes({ placesIncluded: 0, includesStand: false, includesStageSlot: false, description: "Booklet listing" })).toEqual([
      "No delegate places are included.",
      "Booklet listing",
    ]);
    expect(packageIncludes({ placesIncluded: 3, includesStand: true, includesStageSlot: true, description: "- Booklet listing" })).toEqual([
      "3 delegate places, each with its own e-ticket.",
      "A stand space in the exhibition area.",
      "A slot on the main stage.",
      "Booklet listing",
    ]);
  });
  it("does not repeat the stand when the description already mentions it", () => {
    const lines = packageIncludes({ placesIncluded: 1, includesStand: true, includesStageSlot: false, description: "A prime stand space." });
    expect(lines).toEqual(["One delegate place, with its own e-ticket.", "A prime stand space."]);
  });
});

describe("exhibitorDetails", () => {
  const good = {
    companyName: "  Follicle   Labs ",
    contactName: "Sam Patel",
    contactEmail: "Sam@Follicle.example",
    contactPhone: "+44 7700 900123",
    website: "follicle.example",
    invoiceAddress: " 1 High Street \n\n Northampton NN1 1AA ",
    vatNumber: "gb 123 4567 89",
  };
  it("tidies what a business gives", () => {
    expect(exhibitorDetails(good)).toEqual({
      ok: true,
      data: {
        companyName: "Follicle Labs",
        contactName: "Sam Patel",
        contactEmail: "sam@follicle.example",
        contactPhone: "+44 7700 900123",
        website: "https://follicle.example",
        invoiceAddress: "1 High Street\nNorthampton NN1 1AA",
        vatNumber: "GB123456789",
      },
    });
  });
  it("makes the website and VAT number optional", () => {
    expect(exhibitorDetails({ ...good, website: "", vatNumber: "" })).toMatchObject({ ok: true, data: { website: null, vatNumber: null } });
  });
  it("asks for each required detail in a sentence", () => {
    for (const key of ["companyName", "contactName", "contactEmail", "contactPhone", "invoiceAddress"] as const) {
      const r = exhibitorDetails({ ...good, [key]: "" });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toMatch(/^Please .+\.$/);
    }
    expect(exhibitorDetails({ ...good, vatNumber: "not a vat!" }).ok).toBe(false);
    expect(exhibitorDetails(null).ok).toBe(false);
  });
  it("normalises websites and VAT numbers", () => {
    expect(normaliseWebsite("https://www.brand.co.uk/")).toBe("https://www.brand.co.uk");
    expect(normaliseWebsite("javascript:alert(1)")).toBe(false);
    expect(normaliseWebsite("localhost")).toBe(false);
    expect(normaliseVat("IE 6388047V")).toBe("IE6388047V");
  });
});

describe("packagePlaces", () => {
  const company = { companyName: "Follicle Labs", contactName: "Sam Patel", contactEmail: "sam@follicle.example" };
  it("leaves unnamed places waiting to be named, under the contact's email", () => {
    const r = packagePlaces([{ name: "Sam Patel", email: "", isBuyer: true }, { name: "" }, {}], 3, company);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows.map((p) => [p.name, p.email, p.awaitingName])).toEqual([
      ["Sam Patel", "sam@follicle.example", false],
      ["Follicle Labs, place 2", "sam@follicle.example", true],
      ["Follicle Labs, place 3", "sam@follicle.example", true],
    ]);
  });
  it("has no places for a package without any, whatever is sent", () => {
    expect(packagePlaces([{ name: "Someone" }], 0, company)).toEqual({ ok: true, rows: [] });
  });
  it("never names more places than the package includes", () => {
    const r = packagePlaces([{ name: "A" }, { name: "B" }, { name: "C" }], 2, company);
    expect(r.ok && r.rows.map((p) => p.name)).toEqual(["A", "B"]);
  });
  it("checks a named place's email", () => {
    expect(packagePlaces([{ name: "A", email: "nope" }], 1, company).ok).toBe(false);
  });
});

describe("booklet", () => {
  it("keeps paragraphs and trims the text", () => {
    expect(bookletBlurb("  We make   scalp serums.\r\n\r\n\r\nVisit stand 4.  ")).toBe("We make scalp serums.\n\nVisit stand 4.");
    expect(bookletBlurb("   ")).toBeNull();
    expect(bookletBlurb("x".repeat(900))!.length).toBe(600);
  });
  it("exports company, package, blurb and an absolute logo URL", () => {
    const rows = bookletCsvRows(
      [{ company: "Follicle Labs", packageName: "Elite", blurb: "Serums.", logoUrl: "/api/files/f1", website: null, standNumber: "4" }],
      (u) => `https://www.trichollective.net${u}`
    );
    expect(rows).toEqual([
      ["Company", "Package", "Booklet text", "Logo URL", "Website", "Stand"],
      ["Follicle Labs", "Elite", "Serums.", "https://www.trichollective.net/api/files/f1", "", "4"],
    ]);
  });
});

describe("invoiceFields", () => {
  it("puts the company and VAT number on the Stripe invoice, within Stripe's limits", () => {
    expect(invoiceFields({ companyName: "Follicle Labs", vatNumber: "GB123456789", contactName: "Sam" })).toEqual([
      { name: "Company", value: "Follicle Labs" },
      { name: "VAT number", value: "GB123456789" },
      { name: "Contact", value: "Sam" },
    ]);
    const long = invoiceFields({ companyName: "x".repeat(300), vatNumber: null, contactName: "Sam" });
    expect(long).toHaveLength(2);
    expect(long[0].value).toHaveLength(140);
  });
});
