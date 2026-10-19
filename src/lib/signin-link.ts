/**
 * Mail scanners (Microsoft Safe Links, Mimecast, Proofpoint and others) open every
 * link in an email to check it, which used up the one-time sign-in token before the
 * member could press it. So the email links to /login/confirm, which only spends the
 * token when a person presses the button there. Scanners load pages but don't submit forms.
 */
export const CONFIRM_PATH = "/login/confirm";
const CALLBACK_PREFIX = "/api/auth/callback/";

/** The confirm page on the same site as the Auth.js link, carrying that link. */
export function confirmLinkFor(callbackUrl: string): string {
  const { origin } = new URL(callbackUrl);
  return `${origin}${CONFIRM_PATH}?link=${encodeURIComponent(callbackUrl)}`;
}

/**
 * Only an Auth.js email callback on one of our own hosts may come through, so the
 * confirm page can never be used to send someone to another site.
 */
export function safeCallbackLink(link: unknown, allowedHosts: string[]): string | null {
  if (typeof link !== "string" || link.length > 2000) return null;
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.hostname !== "localhost") return null;
  if (!allowedHosts.includes(url.host)) return null;
  if (!url.pathname.startsWith(CALLBACK_PREFIX) || !url.searchParams.get("token")) return null;
  return url.toString();
}
