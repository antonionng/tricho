import type { EditionStatus } from "@prisma/client";
import type { Edition } from "@/content/gazette";

export const STATUS_LABEL: Record<EditionStatus, string> = {
  generating: "Being written",
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
  withdrawn: "Withdrawn",
};

export const STATUS_TONE: Record<EditionStatus, "default" | "ink" | "positive" | "warn" | "danger"> = {
  generating: "warn",
  draft: "default",
  scheduled: "ink",
  published: "positive",
  withdrawn: "danger",
};

/** The label fields of a row, typed as an Edition expects them. */
export function labelFields(r: { number: number; series: string; period: string | null; focus: string | null }) {
  return {
    number: r.number,
    series: r.series === "archive" ? ("archive" as const) : ("current" as const),
    period: r.period ?? undefined,
    focus: (["review", "cosmetic", "clinical", "medical"].includes(r.focus ?? "") ? r.focus : undefined) as Edition["focus"],
  };
}
