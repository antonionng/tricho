import { describe, expect, it } from "vitest";
import { reviewNoteError, reviewOutcome, statusAfterSubmit, submitBlocker } from "./course-review";

describe("course review", () => {
  it("blocks a second submission and incomplete courses", () => {
    expect(submitBlocker({ status: "draft" }, true, [])).toMatch(/already waiting/);
    expect(submitBlocker({ status: "draft" }, false, ["a", "b"])).toMatch(/2 things/);
    expect(submitBlocker({ status: "draft" }, false, [])).toBeNull();
  });

  it("keeps a live course live while an update is reviewed", () => {
    expect(statusAfterSubmit("draft")).toBe("in_review");
    expect(statusAfterSubmit("published")).toBe("published");
    expect(statusAfterSubmit("unlisted")).toBe("unlisted");
  });

  it("publishes on approval, and keeps an unlisted course unlisted", () => {
    expect(reviewOutcome("approve", { status: "in_review", hasPublished: false })).toEqual({ version: "approved", course: "published" });
    expect(reviewOutcome("approve", { status: "unlisted", hasPublished: true })).toEqual({ version: "approved", course: "unlisted" });
  });

  it("sends a new course back to draft, but leaves a live course on sale", () => {
    expect(reviewOutcome("changes", { status: "in_review", hasPublished: false })).toEqual({ version: "changes_requested", course: "draft" });
    expect(reviewOutcome("reject", { status: "published", hasPublished: true })).toEqual({ version: "rejected", course: "published" });
  });

  it("needs a note for anything but an approval", () => {
    expect(reviewNoteError("approve", "")).toBeNull();
    expect(reviewNoteError("changes", "fix")).not.toBeNull();
    expect(reviewNoteError("reject", "This repeats another course almost word for word.")).toBeNull();
  });
});
