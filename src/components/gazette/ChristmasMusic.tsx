"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Music, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Christmas music for the Christmas edition: carols performed by the U.S. Army Band, public domain
 * (see public/music/christmas/SOURCES.md). MP3, so it plays on every phone, tablet and computer.
 *
 * It starts by itself. Browsers only allow sound to start on its own when they trust the site, so the
 * edition tries to play the moment it opens, and where the browser says no (every iPhone, and most
 * first visits elsewhere) it starts on the reader's first tap, click or key press anywhere on the page.
 * Pausing is remembered: a reader who paused it isn't played music again on their next visit.
 */

const TRACKS = [
  { src: "/music/christmas/here-we-come-a-wassailing.mp3", title: "Here We Come A-wassailing" },
  { src: "/music/christmas/o-tannenbaum.mp3", title: "O Tannenbaum" },
  { src: "/music/christmas/fum-fum-fum.mp3", title: "Fum, Fum, Fum" },
  { src: "/music/christmas/hark-the-herald.mp3", title: "Hark! The Herald Angels Sing" },
  { src: "/music/christmas/good-king-wenceslaus.mp3", title: "Good King Wenceslaus" },
];
const KEY = "trichozette:music:carols";

/* One player for the whole page, shared by every button. */
let audio: HTMLAudioElement | null = null;
let track = 0;
let state = { on: false, title: TRACKS[0].title };
let pausedByHidden = false;
const listeners = new Set<() => void>();
const emit = () => {
  state = { on: !!audio && !audio.paused, title: TRACKS[track].title };
  listeners.forEach((l) => l());
};

function player() {
  if (audio) return audio;
  audio = new Audio(TRACKS[0].src);
  audio.preload = "auto";
  audio.volume = 0.6;
  // Phones keep the sound inside the page rather than handing it to the lock screen as a podcast would.
  audio.setAttribute("playsinline", "");
  audio.addEventListener("ended", () => {
    track = (track + 1) % TRACKS.length;
    audio!.src = TRACKS[track].src;
    void audio!.play().catch(() => {});
    emit();
  });
  audio.addEventListener("play", emit);
  audio.addEventListener("pause", emit);
  return audio;
}

function remember(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
}

function wanted() {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

/** Plays from inside a tap or click, which every browser allows. Returns whether it started. */
async function play() {
  try {
    await player().play();
    remember(true);
    return true;
  } catch {
    return false;
  }
}

function pause() {
  audio?.pause();
  remember(false);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const GESTURES = ["pointerup", "touchend", "click", "keydown"] as const;

/**
 * Starts the music when the edition opens. Mount once per page (the Christmas edition does it in its top bar).
 */
export function useChristmasMusicAutostart(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !wanted()) return;
    let armed = false;
    const onGesture = (e: Event) => {
      // The music buttons handle their own taps.
      if ((e.target as Element | null)?.closest?.("[data-music-toggle]")) return;
      if (state.on) return disarm();
      void play().then((ok) => ok && disarm());
    };
    const disarm = () => {
      if (!armed) return;
      armed = false;
      GESTURES.forEach((g) => window.removeEventListener(g, onGesture, true));
    };
    void play().then((ok) => {
      if (ok) return;
      armed = true;
      GESTURES.forEach((g) => window.addEventListener(g, onGesture, { capture: true, passive: true }));
    });
    // Quiet when the reader switches tab or locks their phone, and back when they return.
    const onVisible = () => {
      if (document.hidden && state.on) {
        pausedByHidden = true;
        audio?.pause();
      } else if (!document.hidden && pausedByHidden) {
        pausedByHidden = false;
        void audio?.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      disarm();
      document.removeEventListener("visibilitychange", onVisible);
      audio?.pause();
    };
  }, [enabled]);
}

export function useChristmasMusic() {
  const s = useSyncExternalStore(subscribe, () => state, () => state);
  return { ...s, toggle: () => (s.on ? pause() : void play()) };
}

/** The music button. `light` for use over the cover photograph. */
export function MusicToggle({ light, compact, className }: { light?: boolean; compact?: boolean; className?: string }) {
  const { on, toggle } = useChristmasMusic();
  const Icon = on ? Pause : Music;
  return (
    <button
      type="button"
      data-music-toggle
      onClick={toggle}
      aria-pressed={on}
      className={cn(
        "mag-caps inline-flex items-center gap-2 text-[10px]",
        !compact && "rounded-full border px-4 py-2.5",
        !compact && (light ? "border-white/60 text-white hover:bg-white hover:text-black" : "border-black text-black hover:bg-black hover:text-white"),
        className
      )}
    >
      <Icon className="h-4 w-4" />
      <span className={compact ? "hidden sm:inline" : undefined}>{on ? "Pause the music" : "Play Christmas music"}</span>
    </button>
  );
}

/** A small floating player, shown while music plays, so pause is always one tap away on any screen. */
export function MusicDock() {
  const { on, title, toggle } = useChristmasMusic();
  if (!on) return null;
  return (
    <div className="fixed left-1/2 top-[calc(4rem+env(safe-area-inset-top))] z-[60] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-full bg-[#9b1b2a] py-1.5 pl-4 pr-1.5 text-white shadow-lg xl:left-6 xl:top-auto xl:bottom-6 xl:translate-x-0">
      <span aria-hidden className="flex h-4 items-end gap-[3px]">
        {[0, 1, 2].map((i) => (
          <span key={i} className="music-bar w-[3px] rounded-sm bg-white" style={{ animationDelay: `${i * 0.18}s` }} />
        ))}
      </span>
      <span className="truncate text-[12px]">
        <span className="opacity-70">Now playing </span>
        {title}
      </span>
      <button
        type="button"
        data-music-toggle
        onClick={toggle}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#9b1b2a]"
        aria-label="Pause the music"
      >
        <Pause className="h-4 w-4" />
      </button>
    </div>
  );
}
