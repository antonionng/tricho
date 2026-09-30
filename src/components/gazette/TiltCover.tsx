"use client";

import { useRef } from "react";

/** A gentle 3D tilt that follows the pointer. Static for reduced motion and touch. */
export function TiltCover({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 8}deg) translateZ(0)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = "";
  };
  return (
    <div className="[perspective:1200px]" onPointerMove={onMove} onPointerLeave={reset}>
      <div ref={ref} className="transition-transform duration-300 ease-out will-change-transform [transform-style:preserve-3d]">
        {children}
      </div>
    </div>
  );
}
