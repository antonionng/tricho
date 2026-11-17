import type { VideoProvider } from "@/content/course-types";

/**
 * Lesson videos are hosted by the educator on Vimeo or YouTube. Educators paste
 * any link they have; we keep only the provider and the video id, and build the
 * embed address ourselves, so a pasted link can never point the player anywhere else.
 */

export type ParsedVideo = { provider: VideoProvider; id: string };

/**
 * A recording of a masterclass can also live on Google Drive, which is where the team keeps
 * them. Drive is not offered to educators for lessons, so it is a separate type.
 */
export type ParsedRecording = ParsedVideo | { provider: "drive"; id: string };

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
// A private Vimeo link carries a hash after the id ("vimeo.com/123/abc123"), which the player needs.
const VIMEO_ID = /^\d{5,12}(?::[0-9a-f]{6,20})?$/;
const DRIVE_ID = /^[A-Za-z0-9_-]{20,120}$/;

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

/** A recording link: Vimeo, YouTube, or a Google Drive file shared with "Anyone with the link". */
export function parseRecordingUrl(raw: string): ParsedRecording | null {
  const video = parseVideoUrl(raw);
  if (video) return video;
  const input = raw.trim();
  if (!input) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== "drive.google.com" && host !== "docs.google.com") return null;
  const parts = url.pathname.split("/").filter(Boolean);
  // drive.google.com/file/d/ID/view, drive.google.com/open?id=ID, drive.google.com/uc?id=ID
  const id = parts[0] === "file" && parts[1] === "d" ? parts[2] : url.searchParams.get("id");
  return id && DRIVE_ID.test(id) ? { provider: "drive", id } : null;
}

function youtube(id: string | null | undefined): ParsedVideo | null {
  return id && YOUTUBE_ID.test(id) ? { provider: "youtube", id } : null;
}

function vimeo(id: string | undefined, hash: string | null | undefined): ParsedVideo | null {
  if (!id || !/^\d{5,12}$/.test(id)) return null;
  return { provider: "vimeo", id: hash && /^[0-9a-f]{6,20}$/.test(hash) ? `${id}:${hash}` : id };
}

export function isValidVideoId(provider: ParsedRecording["provider"], id: string) {
  if (provider === "youtube") return YOUTUBE_ID.test(id);
  if (provider === "drive") return DRIVE_ID.test(id);
  return VIMEO_ID.test(id);
}

/** The player address. YouTube uses its privacy-enhanced domain, which sets no cookies until play. */
export function videoEmbedUrl(video: ParsedRecording) {
  if (!isValidVideoId(video.provider, video.id)) return null;
  if (video.provider === "youtube") return `https://www.youtube-nocookie.com/embed/${video.id}?rel=0`;
  if (video.provider === "drive") return `https://drive.google.com/file/d/${video.id}/preview`;
  const [id, hash] = video.id.split(":");
  return `https://player.vimeo.com/video/${id}?${hash ? `h=${hash}&` : ""}dnt=1`;
}

/** A link back to the video, shown in the builder so the educator can check it. */
export function videoPageUrl(video: ParsedRecording) {
  if (video.provider === "youtube") return `https://www.youtube.com/watch?v=${video.id}`;
  if (video.provider === "drive") return `https://drive.google.com/file/d/${video.id}/view`;
  const [id, hash] = video.id.split(":");
  return `https://vimeo.com/${id}${hash ? `/${hash}` : ""}`;
}
