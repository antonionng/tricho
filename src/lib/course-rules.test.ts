import { describe, expect, it } from "vitest";
import { certificateReference, coursePrice, grade, isCertificateReference, PASS_MARK } from "./course-rules";

const q = (id: string, answer: number) => ({ id, prompt: id, options: ["a", "b", "c", "d"], answer, explain: "" });

describe("coursePrice", () => {
  it("charges members the member price and everyone else the full price", () => {
    expect(coursePrice({ priceGBP: 79, memberPriceGBP: 49 }, true)).toEqual({ amountPence: 4900, priceType: "member" });
    expect(coursePrice({ priceGBP: 79, memberPriceGBP: 49 }, false)).toEqual({ amountPence: 7900, priceType: "guest" });
  });
  it("treats a zero price as free", () => {
    expect(coursePrice({ priceGBP: 49, memberPriceGBP: 0 }, true)).toEqual({ amountPence: 0, priceType: "free" });
  });
});

describe("grade", () => {
  const questions = Array.from({ length: 10 }, (_, i) => q(`q${i}`, i % 4));
  const right = Object.fromEntries(questions.map((x) => [x.id, x.answer]));

  it("passes at the pass mark and not below", () => {
    const needed = Math.ceil(10 * PASS_MARK);
    const wrong = (n: number) => ({ ...right, ...Object.fromEntries(questions.slice(0, n).map((x) => [x.id, (x.answer + 1) % 4])) });
    expect(grade(questions, wrong(10 - needed)).passed).toBe(true);
    expect(grade(questions, wrong(11 - needed)).passed).toBe(false);
  });
  it("counts missing, malformed and out-of-range answers as wrong", () => {
    const result = grade([q("a", 0), q("b", 1), q("c", 2)], { a: "0", b: 9, c: "x" });
    expect(result.score).toBe(1);
    expect(result.results.map((r) => r.chosen)).toEqual([0, null, null]);
  });
  it("never passes an empty assessment", () => {
    expect(grade([], {}).passed).toBe(false);
  });
});

describe("certificate references", () => {
  it("are well formed and avoid look-alike characters", () => {
    for (let i = 0; i < 200; i++) {
      const ref = certificateReference();
      expect(isCertificateReference(ref)).toBe(true);
      expect(ref.slice(3)).not.toMatch(/[01OIL]/);
    }
  });
  it("rejects anything else", () => {
    expect(isCertificateReference("TC-0000-0000")).toBe(false);
    expect(isCertificateReference("<script>")).toBe(false);
  });
});
