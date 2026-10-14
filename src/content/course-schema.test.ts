import { describe, expect, it } from "vitest";
import { content as scalp } from "./course-lessons/scalp-consultation-for-stylists";
import { content as headSpa } from "./course-lessons/japanese-head-spa-foundations";
import { content as across } from "./course-lessons/working-across-disciplines";
import { courseContentSchema, emptyCourseContent, parseCourseContent, publishIssues } from "./course-schema";

describe("course schema", () => {
  it.each([
    ["scalp", scalp],
    ["head spa", headSpa],
    ["across disciplines", across],
  ])("accepts the %s course written in code, and finds nothing to fix", (_name, content) => {
    const parsed = courseContentSchema.safeParse(content);
    expect(parsed.success, parsed.success ? "" : JSON.stringify(parsed.error.issues.slice(0, 3))).toBe(true);
    expect(publishIssues(content)).toEqual([]);
  });

  it("rejects malformed content", () => {
    expect(parseCourseContent({ lessons: [{ slug: "Bad Slug" }], assessment: [] })).toBeNull();
    expect(parseCourseContent({ lessons: [], assessment: [], extra: 1 })).not.toBeNull();
    expect(parseCourseContent("nope")).toBeNull();
  });

  it("lists what an empty course needs before review", () => {
    const issues = publishIssues(emptyCourseContent());
    expect(issues).toContain("Add at least one lesson.");
    expect(issues.some((i) => i.includes("final assessment"))).toBe(true);
  });

  it("flags lessons with reserved addresses and unplayable videos", () => {
    const lesson = { ...scalp.lessons[0], slug: "assessment", blocks: [{ type: "video" as const, provider: "youtube" as const, id: "bad" }] };
    const issues = publishIssues({ lessons: [lesson], assessment: scalp.assessment });
    expect(issues.some((i) => i.includes("can't use \"assessment\""))).toBe(true);
    expect(issues.some((i) => i.includes("video link"))).toBe(true);
  });
});
