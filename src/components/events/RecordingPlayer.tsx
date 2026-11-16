import { parseRecordingUrl, videoEmbedUrl } from "@/lib/video-embed";

/**
 * The recording of a past event, played from Google Drive, Vimeo or YouTube. The stored link
 * is parsed again here, so the player can only ever point at one of those three.
 */
export function RecordingPlayer({ url, title }: { url: string | null | undefined; title: string }) {
  const parsed = url ? parseRecordingUrl(url) : null;
  const src = parsed ? videoEmbedUrl(parsed) : null;
  if (!src) return null;
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-ink">
      <iframe
        src={src}
        title={`Recording of ${title}`}
        className="absolute inset-0 h-full w-full"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}

export function hasRecording(url: string | null | undefined) {
  return !!url && !!parseRecordingUrl(url);
}
