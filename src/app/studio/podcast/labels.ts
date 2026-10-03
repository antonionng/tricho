import type { EpisodeStatus } from "@prisma/client";

export const STATUS_LABEL: Record<EpisodeStatus, string> = {
  planning: "Planning",
  draft: "Draft",
  published: "Published",
  withdrawn: "Withdrawn",
};

export const STATUS_TONE: Record<EpisodeStatus, "default" | "positive" | "warn" | "danger"> = {
  planning: "default",
  draft: "warn",
  published: "positive",
  withdrawn: "danger",
};

export const TRANSCRIPT_LABEL: Record<string, string> = {
  none: "No transcript",
  transcribing: "Transcribing",
  ready: "Transcript ready",
  failed: "Transcription failed",
};
