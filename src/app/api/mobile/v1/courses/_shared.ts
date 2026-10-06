import "server-only";
import type { Course } from "@/content/courses";
import { images, img } from "@/content/images";
import { coursePrice } from "@/lib/courses";
import { fail } from "@/lib/mobile/api";

/**
 * What the app shows about a course before anyone opens it: the same facts as
 * the course card on the Learn page and the outline on the course page.
 */
export function courseCard(course: Course, isMember: boolean) {
  const price = coursePrice(course, isMember);
  return {
    slug: course.slug,
    title: course.title,
    summary: course.summary,
    audience: course.audience,
    discipline: course.discipline,
    format: course.format,
    hours: course.hours,
    status: course.status,
    image: img(images[course.imageKey], 900),
    priceGBP: course.priceGBP,
    memberPriceGBP: course.memberPriceGBP,
    /** What this member would pay. The app never sells a place; see the README. */
    yourPrice: { amountPence: price.amountPence, priceType: price.priceType },
    reviewer: course.reviewer ?? null,
  };
}

export const notEnrolled = () => fail(403, "You need a place on this course to open its lessons.", { reason: "not-enrolled" });

/** Answers sent from the app as { questionId: optionIndex }. Anything else is dropped. */
export function answersFrom(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const n = Number(raw);
    if (Number.isInteger(n)) out[key] = n;
  }
  return out;
}
