"use client";

import type { Block } from "@/content/gazette";
import { BlockView } from "./Blocks";
import { Rise } from "./Parallax";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Body copy                                                           */
/* ------------------------------------------------------------------ */
export function Body({ blocks, drop = true, wide = false }: { blocks: Block[]; drop?: boolean; wide?: boolean }) {
  const capIndex = drop ? blocks.findIndex((b) => b.type === "p") : -1;
  return (
    <div className="mag-body mag-web">
      {blocks.map((b, i) =>
        b.type === "pull" ? (
          <Rise key={i} className={cn("my-14", wide ? "" : "lg:-mx-24 xl:-mx-40")}>
            <blockquote className="text-center">
              <span className="mag-didone block text-[72px] leading-[0.4]">&ldquo;</span>
              <p className="mag-didone mt-4 text-[34px] italic leading-[1.08] tracking-[-0.01em] sm:text-[46px]">{b.text}</p>
              <span className="mx-auto mt-6 block h-px w-14 bg-black" />
            </blockquote>
          </Rise>
        ) : (
          <div key={i} className="flow-root">
            <BlockView block={b} drop={i === capIndex} />
          </div>
        )
      )}
    </div>
  );
}

export function Kicker({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return <p className={cn("mag-caps text-[10px] sm:text-[11px]", light ? "text-white/80" : "text-black/60")}>{children}</p>;
}
