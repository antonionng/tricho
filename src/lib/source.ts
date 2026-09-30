/**
 * First-touch attribution, kept in the visitor's own browser for 60 days:
 * ?utm_source=dublin (or ?src=dublin) on any landing URL is remembered and sent
 * with sign-ups, listings and checkouts. Never used for anything but counting.
 */
const KEY = "tc_source";
const TTL = 60 * 24 * 60 * 60 * 1000;

function clean(v: string | null) {
  return v ? v.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) || null : null;
}

export function captureSource() {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams(window.location.search);
  const fromUrl = clean(p.get("utm_source") || p.get("src"));
  try {
    const existing = JSON.parse(localStorage.getItem(KEY) || "null") as { v: string; t: number } | null;
    if (existing && Date.now() - existing.t < TTL) return;
    if (fromUrl) localStorage.setItem(KEY, JSON.stringify({ v: fromUrl, t: Date.now() }));
  } catch {
    // Storage can be blocked; attribution is a nice-to-have.
  }
}

export function getSource(): string | null {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.search);
  const fromUrl = clean(p.get("utm_source") || p.get("src"));
  if (fromUrl) return fromUrl;
  try {
    const existing = JSON.parse(localStorage.getItem(KEY) || "null") as { v: string; t: number } | null;
    if (existing && Date.now() - existing.t < TTL) return existing.v;
  } catch {}
  return null;
}

/** Remember a source for this visitor unless they already have one (first touch wins). */
export function rememberSource(value: string) {
  if (typeof window === "undefined") return;
  try {
    const existing = JSON.parse(localStorage.getItem(KEY) || "null") as { v: string; t: number } | null;
    if (existing && Date.now() - existing.t < TTL) return;
    localStorage.setItem(KEY, JSON.stringify({ v: clean(value), t: Date.now() }));
  } catch {}
}
