import { HUB_PATH } from "@/config/consumer";

/**
 * Professional and consumer accounts live in separate areas. Edge-safe: the middleware
 * imports this, so it must not import Prisma.
 */
export type AccountTypeId = "professional" | "consumer";

export function isConsumer(user: { accountType?: string | null } | null | undefined) {
  return user?.accountType === "consumer";
}

function under(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`);
}

/** The professional-only areas a consumer may never open. */
export function isProfessionalArea(pathname: string) {
  return under(pathname, "/members") || under(pathname, "/pro");
}

export function isHubArea(pathname: string) {
  return under(pathname, HUB_PATH);
}

/**
 * Where a signed-in person should go instead of this page, or null if they may stay.
 * Consumers are sent from the member area to the hub, and professionals the other way.
 */
export function areaRedirect(pathname: string, accountType: string | null | undefined): string | null {
  if (accountType === "consumer" && isProfessionalArea(pathname)) return HUB_PATH;
  if (accountType !== "consumer" && isHubArea(pathname)) return "/members";
  return null;
}

/** Prisma filter for professional accounts, so Studio lists, counts and member emails leave consumers out. */
export const PROFESSIONAL_ACCOUNTS = { accountType: "professional" } as const;
