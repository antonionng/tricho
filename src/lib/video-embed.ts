import type { VideoProvider } from "@/content/course-types";

/**
 * Lesson videos are hosted by the educator on Vimeo or YouTube. Educators paste
 * any link they have; we keep only the provider and the video id, and build the
 * embed address ourselves, so a pasted link can never point the player anywhere else.
 */

export type ParsedVideo = { provider: VideoProvider; id: string };

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
// A private Vimeo link carries a hash after the id ("vimeo.com/123/abc123"), which the player needs.
const VIMEO_ID = /^\d{5,12}(?::[0-9a-f]{6,20})?$/;

export function parseVideoUrl(raw: string): ParsedVideo | null {
  const input = raw.trim();
  if (!input) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^www\.|^m\./, "");
  const parts = url.pathname.split("/").filter(Boolean);

  if (host === "youtu.be") return youtube(parts[0]);
  if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "music.youtube.com") {
    if (url.searchParams.get("v")) return youtube(url.searchParams.get("v"));
    if (["embed", "shorts", "live", "v"].includes(parts[0])) return youtube(parts[1]);
    return null;
  }
  if (host === "vimeo.com") {
    // vimeo.com/123456789, vimeo.com/123456789/abcdef1234, vimeo.com/channels/x/123456789
    const idIndex = parts.findIndex((p) => /^\d{5,12}$/.test(p));
    if (idIndex < 0) return null;
    const hash = parts[idIndex + 1];
    return vimeo(parts[idIndex], hash && /^[0-9a-f]{6,20}$/.test(hash) ? hash : url.searchParams.get("h"));
  }
  if (host === "player.vimeo.com" && parts[0] === "video") return vimeo(parts[1], url.searchParams.get("h"));
  return null;
}

function youtube(id: string | null | undefined): ParsedVideo | null {
  return id && YOUTUBE_ID.test(id) ? { provider: "youtube", id } : null;
}

function vimeo(id: string | undefined, hash: string | null | undefined): ParsedVideo | null {
  if (!id || !/^\d{5,12}$/.test(id)) return null;
  return { provider: "vimeo", id: hash && /^[0-9a-f]{6,20}$/.test(hash) ? `${id}:${hash}` : id };
}

export function isValidVideoId(provider: VideoProvider, id: string) {
  return provider === "youtube" ? YOUTUBE_ID.test(id) : VIMEO_ID.test(id);
}

/** The player address. YouTube uses its privacy-enhanced domain, which sets no cookies until play. */
export function videoEmbedUrl(video: ParsedVideo) {
  if (!isValidVideoId(video.provider, video.id)) return null;
  if (video.provider === "youtube") return `https://www.youtube-nocookie.com/embed/${video.id}?rel=0`;
  const [id, hash] = video.id.split(":");
  return `https://player.vimeo.com/video/${id}?${hash ? `h=${hash}&` : ""}dnt=1`;
}

/** A link back to the video, shown in the builder so the educator can check it. */
export function videoPageUrl(video: ParsedVideo) {
  if (video.provider === "youtube") return `https://www.youtube.com/watch?v=${video.id}`;
  const [id, hash] = video.id.split(":");
  return `https://vimeo.com/${id}${hash ? `/${hash}` : ""}`;
}
