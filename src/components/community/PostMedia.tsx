import type { PostMediaItem } from "@/lib/community";
import { cn } from "@/lib/utils";

/**
 * A post's photos and videos. One item shows at its own shape; several sit in a tidy grid.
 * Videos sit above the card's link so their controls stay usable.
 */
export function PostMedia({ media, className }: { media: PostMediaItem[]; className?: string }) {
  if (media.length === 0) return null;
  const single = media.length === 1;

  return (
    <div className={cn("grid gap-1.5 overflow-hidden rounded-xl", single ? "grid-cols-1" : "grid-cols-2", className)}>
      {media.map((m, i) => {
        const tile = cn(
          "w-full bg-paper-2",
          single ? "max-h-[520px] object-contain" : "aspect-square object-cover",
          media.length === 3 && i === 0 && "col-span-2 aspect-[2/1]"
        );
        return m.type === "video" ? (
          <video
            key={m.id}
            src={m.url}
            controls
            playsInline
            preload="metadata"
            width={m.width ?? undefined}
            height={m.height ?? undefined}
            className={cn(tile, "relative z-10 bg-ink")}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={m.id}
            src={m.url}
            alt=""
            loading="lazy"
            width={m.width ?? undefined}
            height={m.height ?? undefined}
            className={tile}
          />
        );
      })}
    </div>
  );
}
