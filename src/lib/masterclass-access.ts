/**
 * Live monthly masterclasses (and their recordings) are included from
 * Professional up: Professional, Business, Premium Business partners and
 * their seats. Community members and free accounts can still attend a
 * live session by buying a guest ticket when the event has one.
 *
 * Case rounds stay with every paying member. They are peer discussion,
 * not a taught session, and they have no guest-ticket path today.
 */

export function isMasterclassEventKind(kind: string | null | undefined) {
  return kind === "masterclass";
}

/** Professional, Business (including Premium) and admin. Community is out. */
export function hasMasterclassAccess(input: {
  isActive?: boolean;
  tierId?: string | null;
  role?: string | null;
}) {
  if (input.role === "admin") return true;
  if (!input.isActive) return false;
  return input.tierId === "professional" || input.tierId === "business";
}

/**
 * Whether this buyer pays the member price and may RSVP as a member.
 * Existing bookings are left intact even when this returns false.
 */
export function includedAsMemberForEvent(
  kind: string | null | undefined,
  membership: { isActive?: boolean; tierId?: string | null },
  role?: string | null
) {
  if (role === "admin") return true;
  if (!membership.isActive) return false;
  if (isMasterclassEventKind(kind)) return hasMasterclassAccess({ ...membership, role });
  return true;
}

/**
 * Education pieces that are masterclass recordings. Studio should use kind
 * "recording" or "masterclass"; a title that names a masterclass is also gated.
 */
export function isMasterclassRecording(piece: { kind: string; title?: string | null }) {
  const kind = piece.kind.trim().toLowerCase();
  if (kind === "recording" || kind === "masterclass") return true;
  return /\bmasterclass\b/i.test(piece.title ?? "");
}
