import type { Href } from "expo-router";

/**
 * Notifications and content link to website paths like /members/community/abc.
 * This turns them into app routes. Anything the app doesn't show opens on the web.
 */
export function appHref(path: string | null | undefined): Href | { web: string } | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) {
    try {
      const url = new URL(path);
      if (!/trichollective\.net$/.test(url.hostname)) return { web: path };
      path = url.pathname + url.search;
    } catch {
      return { web: path };
    }
  }
  const clean = path.split("#")[0];
  if (!clean.startsWith("/members")) return { web: clean };
  const rest = clean.replace(/^\/members\/?/, "");
  if (!rest) return "/";
  return `/${rest}` as Href;
}
