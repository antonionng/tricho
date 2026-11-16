import type { Edition } from "@/content/gazette/types";
import { cn } from "@/lib/utils";

/**
 * Seasonal motion laid over a cover: slow snowfall and a strand of lights that twinkle.
 * Pure CSS, decorative only (aria-hidden), and still under prefers-reduced-motion.
 * Positions are fixed numbers, so server and client render the same markup.
 */
const FLAKES = Array.from({ length: 42 }, (_, i) => ({
  left: (i * 37.3) % 100,
  size: 2 + ((i * 7) % 5),
  delay: -((i * 1.7) % 14),
  duration: 11 + ((i * 3) % 9),
  drift: ((i % 2 ? 1 : -1) * (6 + ((i * 5) % 14))),
  opacity: 0.35 + ((i * 13) % 50) / 100,
}));

const LIGHTS = Array.from({ length: 24 }, (_, i) => ({
  left: 2 + i * 4.1,
  dip: Math.sin((i / 23) * Math.PI) * 18,
  delay: (i * 0.37) % 2.4,
}));

export function SeasonOverlay({ season, className }: { season?: Edition["season"]; className?: string }) {
  if (season !== "christmas") return null;
  return (
    <div aria-hidden className={cn("season pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {/* A strand of lights draped across the top of the cover. */}
      <svg className="absolute inset-x-0 top-0 h-[14%] w-full" viewBox="0 0 100 24" preserveAspectRatio="none">
        <path d="M0 2 Q50 26 100 2" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.25" vectorEffect="non-scaling-stroke" />
      </svg>
      {LIGHTS.map((l, i) => (
        <span
          key={i}
          className="season-light absolute block rounded-full"
          style={{ left: `${l.left}%`, top: `calc(${(2 + l.dip) * 0.55}% + 2px)`, animationDelay: `${l.delay}s` }}
        />
      ))}
      {FLAKES.map((f, i) => (
        <span
          key={i}
          className="season-flake absolute block rounded-full bg-white"
          style={
            {
              left: `${f.left}%`,
              width: f.size,
              height: f.size,
              opacity: f.opacity,
              animationDelay: `${f.delay}s`,
              animationDuration: `${f.duration}s`,
              "--drift": `${f.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
