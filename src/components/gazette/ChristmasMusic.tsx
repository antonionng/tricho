"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Music, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Christmas music for the Christmas edition: a music-box arrangement of two traditional carols,
 * Deck the Halls and Jingle Bells (both long out of copyright), played by the browser itself.
 * No audio files, nothing to license. Browsers only allow sound after the reader taps, so it starts
 * from the button; a reader who turned it on before hears it again from their first tap.
 */

type Note = [string, number]; // pitch ("rest" for silence), length in beats

const DECK: Note[] = [
  ["G4", 1.5], ["F4", 0.5], ["E4", 1], ["D4", 1], ["C4", 1], ["D4", 1], ["E4", 1], ["C4", 1],
  ["D4", 0.5], ["E4", 0.5], ["F4", 0.5], ["D4", 0.5], ["E4", 1.5], ["D4", 0.5], ["C4", 1], ["B3", 1], ["C4", 2],
  ["G4", 1.5], ["F4", 0.5], ["E4", 1], ["D4", 1], ["C4", 1], ["D4", 1], ["E4", 1], ["C4", 1],
  ["D4", 0.5], ["E4", 0.5], ["F4", 0.5], ["D4", 0.5], ["E4", 1.5], ["D4", 0.5], ["C4", 1], ["B3", 1], ["C4", 2],
  ["D4", 1.5], ["E4", 0.5], ["F4", 1], ["D4", 1], ["E4", 1.5], ["F4", 0.5], ["G4", 1], ["D4", 1],
  ["E4", 0.5], ["F#4", 0.5], ["G4", 1], ["A4", 0.5], ["B4", 0.5], ["C5", 1], ["B4", 1], ["A4", 1], ["G4", 2],
  ["G4", 1.5], ["F4", 0.5], ["E4", 1], ["D4", 1], ["C4", 1], ["D4", 1], ["E4", 1], ["C4", 1],
  ["A4", 0.5], ["A4", 0.5], ["A4", 0.5], ["A4", 0.5], ["G4", 1.5], ["F4", 0.5], ["E4", 1], ["D4", 1], ["C4", 2], ["rest", 2],
];

const JINGLE: Note[] = [
  ["E4", 1], ["E4", 1], ["E4", 2], ["E4", 1], ["E4", 1], ["E4", 2], ["E4", 1], ["G4", 1], ["C4", 1.5], ["D4", 0.5], ["E4", 4],
  ["F4", 1], ["F4", 1], ["F4", 1.5], ["F4", 0.5], ["F4", 1], ["E4", 1], ["E4", 1], ["E4", 0.5], ["E4", 0.5],
  ["E4", 1], ["D4", 1], ["D4", 1], ["E4", 1], ["D4", 2], ["G4", 2],
  ["E4", 1], ["E4", 1], ["E4", 2], ["E4", 1], ["E4", 1], ["E4", 2], ["E4", 1], ["G4", 1], ["C4", 1.5], ["D4", 0.5], ["E4", 4],
  ["F4", 1], ["F4", 1], ["F4", 1.5], ["F4", 0.5], ["F4", 1], ["E4", 1], ["E4", 1], ["E4", 0.5], ["E4", 0.5],
  ["G4", 1], ["G4", 1], ["F4", 1], ["D4", 1], ["C4", 3], ["rest", 3],
];

const SONG = [...DECK, ...JINGLE];
const BEAT = 60 / 112;
const SEMI: Record<string, number> = { C: -9, "C#": -8, D: -7, "D#": -6, E: -5, F: -4, "F#": -3, G: -2, "G#": -1, A: 0, "A#": 1, B: 2 };
function freq(pitch: string) {
  const m = /^([A-G]#?)(\d)$/.exec(pitch)!;
  return 440 * Math.pow(2, (SEMI[m[1]] + (Number(m[2]) - 4) * 12) / 12);
}

/* One player for the whole page, shared by every button. */
const KEY = "trichozette:music";
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let playing = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function bell(at: number, f: number, len: number) {
  if (!ctx || !master) return;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(0.32, at + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, at + Math.max(0.9, len * 1.6));
  g.connect(master);
  for (const [mult, type, level] of [
    [1, "sine", 1],
    [2, "triangle", 0.18],
    [4.01, "sine", 0.06],
  ] as const) {
    const o = ctx.createOscillator();
    const og = ctx.createGain();
    o.type = type;
    o.frequency.value = f * mult;
    og.gain.value = level;
    o.connect(og).connect(g);
    o.start(at);
    o.stop(at + Math.max(1, len * 1.7));
  }
}

function schedule(from: number, startAt: number) {
  if (!ctx || !playing) return;
  let t = startAt;
  let i = from;
  // Queue about four seconds ahead, then come back for more.
  while (t < ctx.currentTime + 4 && i < SONG.length) {
    const [p, beats] = SONG[i];
    if (p !== "rest") bell(t, freq(p), beats * BEAT);
    t += beats * BEAT;
    i++;
  }
  const next = i >= SONG.length ? 0 : i;
  timer = setTimeout(() => schedule(next, t), Math.max(50, (t - ctx!.currentTime - 2) * 1000));
}

function start() {
  if (playing) return;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx ??= new AC();
  if (!master) {
    master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);
  }
  void ctx.resume();
  playing = true;
  schedule(0, ctx.currentTime + 0.1);
  try {
    localStorage.setItem(KEY, "on");
  } catch {}
  emit();
}

function stop() {
  playing = false;
  if (timer) clearTimeout(timer);
  timer = null;
  void ctx?.suspend();
  try {
    localStorage.setItem(KEY, "off");
  } catch {}
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useChristmasMusic() {
  const on = useSyncExternalStore(subscribe, () => playing, () => false);
  // A reader who left the music on last time hears it again from their first tap or key press.
  useEffect(() => {
    let wanted = false;
    try {
      wanted = localStorage.getItem(KEY) === "on";
    } catch {}
    if (!wanted) return;
    const go = () => start();
    window.addEventListener("pointerdown", go, { once: true });
    window.addEventListener("keydown", go, { once: true });
    return () => {
      window.removeEventListener("pointerdown", go);
      window.removeEventListener("keydown", go);
    };
  }, []);
  useEffect(() => () => stop(), []);
  return { on, toggle: () => (playing ? stop() : start()) };
}

/** The music button. `light` for use over the cover photograph. */
export function MusicToggle({ light, compact, className }: { light?: boolean; compact?: boolean; className?: string }) {
  const { on, toggle } = useChristmasMusic();
  const Icon = on ? Pause : Music;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      className={cn(
        "mag-caps inline-flex items-center gap-2 text-[10px]",
        !compact && "rounded-full border px-4 py-2.5",
        !compact && (light ? "border-white/60 text-white hover:bg-white hover:text-black" : "border-black text-black hover:bg-black hover:text-white"),
        className
      )}
    >
      <Icon className={cn("h-4 w-4", on && "animate-pulse")} />
      <span className={compact ? "hidden sm:inline" : undefined}>{on ? "Pause the music" : "Play Christmas music"}</span>
    </button>
  );
}
