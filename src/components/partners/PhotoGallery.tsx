"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type GalleryPhoto = { src: string; caption: string | null };

/** A photo grid that opens into a full-screen viewer, with arrow keys and Escape. */
export function PhotoGallery({ photos, name, className }: { photos: GalleryPhoto[]; name: string; className?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((d: number) => setOpen((i) => (i === null ? null : (i + d + photos.length) % photos.length)), [photos.length]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, close, step]);

  if (!photos.length) return null;
  const current = open === null ? null : photos[open];

  return (
    <>
      <ul className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4", photos.length === 1 && "grid-cols-1 md:grid-cols-1", className)}>
        {photos.map((p, i) => (
          <li key={`${i}-${p.src}`}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-paper-2 md:rounded-3xl"
              aria-label={`Open photo ${i + 1} of ${photos.length}${p.caption ? `: ${p.caption}` : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.src}
                alt={p.caption ?? `${name}, photo ${i + 1}`}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              {p.caption && (
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-8 text-left text-sm text-white opacity-0 transition group-hover:opacity-100">
                  {p.caption}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} photos`}
          className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white"
          onClick={close}
        >
          <div className="flex items-center justify-between px-4 py-3 text-sm text-white/70">
            <span>
              {open! + 1} of {photos.length}
            </span>
            <button type="button" onClick={close} className="rounded-full p-2 hover:bg-white/10" aria-label="Close">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.src} alt={current.caption ?? ""} className="max-h-full max-w-full rounded-xl object-contain" />
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-3 hover:bg-white/15 md:left-6"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-3 hover:bg-white/15 md:right-6"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
          <p className="min-h-12 px-4 py-4 text-center text-[15px] text-white/85">{current.caption}</p>
        </div>
      )}
    </>
  );
}
