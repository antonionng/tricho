import type { TvKind } from "@prisma/client";
import { isValidVideoId, videoEmbedUrl, type ParsedVideo } from "@/lib/video-embed";

export const TV_KINDS: TvKind[] = ["masterclass", "case_round", "podcast", "video"];

export const TV_KIND_LABEL: Record<TvKind, string> = {
  masterclass: "Masterclass",
  case_round: "Case round",
  podcast: "Podcast",
  video: "Video",
};

/** The library's shelves, in the order members see them. */
export const TV_SHELF_LABEL: Record<TvKind, string> = {
  masterclass: "Past masterclasses",
  case_round: "Case rounds",
  podcast: "Podcasts",
  video: "Videos",
};

export function isTvKind(value: unknown): value is TvKind {
  return typeof value === "string" && (TV_KINDS as string[]).includes(value);
}

export function tvVideo(v: { provider: string; videoId: string }): ParsedVideo | null {
  const provider = v.provider === "youtube" || v.provider === "vimeo" ? v.provider : null;
  return provider && isValidVideoId(provider, v.videoId) ? { provider, id: v.videoId } : null;
}

export function tvEmbedUrl(v: { provider: string; videoId: string }) {
  const video = tvVideo(v);
  return video ? videoEmbedUrl(video) : null;
}

/** YouTube publishes a still for every video. Vimeo needs its API, so its videos show a plain cover instead. */
export function tvThumbnail(v: { provider: string; videoId: string }) {
  const video = tvVideo(v);
  return video?.provider === "youtube" ? `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg` : null;
}

export const tvHref = (slug: string) => `/members/tv/${slug}`;

/** Professional-only recordings are shared in the Case Room, which only Professional members can read. */
export function tvPostSpace(v: { professionalOnly: boolean }) {
  return v.professionalOnly ? "case-room" : "lounge";
}

const POST_TITLE: Record<TvKind, string> = {
  masterclass: "Masterclass recording",
  case_round: "Case round recording",
  podcast: "New podcast episode",
  video: "New on Trichollective TV",
};

const POST_ASK: Record<TvKind, string> = {
  masterclass: "Once you have watched it, tell us what you will try in your own practice, or what you would ask next.",
  case_round: "Once you have watched it, share how you would have approached the case, without anything that could identify a client.",
  podcast: "Once you have watched it, tell us what you took from the conversation.",
  video: "Once you have watched it, tell us what you think.",
};

/** The community post shared when a video is first published. */
export function tvPost(v: { kind: TvKind; title: string; summary: string; presenters: string | null; professionalOnly: boolean }) {
  // Event titles often start "Masterclass:", which would read twice after "Masterclass recording:".
  const name = v.title
    .trim()
    .replace(new RegExp(`^${TV_KIND_LABEL[v.kind]}\\s*[:\\-–]\\s*`, "i"), "")
    .replace(/[,.]$/, "");
  const title = `${POST_TITLE[v.kind]}: ${name}`.slice(0, 140);
  const content = [
    v.presenters?.trim() ? `Presented by ${v.presenters.trim().replace(/\.$/, "")}.` : "",
    v.summary.trim(),
    `Watch it on Trichollective TV, then come back here to talk about it.`,
    POST_ASK[v.kind],
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 5000);
  return { title, content, space: tvPostSpace(v) };
}

export function formatMinutes(min: number | null | undefined) {
  if (!min || min <= 0) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}
