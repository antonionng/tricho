/**
 * First-touch attribution, kept in the visitor's own browser for 60 days:
 * ?utm_source=ireland (or ?src=ireland) on any landing URL is remembered and sent
 * with sign-ups, listings and checkouts. Never used for anything but counting.
 *
 * The value lives in localStorage for the browser and in a first-party cookie
 * (tc_src) so the server can read it when an account is created by email link.
 */
const KEY = "tc_source";
const TTL = 60 * 24 * 60 * 60 * 1000;

/** First-party cookie mirroring the remembered source, readable on the server. */
export const SOURCE_COOKIE = "tc_src";

/** Names for the sources we know, for Studio and owner emails. */
export const SOURCE_LABELS: Record<string, string> = {
  ireland: "Trichollective Ireland",
  // The event was briefly called Trichollective Dublin; its QR codes still count here.
  dublin: "Trichollective Ireland",
  instagram: "Instagram",
  facebook: "Facebook",
  founding: "Founding page",
};

/** A readable name for a source, falling back to the raw value. */
export function sourceLabel(v: string | null | undefined) {
  if (!v) return null;
  return SOURCE_LABELS[v] ?? v;
}

/** Lowercase letters, digits, dashes and underscores only, at most 40 characters. */
export function cleanSource(v: string | null | undefined) {
  return v ? v.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) || null : null;
}

const clean = cleanSource;

function readCookie(): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${SOURCE_COOKIE}=([^;]*)`));
  return m ? clean(decodeURIComponent(m[1])) : null;
}

/** First touch wins: the cookie is only written when the visitor has none. */
function writeCookie(v: string | null) {
  if (!v) return;
  try {
    if (readCookie()) return;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${SOURCE_COOKIE}=${encodeURIComponent(v)}; Max-Age=${TTL / 1000}; Path=/; SameSite=Lax${secure}`;
  } catch {}
}

function stored(): { v: string; t: number } | null {
  const existing = JSON.parse(localStorage.getItem(KEY) || "null") as { v: string; t: number } | null;
  return existing && Date.now() - existing.t < TTL ? existing : null;
}

export function captureSource() {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams(window.location.search);
  const fromUrl = clean(p.get("utm_source") || p.get("src"));
  try {
    const existing = stored();
    if (existing) {
      writeCookie(existing.v);
      return;
    }
    if (fromUrl) localStorage.setItem(KEY, JSON.stringify({ v: fromUrl, t: Date.now() }));
  } catch {
    // Storage can be blocked; attribution is a nice-to-have.
  }
  writeCookie(fromUrl);
}

export function getSource(): string | null {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.search);
  const fromUrl = clean(p.get("utm_source") || p.get("src"));
  if (fromUrl) return fromUrl;
  try {
    const existing = stored();
    if (existing) return existing.v;
  } catch {}
  try {
    return readCookie();
  } catch {
    return null;
  }
}

/** Remember a source for this visitor unless they already have one (first touch wins). */
export function rememberSource(value: string) {
  if (typeof window === "undefined") return;
  const v = clean(value);
  try {
    const existing = stored();
    if (existing) {
      writeCookie(existing.v);
      return;
    }
    localStorage.setItem(KEY, JSON.stringify({ v, t: Date.now() }));
  } catch {}
  writeCookie(v);
}
