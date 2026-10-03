/**
 * The verified badge: what members can send as evidence, who can apply, and
 * how their requests add up to a single status. Pure helpers, safe anywhere.
 */

export const VERIFICATION_KINDS = [
  {
    id: "training",
    label: "Training certificate or diploma",
    description: "A certificate or diploma from a recognised trichology or hair and scalp course, showing your name and the date you qualified.",
  },
  {
    id: "registration",
    label: "Professional registration",
    description: "Proof of registration with a regulator or register, such as the NMC, GMC, CORU or the HCPC, if your wider practice is regulated.",
  },
  {
    id: "membership",
    label: "Membership of a professional body",
    description: "A current membership certificate or letter from a professional body, such as the Institute of Trichologists or the World Trichology Society.",
  },
  {
    id: "insurance",
    label: "Professional indemnity insurance",
    description: "A current insurance certificate that names you and covers the work you offer clients.",
  },
  {
    id: "other",
    label: "Something else",
    description: "Any other document that shows your training or standing, with a short note explaining what it is.",
  },
] as const;

export type VerificationKind = (typeof VERIFICATION_KINDS)[number]["id"];

export function isVerificationKind(value: unknown): value is VerificationKind {
  return VERIFICATION_KINDS.some((k) => k.id === value);
}

export function verificationKindLabel(kind: string) {
  return VERIFICATION_KINDS.find((k) => k.id === kind)?.label ?? "Document";
}

/** The most requests a member can have waiting for review at once. */
export const MAX_PENDING_REQUESTS = 5;

export type ApplyInput = {
  /** A paid Professional or Business member (or someone on the team). */
  professional: boolean;
  /** Has a directory listing, free or claimed, that is live or waiting for review. */
  hasListing: boolean;
  /** Suspended or banned members cannot apply. Muted members can. */
  blocked?: boolean;
};

/** Paid professional members and practitioners with a free directory listing can apply. */
export function canApply(input: ApplyInput) {
  if (input.blocked) return false;
  return input.professional || input.hasListing;
}

export type RequestLike = {
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  reviewedAt?: Date | null;
  reviewNote?: string | null;
};

export type VerificationSummary =
  | { state: "verified"; pending: number }
  | { state: "pending"; pending: number }
  | { state: "rejected"; pending: 0; reason: string | null }
  | { state: "removed"; pending: 0 }
  | { state: "none"; pending: 0 };

/**
 * One status for the member: verified wins, then anything waiting for review,
 * then the most recent decision. An approved request without the badge means
 * the team has since removed it.
 */
export function statusSummary(requests: RequestLike[], isVerified: boolean): VerificationSummary {
  const pending = requests.filter((r) => r.status === "pending").length;
  if (isVerified) return { state: "verified", pending };
  if (pending > 0) return { state: "pending", pending };

  const latest = requests
    .filter((r) => r.status !== "pending")
    .sort((a, b) => (b.reviewedAt ?? b.createdAt).getTime() - (a.reviewedAt ?? a.createdAt).getTime())[0];
  if (!latest) return { state: "none", pending: 0 };
  if (latest.status === "rejected") return { state: "rejected", pending: 0, reason: latest.reviewNote?.trim() || null };
  return { state: "removed", pending: 0 };
}

/** The sentence shown to the member for each status. */
export function statusSentence(summary: VerificationSummary) {
  switch (summary.state) {
    case "verified":
      return "You are verified, so the badge shows on your directory profile, in directory search results and on your chapter page.";
    case "pending":
      return summary.pending === 1
        ? "Your document is waiting for the team to review it, which usually takes a few working days."
        : `Your ${summary.pending} documents are waiting for the team to review them, which usually takes a few working days.`;
    case "rejected":
      return "The team could not verify you from the document you sent, but you are welcome to send another.";
    case "removed":
      return "The team has removed your verified badge. If your circumstances have changed, you can send updated evidence below.";
    case "none":
      return "You have not sent any evidence yet. Once the team has checked it, the verified badge appears on your directory profile.";
  }
}
