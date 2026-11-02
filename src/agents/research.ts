import "server-only";
import { isIP } from "node:net";

export type SourceExtract = { url: string; label: string; ok: boolean; text: string; error?: string };

const MAX_BYTES = 2_000_000;
const MAX_CHARS = 14_000;

/**
 * Only public https pages. Staff can paste URLs into a brief, so this refuses
 * anything that could reach our own network: IP addresses, localhost and
 * internal-looking hostnames.
 */
export function isFetchableUrl(raw: string) {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" || u.username || u.password || (u.port && u.port !== "443")) return false;
  const host = u.hostname.toLowerCase().replace(/\.$/, "");
  if (!host.includes(".") || isIP(host.replace(/^\[|\]$/g, ""))) return false;
  return !/(^|\.)(localhost|local|internal|intranet|lan|home|corp|vercel\.internal)$/.test(host);
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", ndash: "–", mdash: "—", hellip: "…" };

/** Readable text from an HTML page: the main content if it can be found, without menus, scripts or footers. */
export function htmlToText(html: string) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "";
  const main =
    html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? html.match(/<article[\s\S]*?<\/article>/i)?.[0] ?? html.match(/<body[\s\S]*<\/body>/i)?.[0] ?? html;
  const text = main
    .replace(/<(script|style|noscript|svg|nav|header|footer|form|aside|iframe)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|tr|section|br)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (m, e: string) =>
      e.startsWith("#x") ? String.fromCodePoint(parseInt(e.slice(2), 16)) : e.startsWith("#") ? String.fromCodePoint(Number(e.slice(1))) : (ENTITIES[e.toLowerCase()] ?? m)
    )
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
  return { title: title.replace(/\s+/g, " ").replace(/&amp;/g, "&"), text };
}

/** Reads one page for the writer. Never throws: a failed read comes back with ok: false and the reason. */
export async function readSource(url: string, label?: string): Promise<SourceExtract> {
  if (!isFetchableUrl(url)) return { url, label: label ?? url, ok: false, text: "", error: "Only public https web pages can be read." };
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TrichollectiveResearch/1.0; +https://www.trichollective.net)", Accept: "text/html" },
    });
    // A redirect can land somewhere we wouldn't fetch directly.
    if (!isFetchableUrl(res.url || url)) return { url, label: label ?? url, ok: false, text: "", error: "The page redirected somewhere we can't read." };
    if (!res.ok) return { url, label: label ?? url, ok: false, text: "", error: `The site answered ${res.status}.` };
    if (!/html|text\/plain/.test(res.headers.get("content-type") ?? "")) return { url, label: label ?? url, ok: false, text: "", error: "That address isn't a web page." };
    const raw = (await res.text()).slice(0, MAX_BYTES);
    const { title, text } = htmlToText(raw);
    if (text.length < 200) return { url, label: label ?? title ?? url, ok: false, text: "", error: "The page had almost no readable text." };
    return { url, label: label || title || url, ok: true, text: text.slice(0, MAX_CHARS) };
  } catch (error) {
    return { url, label: label ?? url, ok: false, text: "", error: error instanceof Error && error.name === "TimeoutError" ? "The site took too long to answer." : "The page couldn't be read." };
  }
}
