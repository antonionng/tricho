"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Grid2x2, X } from "lucide-react";
import { editionLabel, pageKicker, pageTitle, type Edition } from "@/content/gazette";
import { PRINT, SheetView, usePagination, type Sheet } from "./Magazine";

const PAGE_W = PRINT.W;
const PAGE_H = PRINT.H;
import { Cover } from "./Cover";
import { gazetteFonts } from "./fonts";
import { cn } from "@/lib/utils";

function useStage() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

/** One A4 page, laid out at print size and scaled to fit. */
function ScaledPage({ scale, children, className }: { scale: number; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative shrink-0 overflow-hidden", className)} style={{ width: PAGE_W * scale, height: PAGE_H * scale }}>
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

export function Reader({
  edition,
  lockedTitles,
  signedIn,
  coverLines,
}: {
  nextEdition?: Edition;
  /** Pages have already been trimmed on the server for non-members. */
  edition: Edition;
  lockedTitles: { kicker: string; title: string }[];
  signedIn: boolean;
  coverLines: string[];
}) {
  const hasGate = lockedTitles.length > 0;
  const { result, measure } = usePagination(edition, hasGate, PRINT);
  const sheets: Sheet[] = useMemo(() => result?.sheets ?? [{ k: "cover" }], [result]);

  const contents = useMemo(
    () => [
      ...edition.pages.map((p, i) => ({ kicker: pageKicker(p), title: pageTitle(p), sheet: result?.starts[i] ?? null })),
      ...lockedTitles.map((l) => ({ ...l, sheet: null })),
    ],
    [edition.pages, lockedTitles, result]
  );

  const [stageRef, stage] = useStage();
  const spread = stage.w >= 900;
  // Fit the page (or spread) inside the stage with a little breathing room.
  const scale = useMemo(() => {
    if (!stage.w || !stage.h) return 0;
    const pagesAcross = spread ? 2 : 1;
    return Math.min((stage.w - (spread ? 32 : 8)) / (PAGE_W * pagesAcross), (stage.h - 16) / PAGE_H);
  }, [stage.w, stage.h, spread]);

  const [rawIndex, setIndex] = useState(0);
  const [dir, setDir] = useState<"next" | "prev">("next");
  const [grid, setGrid] = useState(false);

  // On a spread the cover stands alone; after it, pages face each other (1–2, 3–4…).
  const normalise = useCallback((i: number) => (spread && i > 0 ? i - ((i - 1) % 2) : i), [spread]);
  const last = sheets.length - 1;
  const index = normalise(Math.min(rawIndex, last));
  const visible = spread && index > 0 ? [index, index + 1].filter((i) => i <= last) : [index];
  const atEnd = visible[visible.length - 1] >= last;
  const step = spread ? 2 : 1;

  const go = useCallback(
    (to: number) => {
      const target = normalise(Math.max(0, Math.min(last, to)));
      if (target === index) return;
      setDir(target > index ? "next" : "prev");
      setIndex(target);
    },
    [index, last, normalise]
  );
  const next = useCallback(() => go(index === 0 ? 1 : index + step), [go, index, step]);
  const prev = useCallback(() => go(index - step), [go, index, step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea")) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") setGrid(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY });
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) (dx < 0 ? next : prev)();
    touch.current = null;
  };

  const progress = sheets.length > 1 ? Math.round(((visible[visible.length - 1] + 1) / sheets.length) * 100) : 0;

  const sheetProps = {
    geo: PRINT,
    edition,
    contents,
    onJump: go,
    lockedTitles,
    signedIn,
    coverLines,
  };

  return (
    <div className={cn("mag relative flex h-[100svh] flex-col bg-[#1a1a1a] text-white", gazetteFonts)}>
      {measure}

      {/* Toolbar */}
      <div className="relative z-20 flex h-12 shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 sm:px-6">
        <p className="mag-caps text-[10px] text-white/60">Print edition</p>
        <p className="truncate text-center">
          <span className="mag-didone text-[17px] italic">{edition.title}</span>
          <span className="mag-caps ml-3 hidden text-[9px] text-white/50 sm:inline">{editionLabel(edition)}</span>
        </p>
        <button
          type="button"
          onClick={() => setGrid(true)}
          className="inline-flex items-center gap-2 mag-caps text-[10px] text-white/70 hover:text-white"
          aria-label="Show all pages"
        >
          <Grid2x2 className="h-4 w-4" /> <span className="hidden sm:inline">Pages</span>
        </button>
        <span className="w-8" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/10">
          <div className="h-full bg-white transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Stage */}
      <div
        ref={stageRef}
        className="relative flex min-h-0 flex-1 items-center justify-center [perspective:2400px]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {scale > 0 && (
          <div
            key={index}
            className={cn("flex shadow-[0_50px_120px_-30px_rgba(0,0,0,0.8)]", dir === "next" ? "page-in-next" : "page-in-prev")}
          >
            {visible.map((i, k) => (
              <ScaledPage key={i} scale={scale} className={cn(visible.length === 2 && k === 0 && "after:absolute after:inset-y-0 after:right-0 after:w-16 after:bg-gradient-to-l after:from-black/15 after:to-transparent", visible.length === 2 && k === 1 && "after:absolute after:inset-y-0 after:left-0 after:w-16 after:bg-gradient-to-r after:from-black/15 after:to-transparent")}>
                <div className="h-full w-full text-black">
                  <SheetView sheet={sheets[i]} folio={i + 1} side={visible.length === 2 ? (k === 0 ? "left" : "right") : i % 2 ? "right" : "left"} {...sheetProps} />
                </div>
              </ScaledPage>
            ))}
          </div>
        )}
        {!result && scale > 0 && (
          <p className="absolute bottom-3 mag-caps text-[9px] text-white/50">Setting the pages…</p>
        )}

        <button
          type="button"
          onClick={prev}
          disabled={index === 0}
          aria-label="Previous page"
          className="absolute left-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur transition-opacity hover:bg-black/60 disabled:opacity-0 md:grid"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={next}
          disabled={atEnd || !result}
          aria-label="Next page"
          className="absolute right-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur transition-opacity hover:bg-black/60 disabled:opacity-0 md:grid"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Footer controls */}
      <div className="relative z-20 flex h-14 shrink-0 items-center justify-between gap-4 border-t border-white/10 px-4 pb-safe sm:px-6">
        <button type="button" onClick={prev} disabled={index === 0} className="mag-caps text-[10px] text-white/70 disabled:opacity-30 md:hidden">
          Previous
        </button>
        <p className="mag-caps mx-auto text-[9px] text-white/50">
          {visible.map((i) => i + 1).join("–")} / {sheets.length}
          <span className="ml-4 hidden md:inline">Turn with the arrow keys</span>
        </p>
        <button type="button" onClick={next} disabled={atEnd || !result} className="mag-caps text-[10px] text-white disabled:opacity-30 md:hidden">
          Next
        </button>
      </div>

      {/* Page grid */}
      {grid && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#111]/97 backdrop-blur-xl animate-rise" role="dialog" aria-label="All pages">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <div className="mb-8 flex items-center justify-between">
              <p className="mag-didone text-4xl italic">{edition.title}</p>
              <button type="button" onClick={() => setGrid(false)} className="grid h-11 w-11 place-items-center rounded-full border border-white/20" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {sheets.map((s, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => {
                      go(i);
                      setGrid(false);
                    }}
                    className={cn("block w-full outline-offset-4", visible.includes(i) && "outline outline-1 outline-white")}
                  >
                    {s.k === "cover" ? (
                      <Cover edition={edition} lines={coverLines} sizes="15vw" />
                    ) : (
                      <ScaledPage scale={0.2}>
                        <div className="pointer-events-none h-full w-full text-black">
                          <SheetView sheet={s} folio={i + 1} side={i % 2 ? "right" : "left"} {...sheetProps} />
                        </div>
                      </ScaledPage>
                    )}
                    <span className="mag-caps mt-2 block text-center text-[8px] text-white/50">{i + 1}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
