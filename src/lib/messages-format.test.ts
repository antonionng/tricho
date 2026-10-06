import { describe, expect, it } from "vitest";
import { summarizeThread, threadPreview, threadTitle } from "./messages-format";

const ana = { id: "ana", name: "Ana Ruiz", image: null };
const row = (lastReadAt: Date | null, messages: { body: string; createdAt: Date; senderId: string }[]) => ({
  lastReadAt,
  conversation: { id: "c1", updatedAt: new Date("2026-01-01T09:00:00Z"), members: [{ user: ana }], messages },
});

describe("summarizeThread", () => {
  const at = new Date("2026-01-02T10:00:00Z");

  it("is unread when someone else wrote after the member last read it", () => {
    const t = summarizeThread(row(new Date("2026-01-02T09:00:00Z"), [{ body: "Hi", createdAt: at, senderId: "ana" }]), "me");
    expect(t.unread).toBe(true);
    expect(t.at).toEqual(at);
    expect(t.others).toEqual([ana]);
  });

  it("is unread when the member has never opened it", () => {
    expect(summarizeThread(row(null, [{ body: "Hi", createdAt: at, senderId: "ana" }]), "me").unread).toBe(true);
  });

  it("is read when the member sent the last message or read it since", () => {
    expect(summarizeThread(row(null, [{ body: "Hi", createdAt: at, senderId: "me" }]), "me").unread).toBe(false);
    expect(summarizeThread(row(new Date("2026-01-02T11:00:00Z"), [{ body: "Hi", createdAt: at, senderId: "ana" }]), "me").unread).toBe(false);
  });

  it("falls back to the conversation's date when it has no messages", () => {
    const t = summarizeThread(row(null, []), "me");
    expect(t.unread).toBe(false);
    expect(t.last).toBeUndefined();
    expect(t.at).toEqual(new Date("2026-01-01T09:00:00Z"));
  });
});

describe("threadTitle and threadPreview", () => {
  it("names everyone else, or says it is just you", () => {
    expect(threadTitle([{ name: "Ana Ruiz" }, { name: null }])).toBe("Ana Ruiz, Member");
    expect(threadTitle([])).toBe("Just you");
  });

  it("prefixes the member's own last message", () => {
    expect(threadPreview({ body: "See you there", senderId: "me" }, "me")).toBe("You: See you there");
    expect(threadPreview({ body: "See you there", senderId: "ana" }, "me")).toBe("See you there");
    expect(threadPreview(undefined, "me")).toBe("No messages yet");
  });
});
