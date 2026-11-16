"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { Block } from "@/content/gazette/types";
import { cn } from "@/lib/utils";
import { gazetteFonts } from "./fonts";

type Advent = Extract<Block, { type: "advent" }>;
type Door = Advent["doors"][number];

const RED = "#9b1b2a";
const PAPER = "#f4f3f0";
const GOLD = "#f2c45a";

/** Where each door sits on the townhouse: a circle (gable window) or a rectangle. */
const SPOTS: Record<number, { c?: [number, number, number]; r?: [number, number, number, number] }> = {
  8: { c: [320, 108, 15] },
  7: { r: [190, 152, 46, 50] },
  2: { r: [297, 152, 46, 50] },
  11: { r: [404, 152, 46, 50] },
  4: { r: [190, 222, 46, 50] },
  9: { r: [297, 222, 46, 50] },
  1: { r: [404, 222, 46, 50] },
  12: { r: [178, 322, 86, 58] },
  3: { r: [296, 318, 48, 102] },
  5: { r: [376, 322, 86, 58] },
  10: { r: [96, 384, 40, 34] },
  6: { r: [562, 230, 26, 32] },
};

const FLAKES = Array.from({ length: 46 }, (_, i) => ({
  cx: (i * 53.7) % 640,
  r: 1 + ((i * 7) % 3),
  o: 0.35 + ((i * 13) % 50) / 100,
  dur: 9 + ((i * 3) % 8),
  delay: -((i * 1.3) % 14),
}));

/* Opened doors are remembered in the reader's own browser, so stars stay on the doors they've unwrapped. */
const STORE = "trichozette:advent:opened";
const EVENT = "trichozette:advent";
function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}
function readStore() {
  try {
    return localStorage.getItem(STORE) ?? "[]";
  } catch {
    return "[]";
  }
}

export function AdventHouse({ block }: { block: Advent }) {
  const raw = useSyncExternalStore(subscribe, readStore, () => "[]");
  const [session, setSession] = useState<number[]>([]);
  const opened = useMemo(() => {
    const set = new Set<number>(session);
    try {
      for (const n of JSON.parse(raw)) if (typeof n === "number") set.add(n);
    } catch {}
    return set;
  }, [raw, session]);
  const [revealing, setRevealing] = useState<Door | null>(null);
  const [note, setNote] = useState("Tap the glowing door to unwrap today's gift.");
  const byDay = new Map(block.doors.map((d) => [d.day, d]));
  const today = Math.max(0, ...block.doors.filter((d) => !d.locked).map((d) => d.day));

  const open = (d: Door) => {
    if (d.locked) {
      setNote(`Door ${d.day} is still wrapped. It opens on ${d.day} December, and we'll email you that morning.`);
      return;
    }
    setSession((s) => [...s, d.day]);
    try {
      localStorage.setItem(STORE, JSON.stringify([...new Set([...opened, d.day])]));
      window.dispatchEvent(new Event(EVENT));
    } catch {}
    setNote(`Door ${d.day} is open.`);
    setRevealing(d);
  };

  return (
    <div id="advent" className="my-6 scroll-mt-20">
      <svg viewBox="0 0 640 470" className="block w-full rounded-[18px]" role="group" aria-label={`${block.title}: twelve doors on a Christmas townhouse`}>
        <rect width="640" height="470" fill={RED} />
        {Array.from({ length: 22 }, (_, i) => (
          <circle key={i} cx={(i * 97) % 640} cy={70 + ((i * 37) % 60)} r="1" fill={PAPER} className="season-twinkle" style={{ animationDelay: `${(i * 0.37) % 2.4}s` }} />
        ))}
        <text x="320" y="40" textAnchor="middle" fill={PAPER} className="mag-didone" style={{ fontSize: 30, letterSpacing: 1 }}>
          TRICHOZETTE
        </text>
        <text x="320" y="58" textAnchor="middle" fill={PAPER} opacity=".8" style={{ fontSize: 10, fontWeight: 800, letterSpacing: 4 }}>
          THE ADVENT · EDITION 10
        </text>
        {/* Chimney and smoke */}
        <rect x="410" y="72" width="26" height="44" fill={RED} stroke={PAPER} strokeWidth="1.2" />
        <circle className="season-twinkle" cx="430" cy="62" r="6" fill="none" stroke={PAPER} />
        <circle className="season-twinkle" cx="440" cy="48" r="8" fill="none" stroke={PAPER} style={{ animationDelay: ".8s" }} />
        {/* House */}
        <polygon points="146,134 320,70 494,134" fill={RED} stroke={PAPER} strokeWidth="1.4" />
        <rect x="160" y="134" width="320" height="286" fill={RED} stroke={PAPER} strokeWidth="1.4" />
        <path d="M170 140 Q320 164 470 140" fill="none" stroke={PAPER} strokeWidth=".8" />
        {Array.from({ length: 15 }, (_, i) => (
          <circle key={i} cx={170 + i * 21.4} cy={140 + Math.sin((i / 14) * Math.PI) * 12} r="3" fill={GOLD} className="season-twinkle" style={{ animationDelay: `${(i * 0.4) % 2.4}s` }} />
        ))}
        {/* The shop sign: the Trichollective wordmark */}
        <rect x="168" y="290" width="304" height="20" fill={PAPER} />
        <text x="320" y="306" textAnchor="middle" style={{ fontWeight: 800, fontSize: 17, letterSpacing: -1 }}>
          <tspan fill="#0b0b0b">TRICHO</tspan>
          <tspan fill="#a3a29d">LLECTIVE.</tspan>
        </text>
        {/* Lamp post, snow, tree */}
        <line x1="575" y1="262" x2="575" y2="420" stroke={PAPER} strokeWidth="2" />
        <path d="M565 262h20M570 226l5-8 5 8" stroke={PAPER} strokeWidth="1.2" fill="none" />
        <path d="M0 420 Q160 408 320 420 T640 418 V470 H0z" fill={PAPER} />
        <path d="M52 420l20-52 20 52M60 420l12-34 12 34" fill="none" stroke={RED} strokeWidth="1.2" />
        {/* Doors */}
        {Object.entries(SPOTS).map(([dayKey, spot]) => {
          const day = Number(dayKey);
          const d = byDay.get(day);
          if (!d) return null;
          const state = d.locked ? "locked" : opened.has(day) ? "open" : "ready";
          const [cx, cy] = spot.c ? [spot.c[0], spot.c[1] + 6] : [spot.r![0] + spot.r![2] / 2, spot.r![1] + spot.r![3] / 2 + 7];
          const big = spot.c || spot.r![3] > 55;
          return (
            <g
              key={day}
              role="button"
              tabIndex={0}
              aria-label={d.locked ? `Door ${day}, opens on ${day} December` : `Open door ${day}`}
              className={cn("advent-house-door cursor-pointer outline-none", state)}
              onClick={() => open(d)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open(d))}
            >
              {spot.c ? (
                <>
                  <circle cx={spot.c[0]} cy={spot.c[1]} r={spot.c[2]} fill={GOLD} />
                  {state === "open" && <Star cx={cx} cy={cy} />}
                  <circle className="advent-leaf" cx={spot.c[0]} cy={spot.c[1]} r={spot.c[2]} fill={RED} stroke={PAPER} strokeWidth="1.2" />
                  {state === "ready" && <circle className="advent-ring" cx={spot.c[0]} cy={spot.c[1]} r={spot.c[2] + 4} fill="none" stroke={GOLD} strokeWidth="2" />}
                </>
              ) : (
                <>
                  <rect x={spot.r![0]} y={spot.r![1]} width={spot.r![2]} height={spot.r![3]} fill={GOLD} />
                  {state === "open" && <Star cx={cx} cy={cy} />}
                  <rect className="advent-leaf" x={spot.r![0]} y={spot.r![1]} width={spot.r![2]} height={spot.r![3]} fill={RED} stroke={PAPER} strokeWidth="1.2" />
                  {state === "ready" && (
                    <rect className="advent-ring" x={spot.r![0] - 4} y={spot.r![1] - 4} width={spot.r![2] + 8} height={spot.r![3] + 8} fill="none" stroke={GOLD} strokeWidth="2" />
                  )}
                </>
              )}
              {state !== "open" && (
                <text x={cx} y={cy} textAnchor="middle" className="mag-didone pointer-events-none" fill={state === "locked" ? "rgba(244,243,240,.45)" : PAPER} style={{ fontSize: big ? 20 : 16 }}>
                  {day}
                </text>
              )}
            </g>
          );
        })}
        {FLAKES.map((f, i) => (
          <circle key={i} cx={f.cx} cy={-10} r={f.r} fill={PAPER} opacity={f.o} className="advent-snow" style={{ animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s` }} />
        ))}
      </svg>
      <p className="mag-caps mt-3 text-[9.5px] text-black/60" aria-live="polite">
        {today === 0 ? "The first door opens on 1 December." : note}
      </p>
      {revealing && <GiftReveal door={revealing} onClose={() => setRevealing(null)} />}
    </div>
  );
}

function Star({ cx, cy }: { cx: number; cy: number }) {
  return <path d={`M${cx} ${cy - 14}l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z`} fill={RED} />;
}

type Phase = "drop" | "shake" | "pop" | "card";

/** The full-screen unwrapping: the parcel drops, shakes, pops its lid, and the gift card zooms up. */
function GiftReveal({ door, onClose }: { door: Door; onClose: () => void }) {
  const reduced = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const [phase, setPhase] = useState<Phase>(reduced ? "card" : "drop");
  const burst = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (reduced) return;
    const t = [setTimeout(() => setPhase("shake"), 800), setTimeout(() => setPhase("pop"), 2300), setTimeout(() => setPhase("card"), 2850)];
    return () => t.forEach(clearTimeout);
  }, [reduced]);

  useEffect(() => {
    if (phase !== "pop" || !burst.current) return;
    const host = burst.current;
    const colours = [GOLD, PAPER, "#0b0b0b", GOLD, "#ffffff"];
    for (let i = 0; i < 80; i++) {
      const p = document.createElement("span");
      p.className = "advent-confetti";
      p.style.background = colours[i % colours.length];
      if (i % 3 === 1) p.style.borderRadius = "50%";
      host.appendChild(p);
      const a = (i / 80) * Math.PI * 2 + (i % 7) * 0.13;
      const d = 160 + ((i * 37) % 260);
      p.animate(
        [
          { transform: "translate(-50%,-50%) rotate(0)", opacity: 1 },
          { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d - 60}px) rotate(${(i * 47) % 540}deg)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${Math.cos(a) * d * 1.1}px,${Math.sin(a) * d + 320}px) rotate(${(i * 47) % 720}deg)`, opacity: 0 },
        ],
        { duration: 1900 + ((i * 13) % 700), easing: "cubic-bezier(.15,.7,.3,1)", fill: "forwards" }
      );
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "card") closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [phase, onClose]);

  const skip = () => phase !== "card" && setPhase("card");
  const gift = door.gift;

  return createPortal(
    <div className={cn("mag advent-overlay fixed inset-0 z-[120] overflow-hidden", gazetteFonts)} style={{ background: RED }} onClick={skip} role="dialog" aria-modal="true" aria-label={`Door ${door.day}`}>
      {FLAKES.map((f, i) => (
        <span
          key={i}
          aria-hidden
          className="advent-flake absolute top-[-10px] rounded-full"
          style={{ left: `${(i * 29.3) % 100}%`, width: f.r + 1, height: f.r + 1, opacity: f.o, background: PAPER, animationDuration: `${f.dur - 2}s`, animationDelay: `${f.delay}s` }}
        />
      ))}
      <svg aria-hidden viewBox="-450 -450 900 900" className={cn("advent-rays absolute left-1/2 top-[44%] h-[140vmax] w-[140vmax]", (phase === "pop" || phase === "card") && "on")}>
        {Array.from({ length: 16 }, (_, i) => (
          <polygon key={i} points="0,0 -40,-450 40,-450" fill={PAPER} opacity=".08" transform={`rotate(${i * 22.5})`} />
        ))}
      </svg>
      <svg aria-hidden viewBox="0 0 160 170" className={cn("advent-box absolute left-1/2 top-[44%] w-40 sm:w-52", phase)}>
        <rect x="14" y="62" width="132" height="104" fill={PAPER} />
        <rect x="72" y="62" width="16" height="104" fill="#0b0b0b" />
        <g className="advent-lid">
          <rect x="4" y="38" width="152" height="28" fill={PAPER} stroke={RED} />
          <rect x="72" y="38" width="16" height="28" fill="#0b0b0b" />
          <path d="M80 38C64 10 34 10 40 26s28 12 40 12zM80 38c16-28 46-28 40-12s-28 12-40 12z" fill="none" stroke={GOLD} strokeWidth="5" />
        </g>
      </svg>
      <div ref={burst} aria-hidden className="pointer-events-none absolute left-1/2 top-[40%]" />
      <div
        className={cn("advent-card absolute left-1/2 top-1/2 w-[min(88vw,440px)] rounded-[18px] bg-white px-7 pb-6 pt-7 text-center", phase === "card" && "on")}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mag-caps text-[10px] font-semibold tracking-[0.22em]" style={{ color: RED }}>
          Door {door.day} · {door.day} December
        </p>
        <p className="mag-caps mt-3 text-[9px] text-black/55">You&apos;ve unwrapped</p>
        <p className="mag-didone mt-1 text-[30px] leading-[1.1] text-black">{door.title}</p>
        <p className="mag-serif mt-3 text-[14.5px] leading-relaxed text-black/75">{door.text}</p>
        {gift && !door.pending ? (
          <Link href={gift.href} className="mt-5 inline-block rounded-full px-6 py-3 text-[15px] font-semibold text-white" style={{ background: RED }}>
            {gift.label} &rarr;
          </Link>
        ) : (
          <p className="mag-caps mt-5 inline-block rounded-full border px-6 py-3 text-[10px]" style={{ borderColor: RED, color: RED }}>
            Coming soon
          </p>
        )}
        {gift && <p className="mt-2 text-[12px] text-black/50">{door.pending ? "We'll email you when it's ready." : gift.note}</p>}
        <button ref={closeRef} type="button" onClick={onClose} className="mt-4 block w-full text-[13px] text-black underline underline-offset-4">
          Back to the calendar
        </button>
      </div>
      {phase !== "card" && (
        <p className="mag-caps absolute bottom-5 w-full text-center text-[9.5px] text-white/70">Tap anywhere to skip</p>
      )}
    </div>,
    document.body
  );
}
