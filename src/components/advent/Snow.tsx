"use client";

import { useEffect, useRef } from "react";

/** Slow falling snow behind the calendar. Decorative, and still when the visitor prefers reduced motion. */
export function Snow({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    type Flake = { x: number; y: number; r: number; vy: number; sway: number; phase: number; a: number };
    let flakes: Flake[] = [];

    const seed = () => {
      const count = Math.round(Math.min(110, Math.max(40, (w * h) / 16000)));
      flakes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.6 + Math.random() * 2.1,
        vy: 0.18 + Math.random() * 0.55,
        sway: 0.2 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        a: 0.25 + Math.random() * 0.55,
      }));
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };
    const tick = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        f.y += f.vy * (0.6 + f.r / 2.5);
        f.x += Math.sin(t / 1400 + f.phase) * f.sway * 0.35;
        if (f.y > h + 4) {
          f.y = -4;
          f.x = Math.random() * w;
        }
        ctx.globalAlpha = f.a;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(tick);
    };

    resize();
    raf = requestAnimationFrame(tick);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}
