import { beforeEach, describe, expect, it, vi } from "vitest";

const me = vi.hoisted(() => ({ current: null as unknown }));
const db = vi.hoisted(() => ({
  user: { update: vi.fn((x) => x), delete: vi.fn((x) => x) },
  consumerProfile: { update: vi.fn((x) => x), findUnique: vi.fn() },
  pendingSignup: { deleteMany: vi.fn((x) => x) },
  enquiry: { deleteMany: vi.fn((x) => x) },
  savedListing: { deleteMany: vi.fn() },
  $transaction: vi.fn(async (ops: unknown[]) => ops),
}));
const auth = vi.hoisted(() => ({ signOut: vi.fn() }));
const nav = vi.hoisted(() => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`redirect:${to}`);
  }),
}));

vi.mock("@/lib/consumer-session", () => ({ consumerSession: vi.fn(async () => me.current) }));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/auth", () => auth);
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => nav);

import { deleteAccount, unsaveListing, updateProfile, updateSettings } from "./actions";

const form = (v: Record<string, string>) => {
  const f = new FormData();
  for (const [k, val] of Object.entries(v)) f.set(k, val);
  return f;
};
const consumer = {
  userId: "c1",
  user: { email: "c@example.com" },
  profile: { marketingConsentAt: null, healthDataConsentAt: null },
};

beforeEach(() => {
  vi.clearAllMocks();
  me.current = consumer;
});

describe("hub actions", () => {
  it("turn away anyone who isn't a signed-in consumer", async () => {
    me.current = null;
    await expect(updateProfile(null, form({}))).rejects.toThrow("redirect:/login?next=/hub");
    await expect(deleteAccount(null, form({ confirm: "delete" }))).rejects.toThrow("redirect:");
    await expect(unsaveListing(form({ listingId: "l1" }))).rejects.toThrow("redirect:");
    expect(db.user.delete).not.toHaveBeenCalled();
    expect(db.savedListing.deleteMany).not.toHaveBeenCalled();
  });

  it("show the alias unless a first name is given and chosen", async () => {
    await updateProfile(null, form({ firstName: "", displayMode: "name" }));
    expect(db.consumerProfile.update).toHaveBeenLastCalledWith({ where: { userId: "c1" }, data: { displayMode: "alias" } });
    await updateProfile(null, form({ firstName: "Aoife", displayMode: "name" }));
    expect(db.consumerProfile.update).toHaveBeenLastCalledWith({ where: { userId: "c1" }, data: { displayMode: "name" } });
  });

  it("only delete the account once confirmed, then sign out", async () => {
    expect(await deleteAccount(null, form({ confirm: "yes" }))).toEqual({ error: "Please type the word delete to confirm." });
    expect(db.user.delete).not.toHaveBeenCalled();
    await deleteAccount(null, form({ confirm: " Delete " }));
    expect(db.user.delete).toHaveBeenCalledWith({ where: { id: "c1" } });
    expect(db.pendingSignup.deleteMany).toHaveBeenCalledWith({ where: { email: "c@example.com" } });
    // Enquiries still held for a professional who never joined were not delivered, so they go too.
    expect(db.enquiry.deleteMany).toHaveBeenCalledWith({ where: { userId: "c1", status: "new" } });
    expect(auth.signOut).toHaveBeenCalled();
  });

  it("store concerns only with consent", async () => {
    const f = new FormData();
    f.append("concerns", "shedding");
    await updateSettings(null, f);
    expect(db.consumerProfile.update.mock.calls[0][0].data).toMatchObject({ concerns: [], healthDataConsentAt: null });
  });

  it("only remove the consumer's own saved listing", async () => {
    await unsaveListing(form({ listingId: "l1" }));
    expect(db.savedListing.deleteMany).toHaveBeenCalledWith({ where: { userId: "c1", listingId: "l1" } });
  });
});
