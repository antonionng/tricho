import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  event: { findUnique: vi.fn(), updateMany: vi.fn() },
  user: { findMany: vi.fn() },
  notification: { createMany: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));

const createDraft = vi.fn();
vi.mock("./runtime", () => ({ createDraft: (...a: unknown[]) => createDraft(...a) }));
const knownReleaseRefs = vi.fn();
vi.mock("./releases", async (orig) => ({
  ...(await orig<typeof import("./releases")>()),
  knownReleaseRefs: () => knownReleaseRefs(),
}));

import { announceMasterclass, masterclassNotice } from "./announce";

const future = new Date(Date.now() + 14 * 86_400_000);
const event = {
  id: "ev1",
  slug: "laser-led-and-dose",
  title: "Laser, LED and dose: understanding the specifications",
  kind: "masterclass",
  summary: "What laser and LED actually mean.",
  startsAt: future,
  endsAt: null,
  online: true,
  venue: null,
  city: null,
  priceGBP: 20,
  memberPriceGBP: 0,
  published: true,
  presenters: "Adam Bond (LIVDOR) and Karley Weir",
  announcedAt: null as Date | null,
  sponsor: { name: "LIVDOR" },
};

/** Stands in for the database's unique refKey: a second insert of the same ref is skipped. */
let stored: Set<string>;

beforeEach(() => {
  vi.clearAllMocks();
  stored = new Set();
  db.event.findUnique.mockResolvedValue(event);
  db.event.updateMany.mockResolvedValue({ count: 1 });
  db.user.findMany.mockResolvedValue([{ id: "u1" }, { id: "u2" }, { id: "u3" }]);
  db.notification.createMany.mockImplementation(async ({ data }: { data: { refKey: string }[] }) => {
    let count = 0;
    for (const row of data) {
      if (stored.has(row.refKey)) continue;
      stored.add(row.refKey);
      count++;
    }
    return { count };
  });
  knownReleaseRefs.mockResolvedValue(new Set());
  createDraft.mockResolvedValue({ id: "d1" });
});

describe("announceMasterclass", () => {
  it("tells every active account in the app and drafts the email for approval", async () => {
    const r = await announceMasterclass("ev1");
    expect(r).toEqual({ notified: 3, drafted: true, firstTime: true });
    expect(db.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { accessStatus: "active" } }));
    const rows = db.notification.createMany.mock.calls[0][0];
    expect(rows.skipDuplicates).toBe(true);
    expect(rows.data.map((d: { refKey: string }) => d.refKey)).toEqual(["masterclass:ev1:u1", "masterclass:ev1:u2", "masterclass:ev1:u3"]);
    expect(createDraft).toHaveBeenCalledWith(expect.objectContaining({ kind: "announcement", agentRisk: "high" }));
    expect(createDraft.mock.calls[0][0].payload.cta.label).toBe("Buy a ticket, or sign up as a member to join and watch live");
  });

  it("never notifies anyone twice, however often it runs", async () => {
    await announceMasterclass("ev1");
    db.event.updateMany.mockResolvedValue({ count: 0 });
    knownReleaseRefs.mockResolvedValue(new Set(["release:event:laser-led-and-dose"]));
    const again = await announceMasterclass("ev1");
    expect(again).toEqual({ notified: 0, drafted: false, firstTime: false });
    expect(stored.size).toBe(3);
  });

  it("reaches only the people missed when run again", async () => {
    await announceMasterclass("ev1");
    db.user.findMany.mockResolvedValue([{ id: "u1" }, { id: "u2" }, { id: "u3" }, { id: "u4" }]);
    expect((await announceMasterclass("ev1"))?.notified).toBe(1);
  });

  it("skips a masterclass already announced when asked for the first time only", async () => {
    db.event.findUnique.mockResolvedValue({ ...event, announcedAt: new Date() });
    expect(await announceMasterclass("ev1", { onlyFirstTime: true })).toBeNull();
    expect(db.notification.createMany).not.toHaveBeenCalled();
  });

  it("ignores other kinds of event, past dates and unpublished events", async () => {
    for (const e of [{ ...event, kind: "gathering" }, { ...event, startsAt: new Date(Date.now() - 1000) }, { ...event, published: false }]) {
      db.event.findUnique.mockResolvedValue(e);
      expect(await announceMasterclass("ev1")).toBeNull();
    }
    expect(db.notification.createMany).not.toHaveBeenCalled();
  });

  it("never throws, so saving the event still works", async () => {
    db.user.findMany.mockRejectedValue(new Error("database down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(announceMasterclass("ev1")).resolves.toBeNull();
    spy.mockRestore();
  });
});

describe("masterclassNotice", () => {
  it("names the masterclass, the day and the sponsor, and links to the page anyone can book from", () => {
    const n = masterclassNotice({ ...event, sponsorName: "LIVDOR" });
    expect(n.kind).toBe("masterclass");
    expect(n.title).toContain("New masterclass: Laser, LED and dose");
    expect(n.title).toContain("(sponsored by LIVDOR)");
    expect(n.href).toBe("/events/laser-led-and-dose");
  });
});
