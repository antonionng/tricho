import Link from "next/link";
import { Lock, Play } from "lucide-react";
import type { TvCardVideo } from "@/lib/tv-data";
import { TV_KIND_LABEL, formatMinutes, tvHref, tvThumbnail } from "@/lib/tv";
import { shortDate } from "@/components/members/format";
import { cn } from "@/lib/utils";

/** The video's still, or for Vimeo a plain cover with its shelf, with a play mark over it. */
export function TvCover({ video, locked = false, className }: { video: TvCardVideo; locked?: boolean; className?: string }) {
  const thumb = tvThumbnail(video);
  return (
    <div className={cn("relative aspect-video overflow-hidden rounded-xl bg-ink", className)}>
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" loading="lazy" className={cn("h-full w-full object-cover", locked && "opacity-50")} />
      ) : (
        <div className="flex h-full w-full flex-col justify-end p-4 text-paper">
          <span className="label text-paper/60">Trichollective TV</span>
          <span className="display mt-1 line-clamp-2 text-xl leading-tight">{TV_KIND_LABEL[video.kind]}</span>
        </div>
      )}
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-paper/90 text-ink shadow-sm">
          {locked ? <Lock className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5 fill-ink" />}
        </span>
      </span>
      {formatMinutes(video.durationMin) && (
        <span className="absolute bottom-2 right-2 rounded-md bg-ink/80 px-1.5 py-0.5 text-[11px] font-medium text-paper">
          {formatMinutes(video.durationMin)}
        </span>
      )}
    </div>
  );
}

export function TvCard({ video, locked = false, className }: { video: TvCardVideo; locked?: boolean; className?: string }) {
  return (
    <Link href={tvHref(video.slug)} className={cn("group flex flex-col gap-3", className)}>
      <TvCover video={video} locked={locked} className="transition-opacity group-hover:opacity-90" />
      <div className="flex flex-col gap-1">
        <p className="text-[12px] text-muted-foreground">
          {[TV_KIND_LABEL[video.kind], shortDate(video.recordedAt), locked && "Professional"].filter(Boolean).join(" · ")}
        </p>
        <h3 className="text-[16px] font-semibold leading-snug tracking-[-0.01em] text-ink group-hover:underline">{video.title}</h3>
        {video.presenters && <p className="line-clamp-1 text-[13px] text-ink-2">{video.presenters}</p>}
      </div>
    </Link>
  );
}

/** A TV video shared in a community post. Sits above the post's own link so it opens the video. */
export function TvAttachment({ video, className }: { video: TvCardVideo; className?: string }) {
  return (
    <Link
      href={tvHref(video.slug)}
      className={cn("relative z-10 flex flex-col overflow-hidden rounded-xl border border-rule bg-paper-2 hover:border-ink/30 sm:flex-row", className)}
    >
      <TvCover video={video} className="rounded-none sm:w-64 sm:shrink-0" />
      <div className="flex flex-col justify-center gap-1 p-4">
        <p className="label text-muted-foreground">Trichollective TV · {TV_KIND_LABEL[video.kind]}</p>
        <p className="text-[15px] font-semibold leading-snug text-ink">{video.title}</p>
        <p className="text-[13px] font-medium text-ink underline underline-offset-4">Watch now</p>
      </div>
    </Link>
  );
}
