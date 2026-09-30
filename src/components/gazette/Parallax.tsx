"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * A full-bleed black-and-white image that drifts slower than the page.
 * One rAF loop per image, only while it's on screen; static for reduced motion.
 */
export function ParallaxImage({
  src,
  alt,
  strength = 0.18,
  priority,
  className,
  imgClassName,
  children,
}: {
  src: string;
  alt: string;
  strength?: number;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  children?: React.ReactNode;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrap.current;
    const inner = layer.current;
    if (!el || !inner) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let visible = false;
    const tick = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // -1 when the section enters from below, +1 when it leaves at the top.
      const p = (vh - r.top) / (vh + r.height) * 2 - 1;
      inner.style.transform = `translate3d(0, ${(-p * strength * r.height).toFixed(1)}px, 0) scale(${1 + strength})`;
      if (visible) frame = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(frame);
      if (visible) frame = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [strength]);

  return (
    <div ref={wrap} className={cn("relative overflow-hidden bg-black", className)}>
      <div ref={layer} className="absolute inset-0 will-change-transform" style={{ transform: `scale(${1 + strength})` }}>
        <Image src={src} alt={alt} fill priority={priority} sizes="100vw" className={cn("mag-bw object-cover", imgClassName)} />
      </div>
      {children}
    </div>
  );
}

/** Text that rises into place as it scrolls into view. */
export function Rise({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.style.animationDelay = `${delay}ms`;
          el.classList.add("animate-rise");
          el.classList.remove("opacity-0");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  return (
    <div ref={ref} className={cn("opacity-0", className)}>
      {children}
    </div>
  );
}
