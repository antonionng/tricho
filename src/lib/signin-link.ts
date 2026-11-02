/**
 * Mail scanners (Microsoft Safe Links, Mimecast, Proofpoint and others) open every
 * link in an email to check it, which used up the one-time sign-in token before the
 * member could press it. So the email links to /login/confirm, which only spends the
 * token when a person presses the button there. Scanners load pages but don't submit forms.
 *
 * The confirm URL used to nest the whole Auth.js callback as `?link=…`. iOS Mail and
 * Gmail often decode that once, so `&token=` and `&email=` become sibling query params
 * and the nested link no longer has a token — the page then said the link "isn't complete".
 * New emails put token, email and the return path as first-class query params instead.
 */
import { randomInt } from "node:crypto";
import { cleanEmail } from "@/lib/signin-email";

export const CONFIRM_PATH = "/login/confirm";
export const AUTH_CALLBACK_PATH = "/api/auth/callback/resend";
const CALLBACK_PREFIX = "/api/auth/callback/";

export type SignInSearch = {
  link?: string;
  token?: string;
  email?: string;
  callbackUrl?: string;
};

export type ResolvedSignIn = {
  token: string;
  email: string;
  callbackUrl: string;
};

/** Six-digit code, no leading zeros, so it is easy to read and type on a phone. */
export function generateSignInCode() {
  return String(randomInt(100000, 1_000_000));
}

/** Same-site path only, so a crafted return address cannot send people elsewhere. */
export function safeReturnPath(next: unknown, fallback = "/members") {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

/** Auth.js tokens are either our 6-digit code or the older long random string. */
export function cleanToken(v: unknown) {
  if (typeof v !== "string") return null;
  const t = v.trim().replace(/[\s-]/g, "");
  if (t.length < 6 || t.length > 200) return null;
  return /^[A-Za-z0-9_-]+$/.test(t) ? t : null;
}

/** www and the bare domain are the same site. Apex currently redirects to www. */
export function hostAliases(host: string): string[] {
  const [name, port] = splitHostPort(host.toLowerCase());
  const suffix = port ? `:${port}` : "";
  if (name === "localhost") return [`${name}${suffix}`];
  if (name.startsWith("www.")) return [`${name}${suffix}`, `${name.slice(4)}${suffix}`];
  return [`${name}${suffix}`, `www.${name}${suffix}`];
}

function splitHostPort(host: string): [string, string | undefined] {
  const i = host.lastIndexOf(":");
  if (i > 0 && /^\d+$/.test(host.slice(i + 1))) return [host.slice(0, i), host.slice(i + 1)];
  return [host, undefined];
}

/** Request host, its www/apex twin, and any hosts named in AUTH_URL / site URL env vars. */
export function allowedHostsFor(requestHost: string | null, extraUrls: Array<string | undefined> = []): string[] {
  const hosts = new Set<string>();
  if (requestHost) for (const h of hostAliases(requestHost)) hosts.add(h);
  for (const raw of extraUrls) {
    if (!raw) continue;
    try {
      for (const h of hostAliases(new URL(raw).host)) hosts.add(h);
    } catch {
      // Ignore unparseable env values.
    }
  }
  return [...hosts];
}

function configuredSiteUrls() {
  return [process.env.AUTH_URL, process.env.NEXTAUTH_URL, process.env.NEXT_PUBLIC_SITE_URL, process.env.NEXT_PUBLIC_APP_URL];
}

export function allowedAuthHosts(requestHost: string | null) {
  return allowedHostsFor(requestHost, configuredSiteUrls());
}

/**
 * Confirm page on the same origin as the Auth.js URL, with token, email and return
 * path as first-class query params so email clients cannot split a nested URL.
 */
export function confirmLinkFor(callbackUrl: string): string {
  const src = new URL(callbackUrl);
  const dest = new URL(CONFIRM_PATH, src.origin);
  const token = src.searchParams.get("token");
  const email = src.searchParams.get("email");
  const next = src.searchParams.get("callbackUrl") || "/members";
  if (token) dest.searchParams.set("token", token);
  if (email) dest.searchParams.set("email", email);
  dest.searchParams.set("callbackUrl", next);
  return dest.toString();
}

function parseAuthCallback(link: string, allowedHosts: string[]): Partial<ResolvedSignIn> | null {
  if (link.length > 2000) return null;
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.hostname !== "localhost") return null;
  if (!url.pathname.startsWith(CALLBACK_PREFIX)) return null;
  if (allowedHosts.length && !allowedHosts.includes(url.host)) return null;
  return {
    token: cleanToken(url.searchParams.get("token")) ?? undefined,
    email: cleanEmail(url.searchParams.get("email")) ?? undefined,
    callbackUrl: safeReturnPath(url.searchParams.get("callbackUrl")),
  };
}

/**
 * Rebuild a sign-in attempt from whatever the email client actually delivered:
 * first-class params, a nested Auth.js `link`, or a nested link whose token and
 * email leaked into sibling query params after one decode.
 */
export function resolveSignInFromSearch(search: SignInSearch, allowedHosts: string[]): ResolvedSignIn | null {
  const token = cleanToken(search.token);
  const email = cleanEmail(search.email);
  const callbackUrl = safeReturnPath(search.callbackUrl);
  const fromLink = typeof search.link === "string" ? parseAuthCallback(search.link, allowedHosts) : null;

  const resolvedToken = token ?? fromLink?.token;
  const resolvedEmail = email ?? fromLink?.email;
  if (!resolvedToken || !resolvedEmail) return null;

  return {
    token: resolvedToken,
    email: resolvedEmail,
    callbackUrl: fromLink?.callbackUrl && search.callbackUrl == null ? fromLink.callbackUrl : callbackUrl,
  };
}

/**
 * Only an Auth.js email callback on one of our own hosts may come through, so the
 * confirm page can never be used to send someone to another site.
 */
export function safeCallbackLink(link: unknown, allowedHosts: string[]): string | null {
  if (typeof link !== "string") return null;
  const parsed = parseAuthCallback(link, allowedHosts);
  if (!parsed?.token) return null;
  return new URL(link).toString();
}

/** Relative Auth.js callback, so the session cookie is set on the host the member is on. */
export function authCallbackHref(signIn: ResolvedSignIn) {
  const q = new URLSearchParams();
  q.set("callbackUrl", signIn.callbackUrl);
  q.set("token", signIn.token);
  q.set("email", signIn.email);
  return `${AUTH_CALLBACK_PATH}?${q}`;
}
