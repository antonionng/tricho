/** The AI writer's working state, stored on BlogArticle.ai. Pure, so Studio's client components can read it. */

export type WriterStep = "planning" | "researching" | "writing" | "checking" | "revising" | "done" | "failed";

export const STEP_ORDER: WriterStep[] = ["planning", "researching", "writing", "checking", "revising", "done"];

export const STEP_LABEL: Record<WriterStep, string> = {
  planning: "Planning the post and choosing sources",
  researching: "Reading the sources",
  writing: "Writing the first draft",
  checking: "Fact-checking against the sources",
  revising: "Fixing what the check found",
  done: "Ready to edit",
  failed: "Stopped",
};

export type WriterPlan = {
  searchIntent: string;
  titleOptions: string[];
  outline: { heading: string; covers: string }[];
  sourceUrls: string[];
};

export type WriterReview = {
  verdict: "ready" | "needs-work";
  summary: string;
  unsupported: { claim: string; why: string }[];
  safety: string[];
  style: string[];
};

export type WriterResearch = { url: string; label: string; ok: boolean; error?: string; chars: number };

export type WriterState = {
  step: WriterStep;
  /** The step to resume from after a failure. */
  failedAt?: WriterStep;
  /** An editor's instruction for a rewrite. */
  note?: string;
  plan?: WriterPlan;
  research?: WriterResearch[];
  /** The text read from each source, kept so a resumed run doesn't fetch again. Server only. */
  extracts?: { url: string; label: string; text: string }[];
  review?: WriterReview;
  /** What the revision pass fixed. */
  fixed?: string[];
  error?: string;
  model?: string;
  lockedUntil?: string;
  startedAt?: string;
  finishedAt?: string;
};

export function writerState(ai: unknown): WriterState | null {
  return ai && typeof ai === "object" && !Array.isArray(ai) && "step" in ai ? (ai as WriterState) : null;
}

export function isWriting(ai: unknown) {
  const s = writerState(ai);
  return !!s && s.step !== "done" && s.step !== "failed";
}
