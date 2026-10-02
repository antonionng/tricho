/**
 * Podcast helpers with no database or framework imports, so they are easy to
 * test: reading the host's RSS feed, turning transcript files into plain text
 * with [mm:ss] markers, and checking quotes against a transcript.
 */

export type FeedEpisode = {
  guid: string;
  title: string;
  audioUrl: string | null;
  durationSec: number | null;
  publishedAt: Date | null;
  description: string;
  embedUrl?: string;
};

export type KeyMoment = { t: number; label: string };

/* ------------------------------------------------------------------ */
/* Small XML helpers                                                    */
/* ------------------------------------------------------------------ */

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function decodeEntities(value: string) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : match;
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

function unwrapCdata(value: string) {
  const m = /^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/.exec(value);
  return m ? m[1] : decodeEntities(value);
}

function escapeTag(tag: string) {
  return tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The text inside the first <tag>…</tag>, or null. */
function tagText(xml: string, tag: string) {
  const m = new RegExp(`<${escapeTag(tag)}(?:\\s[^>]*)?>([\\s\\S]*?)</${escapeTag(tag)}>`, "i").exec(xml);
  return m ? unwrapCdata(m[1]).trim() : null;
}

/** An attribute of the first <tag …>, or null. */
function tagAttr(xml: string, tag: string, attr: string) {
  const m = new RegExp(`<${escapeTag(tag)}\\s[^>]*?\\b${escapeTag(attr)}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i").exec(xml);
  return m ? decodeEntities(m[2] ?? m[3] ?? "").trim() : null;
}

/** HTML show notes from the host, as plain text with blank lines between paragraphs. */
export function htmlToText(html: string) {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h[1-6]|li|ul|ol|blockquote)>/gi, "\n\n")
      .replace(/<li[^>]*>/gi, "- ")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* ------------------------------------------------------------------ */
/* Durations and timestamps                                             */
/* ------------------------------------------------------------------ */

/** itunes:duration as seconds: "1:02:03", "62:03" or "3723". */
export function parseDuration(value: string | null | undefined): number | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  if (/^\d+(\.\d+)?$/.test(v)) return Math.round(Number(v));
  const parts = v.split(":");
  if (parts.length < 2 || parts.length > 3 || parts.some((p) => !/^\d+(\.\d+)?$/.test(p))) return null;
  return Math.round(parts.map(Number).reduce((total, n) => total * 60 + n, 0));
}

/** 75 -> "01:15"; minutes keep counting past an hour, so 3723 -> "62:03". */
export function formatTimestamp(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** "01:15" or "1:01:15" as seconds, or null. */
export function parseTimestamp(value: string): number | null {
  const m = /^(?:(\d+):)?(\d{1,3}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const secs = Number(m[3]);
  if (secs > 59) return null;
  return Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + secs;
}

/** 3723 -> "1 hr 2 min"; 1500 -> "25 min". */
export function formatDuration(seconds: number | null | undefined) {
  if (!seconds || seconds <= 0) return "";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${Math.max(1, mins)} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

const MARKER = /\[((?:\d+:)?\d{1,3}:\d{2})\]/g;

/** Every [mm:ss] marker in a transcript, as seconds. */
export function transcriptMarkers(transcript: string | null | undefined) {
  const set = new Set<number>();
  for (const m of (transcript ?? "").matchAll(MARKER)) {
    const t = parseTimestamp(m[1]);
    if (t !== null) set.add(t);
  }
  return set;
}

/** "12:30 Why she stopped offering…" lines as key moments, sorted by time. Bad lines are skipped. */
export function parseKeyMomentLines(text: string): KeyMoment[] {
  const out: KeyMoment[] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*\[?((?:\d+:)?\d{1,3}:\d{2})\]?\s*[-–—:]?\s*(.+?)\s*$/.exec(line);
    if (!m) continue;
    const t = parseTimestamp(m[1]);
    if (t === null || !m[2]) continue;
    out.push({ t, label: m[2].slice(0, 200) });
  }
  return out.sort((a, b) => a.t - b.t);
}

export function formatKeyMomentLines(moments: KeyMoment[]) {
  return moments.map((m) => `${formatTimestamp(m.t)} ${m.label}`).join("\n");
}

/** The keyMoments JSON column, read safely. */
export function keyMomentsOf(value: unknown): KeyMoment[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((m): m is KeyMoment => !!m && typeof m === "object" && typeof (m as KeyMoment).t === "number" && typeof (m as KeyMoment).label === "string")
    .map((m) => ({ t: Math.max(0, Math.floor(m.t)), label: m.label }))
    .sort((a, b) => a.t - b.t);
}

/* ------------------------------------------------------------------ */
/* The feed                                                             */
/* ------------------------------------------------------------------ */

/** Hosts whose share links have an iframe player we can work out from the link. */
function embedFrom(link: string | null) {
  if (!link) return undefined;
  const transistor = /^https?:\/\/share\.transistor\.fm\/s\/([a-z0-9]+)/i.exec(link);
  if (transistor) return `https://share.transistor.fm/e/${transistor[1]}`;
  const spotify = /^https?:\/\/open\.spotify\.com\/episode\/([a-z0-9]+)/i.exec(link);
  if (spotify) return `https://open.spotify.com/embed/episode/${spotify[1]}`;
  return undefined;
}

/** Read the episodes out of a podcast RSS feed, newest first as the feed lists them. */
export function parseFeed(xml: string): FeedEpisode[] {
  const items = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) ?? [];
  const episodes: FeedEpisode[] = [];
  for (const item of items) {
    const audioUrl = tagAttr(item, "enclosure", "url");
    const link = tagText(item, "link");
    const guid = tagText(item, "guid") || audioUrl || link;
    if (!guid) continue;
    const title = decodeEntities(tagText(item, "title") ?? tagText(item, "itunes:title") ?? "").trim() || "Untitled episode";
    const rawDate = tagText(item, "pubDate");
    const date = rawDate ? new Date(rawDate) : null;
    const rawDescription = tagText(item, "content:encoded") ?? tagText(item, "description") ?? tagText(item, "itunes:summary") ?? "";
    const embedUrl = embedFrom(link);
    episodes.push({
      guid,
      title,
      audioUrl: audioUrl || null,
      durationSec: parseDuration(tagText(item, "itunes:duration")),
      publishedAt: date && !Number.isNaN(date.getTime()) ? date : null,
      description: htmlToText(rawDescription),
      ...(embedUrl ? { embedUrl } : {}),
    });
  }
  return episodes;
}

export async function fetchFeed(url: string): Promise<FeedEpisode[]> {
  const res = await fetch(url, {
    headers: { accept: "application/rss+xml, application/xml, text/xml" },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`The podcast feed answered with ${res.status}.`);
  return parseFeed(await res.text());
}

/* ------------------------------------------------------------------ */
/* Transcript files                                                     */
/* ------------------------------------------------------------------ */

type Cue = { start: number; speaker: string | null; text: string };

/** "00:01:02.500" or "01:02,500" as seconds. */
function cueTime(value: string) {
  const m = /^(?:(\d+):)?(\d{1,2}):(\d{2})[.,]\d{1,3}$/.exec(value.trim());
  if (!m) return null;
  return Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

function readCues(text: string): Cue[] {
  const blocks = text.replace(/\r\n?/g, "\n").split(/\n\s*\n/);
  const cues: Cue[] = [];
  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const timingIndex = lines.findIndex((l) => l.includes("-->"));
    if (timingIndex < 0) continue;
    const start = cueTime(lines[timingIndex].split("-->")[0]);
    if (start === null) continue;
    let speaker: string | null = null;
    const body = lines
      .slice(timingIndex + 1)
      .map((l) => {
        const voice = /<v(?:\.[^\s>]+)?\s+([^>]+)>/i.exec(l);
        if (voice) speaker = voice[1].trim();
        return decodeEntities(l.replace(/<[^>]+>/g, "")).trim();
      })
      .filter(Boolean)
      .join(" ");
    if (body) cues.push({ start, speaker, text: body });
  }
  return cues;
}

/** Longest stretch, in seconds, that one paragraph of a transcript covers. */
const PARAGRAPH_SECONDS = 45;

/**
 * An uploaded transcript as plain text. Caption files (.vtt, .srt) become
 * paragraphs that each start with an [mm:ss] marker; consecutive cues from
 * the same speaker are joined into one paragraph of up to 45 seconds.
 * Plain text is kept as it is.
 */
export function parseTranscriptFile(name: string, text: string): string {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  const clean = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  if (ext !== "vtt" && ext !== "srt") return clean.replace(/\n{3,}/g, "\n\n").trim();

  const cues = readCues(clean);
  const paragraphs: { start: number; speaker: string | null; parts: string[] }[] = [];
  for (const cue of cues) {
    const last = paragraphs[paragraphs.length - 1];
    if (last && last.speaker === cue.speaker && cue.start - last.start < PARAGRAPH_SECONDS) {
      last.parts.push(cue.text);
    } else {
      paragraphs.push({ start: cue.start, speaker: cue.speaker, parts: [cue.text] });
    }
  }
  return paragraphs
    .map((p) => `[${formatTimestamp(p.start)}] ${p.speaker ? `${p.speaker}: ` : ""}${p.parts.join(" ")}`)
    .join("\n\n");
}

/** The transcript's paragraphs, for previews. */
export function transcriptParagraphs(transcript: string | null | undefined) {
  return (transcript ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/* ------------------------------------------------------------------ */
/* Quotes                                                               */
/* ------------------------------------------------------------------ */

function normaliseForMatch(value: string) {
  return value
    .replace(MARKER, " ")
    .toLowerCase()
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[^\p{L}\p{N}' ]+/gu, " ")
    .replace(/'/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Only the quotes that appear word for word in the transcript, ignoring case,
 * punctuation, spacing and [mm:ss] markers. Guards against invented quotes.
 */
export function quotesInTranscript(quotes: string[], transcript: string | null | undefined): string[] {
  const haystack = ` ${normaliseForMatch(transcript ?? "")} `;
  if (!haystack.trim()) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of quotes) {
    const quote = raw.trim().replace(/^["'“‘]+|["'”’]+$/g, "").trim();
    const needle = normaliseForMatch(quote);
    if (needle.split(" ").length < 3 || seen.has(needle)) continue;
    if (haystack.includes(` ${needle} `)) {
      seen.add(needle);
      out.push(quote);
    }
  }
  return out;
}
