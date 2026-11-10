import { describe, expect, it, vi } from "vitest";
import { setupEventPackages } from "./package-setup";

function fakeDb(event: Record<string, unknown> | null, types: Record<string, unknown>[]) {
  const created: Record<string, unknown>[] = [];
  let n = 0;
  const db = {
    event: { findUnique: vi.fn().mockResolvedValue(event), update: vi.fn().mockResolvedValue({}) },
    eventTicketType: {
      findMany: vi.fn(async (args: { where: { kind?: string; placesIncluded?: unknown } }) => {
        const all = [...types, ...created];
        if (args.where.kind === "package") return all.filter((t) => t.kind === "package" && (t.placesIncluded as number) > 0);
        return all;
      }),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: `new_${++n}`, addonForTypeIds: [], ...data };
        created.push(row);
        return row;
      }),
      update: vi.fn().mockResolvedValue({}),
    },
  };
  return { db, created };
}

const whittlebury = { id: "c3a8f0a88b391441b7019a1ac", title: "TRICHOLLECTIVE UK", published: false, online: false, standSpaces: null, stageSlots: null };
const tickets = [
  { id: "tt_early", name: "Early bird", kind: "attendee", pricePence: 12500, memberPricePence: 11250, placesIncluded: 1, addonForTypeIds: [] },
  { id: "tt_std", name: "Standard", kind: "attendee", pricePence: 15000, memberPricePence: 13500, placesIncluded: 1, addonForTypeIds: [] },
];

describe("setupEventPackages", () => {
  it("adds the five packages and extra places for every package with places, and leaves attendee tickets alone", async () => {
    const { db, created } = fakeDb(whittlebury, tickets);
    const r = await setupEventPackages(db as never, whittlebury.id, { apply: true });
    expect("error" in r).toBe(false);
    expect(db.event.update).toHaveBeenCalledWith({ where: { id: whittlebury.id }, data: { standSpaces: 20, stageSlots: 8 } });
    expect(created.map((t) => t.name)).toEqual(["Sponsor", "Promote", "Elevate", "Evolve", "Elite", "Extra exhibitor ticket"]);
    const addon = created.at(-1)!;
    const byId = new Map(created.map((t) => [t.id, t.name]));
    expect((addon.addonForTypeIds as string[]).map((id) => byId.get(id))).toEqual(["Promote", "Elevate", "Evolve", "Elite"]);
    expect(addon).toMatchObject({ kind: "addon", pricePence: 10_000, maxPerOrder: 5 });
    if (!("error" in r)) expect(r.ticketTypes.map((t) => t.name)).toEqual(["Early bird", "Standard"]);
  });

  it("writes nothing on a dry run", async () => {
    const { db } = fakeDb(whittlebury, tickets);
    const r = await setupEventPackages(db as never, whittlebury.id, { apply: false });
    expect(db.event.update).not.toHaveBeenCalled();
    expect(db.eventTicketType.create).not.toHaveBeenCalled();
    if (!("error" in r)) expect(r.changes).toContain("Added the Promote package at £250.");
  });

  it("keeps stand and stage numbers already set, and adds nothing twice", async () => {
    const event = { ...whittlebury, standSpaces: 14, stageSlots: 4 };
    const existing = [
      ...tickets,
      { id: "p1", name: "Sponsor", kind: "package", placesIncluded: 0, addonForTypeIds: [] },
      { id: "p2", name: "Promote", kind: "package", placesIncluded: 1, addonForTypeIds: [] },
      { id: "x1", name: "Extra exhibitor ticket", kind: "addon", placesIncluded: 1, addonForTypeIds: ["p2"] },
    ];
    const { db, created } = fakeDb(event, existing);
    await setupEventPackages(db as never, event.id, { apply: true });
    expect(db.event.update).not.toHaveBeenCalled();
    expect(created.map((t) => t.name)).toEqual(["Elevate", "Evolve", "Elite"]);
    // The add-on is widened to the new packages, never to Sponsor.
    const update = db.eventTicketType.update.mock.calls[0][0];
    expect(update.where).toEqual({ id: "x1" });
    expect(update.data.addonForTypeIds).toEqual(["p2", "new_1", "new_2", "new_3"]);
  });

  it("refuses online events", async () => {
    const { db } = fakeDb({ ...whittlebury, online: true }, []);
    expect(await setupEventPackages(db as never, "e", { apply: true })).toEqual({ error: "Exhibitor packages are for in-person events." });
  });
});
