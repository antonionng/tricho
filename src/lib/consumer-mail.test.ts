import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  enquiry: { findMany: vi.fn() },
  user: { findMany: vi.fn() },
}));
const mail = vi.hoisted(() => ({ deliverOnce: vi.fn(async () => true) }));

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/mail/send", () => mail);

import { consumerDigestRecipients, emailEnquiryUpdates } from "./consumer-mail";

beforeEach(() => vi.clearAllMocks());

describe("emailEnquiryUpdates", () => {
  it("only looks up enquiries linked to an active consumer", async () => {
    db.enquiry.findMany.mockResolvedValue([]);
    await emailEnquiryUpdates(["e1"], "delivered");
    const where = db.enquiry.findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({ id: { in: ["e1"] }, user: { accountType: "consumer", accessStatus: "active" } });
  });

  it("emails each consumer once per change, on the activity list, to their account email", async () => {
    db.enquiry.findMany.mockResolvedValue([{ id: "e1", listing: { name: "Niamh Walsh" }, user: { name: "Aoife", email: "aoife@example.com" } }]);
    expect(await emailEnquiryUpdates(["e1"], "closed")).toBe(1);
    const [ref, to, subject, , opts] = mail.deliverOnce.mock.calls[0] as unknown as [string, string, string, unknown, { list: string }];
    expect(ref).toBe("enquiry-update:e1:closed");
    expect(to).toBe("aoife@example.com");
    expect(subject).toContain("Niamh Walsh");
    expect(opts.list).toBe("activity");
  });

  it("does nothing for an empty list and never throws", async () => {
    expect(await emailEnquiryUpdates([], "delivered")).toBe(0);
    expect(db.enquiry.findMany).not.toHaveBeenCalled();
    db.enquiry.findMany.mockRejectedValue(new Error("down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await emailEnquiryUpdates(["e1"], "delivered")).toBe(0);
  });
});

describe("consumerDigestRecipients", () => {
  it("is only consumers who opted in, with the consent recorded", async () => {
    db.user.findMany.mockResolvedValue([{ email: "A@example.com" }, { email: "a@example.com" }, { email: "team@trichollective.local" }]);
    expect(await consumerDigestRecipients()).toEqual(["a@example.com"]);
    expect(db.user.findMany.mock.calls[0][0].where).toMatchObject({
      accountType: "consumer",
      emailUpdates: true,
      accessStatus: "active",
      consumerProfile: { marketingConsentAt: { not: null } },
    });
  });
});
