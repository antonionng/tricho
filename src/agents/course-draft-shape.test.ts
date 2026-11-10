import { describe, expect, it } from "vitest";
import { lessonSchema } from "@/content/course-schema";
import { slugForLesson, toAssessment, toBlock, toLesson } from "./course-draft-shape";

// What a model might send back, including mistakes.
const recorded = {
  blocks: [
    { type: "p" as const, text: "The scalp is skin, and it changes with health, age and products." },
    { type: "callout" as const, tone: "caution" as const, title: "To check", text: "Confirm the referral timescale for your area." },
    { type: "case" as const, title: "A client with sudden shedding", scenario: "A client in her thirties...", question: "What do you ask?", discussion: "Ask about the last three months." },
    { type: "terms" as const, terms: [{ term: "Telogen effluvium", meaning: "Shedding after a trigger." }] },
    { type: "p" as const, text: "   " },
    { type: "table" as const, head: ["Sign", "Action"], rows: [["Pustules", "GP"]] },
    { type: "case" as const, title: "Missing its scenario" },
  ],
  check: [
    { prompt: "Which is a red flag?", options: ["Mild dandruff", "A non-healing sore", "Dry ends", "Static"], answer: 1, explain: "A sore that doesn't heal needs a GP to look at it." },
    { prompt: "Broken", options: ["Only one"], answer: 0, explain: "x" },
    { prompt: "Out of range", options: ["a", "b"], answer: 5, explain: "x" },
  ],
  reflection: "Which question will you add to your consultation?",
  takeaways: ["Look", "Ask", "Refer"],
};
const plan = { title: "Why the scalp matters", detail: "What healthy looks like.", minutes: 25.4, objectives: ["Describe a healthy scalp", ""], focus: "x" };

describe("course draft shape", () => {
  it("turns a model's lesson into a valid lesson, dropping what doesn't fit", () => {
    const lesson = toLesson(plan, recorded, 0, new Set());
    expect(lessonSchema.safeParse(lesson).success).toBe(true);
    expect(lesson.slug).toBe("why-the-scalp-matters");
    expect(lesson.minutes).toBe(25);
    expect(lesson.objectives).toEqual(["Describe a healthy scalp"]);
    expect(lesson.blocks.map((b) => b.type)).toEqual(["p", "callout", "case", "terms", "table"]);
    expect(lesson.check.map((q) => q.id)).toEqual(["l1-q1"]);
  });

  it("never lets a block carry a video, image or file", () => {
    expect(toBlock({ type: "p", text: "fine" })).toEqual({ type: "p", text: "fine" });
    expect(toBlock({ type: "callout", text: "No tone given" })).toMatchObject({ tone: "tip" });
  });

  it("keeps lesson addresses unique and clear of the learner routes", () => {
    const taken = new Set(["red-flags"]);
    expect(slugForLesson("Red flags", taken)).toBe("red-flags-2");
    expect(slugForLesson("Assessment", new Set())).toBe("assessment-lesson");
  });

  it("numbers assessment questions and drops broken ones", () => {
    const qs = toAssessment({ questions: recorded.check });
    expect(qs.map((q) => q.id)).toEqual(["a1"]);
  });
});
