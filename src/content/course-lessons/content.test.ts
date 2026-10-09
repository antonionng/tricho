import { describe, expect, it } from "vitest";
import { courses } from "@/content/courses";
import type { CourseContent } from "@/content/course-types";
import { content as scalp } from "./scalp-consultation-for-stylists";
import { content as headSpa } from "./japanese-head-spa-foundations";
import { content as across } from "./working-across-disciplines";

// Imported one by one: the index is server-only.
const bySlug: Record<string, CourseContent> = {
  "scalp-consultation-for-stylists": scalp,
  "japanese-head-spa-foundations": headSpa,
  "working-across-disciplines": across,
};

describe.each(courses.map((c) => [c.slug, c] as const))("%s", (slug, course) => {
  const content = bySlug[slug];

  it("has lessons and an assessment", () => {
    expect(content).toBeTruthy();
    expect(content.lessons.length).toBeGreaterThan(0);
    expect(content.assessment.length).toBeGreaterThanOrEqual(10);
  });

  it("lists the same lessons in the catalogue syllabus", () => {
    expect(course.syllabus.map((s) => s.title)).toEqual(content.lessons.map((l) => l.title));
  });

  it("has unique slugs that don't clash with the learner routes", () => {
    const slugs = content.lessons.map((l) => l.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(["assessment", "certificate"]).not.toContain(s);
  });

  it("has unique question ids with a valid answer each", () => {
    const questions = [...content.lessons.flatMap((l) => l.check), ...content.assessment];
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
    for (const q of questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.explain.length).toBeGreaterThan(20);
    }
  });

  it("gives every lesson a check, a reflection and takeaways", () => {
    for (const l of content.lessons) {
      expect(l.check.length, l.slug).toBeGreaterThanOrEqual(2);
      expect(l.reflection.length, l.slug).toBeGreaterThan(10);
      expect(l.takeaways.length, l.slug).toBeGreaterThanOrEqual(3);
    }
  });
});
