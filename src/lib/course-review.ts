import type { CourseState, CourseVersionStatus } from "@prisma/client";

/**
 * The review rules for courses built on the site, kept free of the database so
 * they can be tested on their own.
 *
 *  draft ──submit──▶ in_review ──approve──▶ published ⇄ unlisted
 *                        │                       │
 *                 changes / reject          edit + submit (the published
 *                        ▼                  version stays live until the
 *                      draft                new one is approved)
 */

export type ReviewDecision = "approve" | "changes" | "reject";

export const DECISION_LABEL: Record<ReviewDecision, string> = {
  approve: "approved",
  changes: "sent back for changes",
  reject: "rejected",
};

/** Whether a new version can be sent for review now. */
export function submitBlocker(course: { status: CourseState }, pendingVersion: boolean, issues: string[]): string | null {
  if (pendingVersion) return "A version of this course is already waiting for review.";
  if (issues.length) return `There ${issues.length === 1 ? "is 1 thing" : `are ${issues.length} things`} to fix before this course can go for review.`;
  return null;
}

/** The course's status once a version is submitted. A live course stays live while the update is reviewed. */
export function statusAfterSubmit(current: CourseState): CourseState {
  return current === "published" || current === "unlisted" ? current : "in_review";
}

/** What a review decision does to the version and to the course. */
export function reviewOutcome(
  decision: ReviewDecision,
  course: { status: CourseState; hasPublished: boolean }
): { version: CourseVersionStatus; course: CourseState } {
  if (decision === "approve") return { version: "approved", course: course.status === "unlisted" ? "unlisted" : "published" };
  const version: CourseVersionStatus = decision === "changes" ? "changes_requested" : "rejected";
  // A course that is already live keeps its approved version on sale.
  return { version, course: course.hasPublished ? (course.status === "unlisted" ? "unlisted" : "published") : "draft" };
}

/** A review note is needed whenever the decision isn't an approval. */
export function reviewNoteError(decision: ReviewDecision, note: string): string | null {
  if (decision === "approve") return null;
  return note.trim().length >= 10 ? null : "Please write a note of at least a sentence so the author knows what to change.";
}
