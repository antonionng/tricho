/**
 * Who reads Trichozette editions in full. Everyone else reads the first PUBLIC_PREVIEW_PAGES
 * pages and then meets the gate, which invites them to the cheapest way in.
 *   "open"      everyone, signed in or not
 *   "accounts"  anyone with a Trichollective account, including free directory accounts
 *   "members"   paying members only
 */
export type TrichozetteAccess = "open" | "accounts" | "members";
// Widened on purpose, so code that checks the other settings still type-checks.
export const TRICHOZETTE_ACCESS = "accounts" as TrichozetteAccess;

type Reader = { allowed: boolean; session: unknown; restricted: { status: string } | null };

/** Whether this reader gets every page of an edition. Restricted accounts (other than muted ones) do not. */
export function canReadInFull(reader: Reader) {
  if (TRICHOZETTE_ACCESS === "open" || reader.allowed) return true;
  const blocked = !!reader.restricted && reader.restricted.status !== "muted";
  return TRICHOZETTE_ACCESS === "accounts" && !!reader.session && !blocked;
}

/** What the gate offers: a free account, or membership. */
export const GATE =
  TRICHOZETTE_ACCESS === "members"
    ? {
        lead: "Members read every edition of Trichozette in full, with a new edition each month, Karley's column and the news that matters to your practice.",
        label: "Become a founding member",
        href: (slug: string) => `/founding?next=/trichozette/${slug}`,
        short: "for members",
        kicker: "Members only",
        offers: ["member", "business"] as const,
      }
    : {
        lead: "Create a free Trichollective account to read every edition of Trichozette in full, including the archive from 2023 to 2026, with a new edition each month.",
        label: "Create a free account",
        href: (slug: string) => `/signup?next=/trichozette/${slug}`,
        short: "with a free account",
        kicker: "Free with an account",
        offers: ["account", "member", "business"] as const,
      };
