import { describe, expect, it } from "vitest";
import { cursorPage, nestComments, participationRefusal, postingNotice, replyNotice } from "./community-rules";

describe("nestComments", () => {
  it("hangs replies under their comment and keeps order", () => {
    const c = [
      { id: "a", parentId: null },
      { id: "b", parentId: "a" },
      { id: "c", parentId: null },
      { id: "d", parentId: "a" },
    ];
    expect(nestComments(c).map((t) => [t.comment.id, t.replies.map((r) => r.id)])).toEqual([
      ["a", ["b", "d"]],
      ["c", []],
    ]);
  });

  it("lifts a reply whose parent is hidden to the top level", () => {
    expect(nestComments([{ id: "b", parentId: "gone" }]).map((t) => t.comment.id)).toEqual(["b"]);
  });
});

describe("cursorPage", () => {
  it("returns a cursor only when there is another page", () => {
    const rows = [{ id: "1" }, { id: "2" }, { id: "3" }];
    expect(cursorPage(rows, 2)).toEqual({ items: [{ id: "1" }, { id: "2" }], nextCursor: "2" });
    expect(cursorPage(rows, 3)).toEqual({ items: rows, nextCursor: null });
    expect(cursorPage([], 3)).toEqual({ items: [], nextCursor: null });
  });
});

describe("notices", () => {
  it("explains why posting is closed", () => {
    expect(postingNotice({ archived: true }, null)).toMatch(/archived/);
    expect(postingNotice({}, "brand")).toMatch(/business accounts/);
    expect(postingNotice({}, "clinical")).toMatch(/Professional members/);
  });

  it("explains why replies are closed", () => {
    expect(replyNotice({ label: "Wins", archived: true })).toMatch(/Wins has been archived/);
    expect(replyNotice({ label: "Case Room" })).toMatch(/Replies in Case Room/);
  });

  it("tells restricted members why they cannot take part", () => {
    expect(participationRefusal({ status: "banned", until: null })).toMatch(/closed/);
    expect(participationRefusal({ status: "muted", until: null })).toMatch(/paused for your account\.$/);
    expect(participationRefusal({ status: "muted", until: new Date("2026-11-03T12:00:00Z") })).toMatch(/until 3 November/);
    expect(participationRefusal({ status: "suspended", until: new Date("2026-11-03T12:00:00Z") })).toMatch(/paused until 3 November/);
  });
});
