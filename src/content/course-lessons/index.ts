import "server-only";
import type { CourseContent } from "@/content/course-types";
import { content as scalpConsultation } from "./scalp-consultation-for-stylists";
import { content as headSpa } from "./japanese-head-spa-foundations";
import { content as acrossDisciplines } from "./working-across-disciplines";

/**
 * Lessons and assessments by course slug. This module holds the assessment
 * answers, so import it only on the server.
 */
export const courseContent: Record<string, CourseContent> = {
  "scalp-consultation-for-stylists": scalpConsultation,
  "japanese-head-spa-foundations": headSpa,
  "working-across-disciplines": acrossDisciplines,
};
