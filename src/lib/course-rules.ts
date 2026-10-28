import { randomInt } from "node:crypto";
import type { Course } from "@/content/courses";
import type { Question } from "@/content/course-types";

/** Course rules with no database, so they can be tested on their own. */

export const PASS_MARK = 0.8;
/** Stripe's minimum Checkout Session lifetime is 30 minutes. */
export const CHECKOUT_EXPIRES_MINUTES = 31;

export type CoursePriceType = "member" | "guest" | "free";

export function coursePrice(course: Pick<Course, "priceGBP" | "memberPriceGBP">, isMember: boolean) {
  const pounds = isMember ? course.memberPriceGBP : course.priceGBP;
  const amountPence = Math.max(0, Math.round((Number.isFinite(pounds) ? pounds : 0) * 100));
  const priceType: CoursePriceType = amountPence === 0 ? "free" : isMember ? "member" : "guest";
  return { amountPence, priceType };
}

export type Graded = {
  score: number;
  total: number;
  passed: boolean;
  needed: number;
  results: { id: string; chosen: number | null; correct: boolean; answer: number; explain: string }[];
};

/** Marks a set of answers. Unanswered or out-of-range answers count as wrong. */
export function grade(questions: Question[], answers: Record<string, unknown>): Graded {
  const results = questions.map((q) => {
    const raw = Number(answers[q.id]);
    const chosen = Number.isInteger(raw) && raw >= 0 && raw < q.options.length ? raw : null;
    return { id: q.id, chosen, correct: chosen === q.answer, answer: q.answer, explain: q.explain };
  });
  const score = results.filter((r) => r.correct).length;
  const total = questions.length;
  const needed = Math.ceil(total * PASS_MARK);
  return { score, total, needed, passed: total > 0 && score >= needed, results };
}

// No 0/O, 1/I/L, so a reference read aloud or typed from paper is unambiguous.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** A public certificate reference, e.g. "TC-7K2M-Q9XD". */
export function certificateReference() {
  const pick = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `TC-${pick()}-${pick()}`;
}

export function isCertificateReference(value: string) {
  return /^TC-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/.test(value);
}

