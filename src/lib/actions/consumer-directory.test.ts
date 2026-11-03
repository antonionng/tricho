import { beforeEach, describe, expect, it, vi } from "vitest";

const me = vi.hoisted(() => ({ current: null as unknown }));
const db = vi.hoisted(() => ({
  directoryListing: { findUnique: vi.fn(), findFirst: vi.fn() },
  enquiry: { create: vi.fn(async (_args: { data: Record<string, unknown> }) => ({ id: "e1" })) },
  notification: { create: vi.fn() },
  savedListing: { findUnique: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
}));
const mail = vi.hoisted(() => ({ deliver: vi.fn(), deliverOnce: vi.fn() }));

vi.mock("@/lib/consumer-session", () => ({ consumerSession: vi.fn(async () => me.current) }));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/mail/send", () => mail);
vi.mock("@/auth", () => ({ auth: vi.fn(async () => null) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), unstable_cache: (fn: unknown) => fn }));

import { sendEnquiry } from "./enquiry-public";
import { listingVisitorState, setListingSaved } from "./saved";

const form = (v: Record<string, string>) => {
  const f = new FormData();
  for (const [k, val] of Object.entries(v)) f.set(k, val);
  return f;
};
const consumer = { userId: "c1", user: { name: "Aoife", email: "aoife@example.com" }, profile: { alias: "Willow-428" } };
const listing = { id: "l1", kind: "member", userId: "p1", name: "Niamh Walsh", email: "niamh@example.com", freeUntil: null, slug: "niamh" };

beforeEach(() => {
  vi.clearAllMocks();
  me.current = null;
  db.directoryListing.findUnique.mockResolvedValue(listing);
});

describe("sendEnquiry", () => {
  it("links a signed-in consumer's enquiry to their account and uses their account email", async () => {
    me.current = consumer;
    const r = await sendEnquiry(null, form({ listingId: "l1", name: "Aoife Byrne", email: "someone-else@example.com", message: "I would like an appointment." }));
    expect(r?.ok).toBe(true);
    expect(db.enquiry.create.mock.calls[0][0].data).toMatchObject({ userId: "c1", email: "aoife@example.com", name: "Aoife Byrne" });
  });

  it("never puts the alias in what the professional receives", async () => {
    me.current = consumer;
    await sendEnquiry(null, form({ listingId: "l1", name: "Aoife Byrne", message: "I would like an appointment." }));
    const sent = JSON.stringify([mail.deliver.mock.calls, db.notification.create.mock.calls]);
    expect(sent).not.toContain("Willow-428");
    expect(sent).toContain("Aoife Byrne");
  });

  it("leaves enquiries from visitors unlinked", async () => {
    const r = await sendEnquiry(null, form({ listingId: "l1", name: "Sam Kelly", email: "sam@example.com", message: "I would like an appointment." }));
    expect(r?.ok).toBe(true);
    expect(db.enquiry.create.mock.calls[0][0].data).toMatchObject({ userId: null, email: "sam@example.com" });
  });
});

describe("saving a listing", () => {
  it("is only for consumers", async () => {
    expect(await setListingSaved("l1", true)).toEqual({ ok: false, saved: false });
    expect(db.savedListing.upsert).not.toHaveBeenCalled();
  });

  it("only saves listings the public can see", async () => {
    me.current = consumer;
    db.directoryListing.findFirst.mockResolvedValue(null);
    expect(await setListingSaved("hidden", true)).toEqual({ ok: false, saved: false });
    db.directoryListing.findFirst.mockResolvedValue({ id: "l1" });
    expect(await setListingSaved("l1", true)).toEqual({ ok: true, saved: true });
    expect(db.savedListing.upsert).toHaveBeenCalledWith({
      where: { userId_listingId: { userId: "c1", listingId: "l1" } },
      create: { userId: "c1", listingId: "l1" },
      update: {},
    });
  });

  it("un-saves only the consumer's own row", async () => {
    me.current = consumer;
    await setListingSaved("l1", false);
    expect(db.savedListing.deleteMany).toHaveBeenCalledWith({ where: { userId: "c1", listingId: "l1" } });
  });

  it("tells the page who is visiting without exposing anything to visitors", async () => {
    expect(await listingVisitorState("l1")).toEqual({ signedIn: false, consumer: false, saved: false, name: null, email: null });
    me.current = consumer;
    db.savedListing.findUnique.mockResolvedValue({ id: "s1" });
    expect(await listingVisitorState("l1")).toEqual({ signedIn: true, consumer: true, saved: true, name: "Aoife", email: "aoife@example.com" });
  });
});
