"use client";

import { useState } from "react";
import type { Block } from "@/content/gazette/types";
import { cn } from "@/lib/utils";

const LETTERS = ["i.", "ii.", "iii.", "iv.", "v.", "vi."];

function Quiz({ block }: { block: Extract<Block, { type: "quiz" }> }) {
  const [picked, setPicked] = useState<number | null>(null);
  const done = picked !== null;
  return (
    <div className="my-5 border-y border-black py-4">
      <p className="mag-caps text-[9.5px] text-black/60">Test yourself</p>
      <p className="mag-didone mt-2 text-[21px] italic leading-[1.15]">{block.question}</p>
      <ol className="mt-3">
        {block.options.map((o, i) => {
          const correct = i === block.answer;
          return (
            <li key={o} className="border-t border-black/15 first:border-t-0">
              <button
                type="button"
                disabled={done}
                onClick={() => setPicked(i)}
                className={cn(
                  "group flex w-full items-baseline gap-3 py-2 text-left mag-serif text-[14.5px] leading-snug transition-colors",
                  !done && "hover:italic",
                  done && !correct && "text-black/35 line-through decoration-black/20",
                  done && correct && "font-semibold"
                )}
              >
                <span className="mag-didone w-7 shrink-0 italic text-black/50">{LETTERS[i]}</span>
                <span>{o}</span>
                {done && correct && <span className="mag-caps ml-auto shrink-0 text-[9px]">Answer</span>}
              </button>
            </li>
          );
        })}
      </ol>
      {done && (
        <div className="mt-3 animate-rise">
          <p className="mag-serif text-[14px] leading-relaxed">
            <span className="mag-didone italic">{picked === block.answer ? "Quite right. " : "Not quite. "}</span>
            {block.explain}
          </p>
          <button type="button" onClick={() => setPicked(null)} className="mag-caps mt-2 text-[9px] text-black/55 underline underline-offset-4">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

function Checklist({ block }: { block: Extract<Block, { type: "checklist" }> }) {
  const [ticked, setTicked] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setTicked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  return (
    <div className="my-5 border-y border-black py-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="mag-didone text-[20px] italic leading-tight">{block.title}</p>
        <p className="mag-caps shrink-0 text-[9px] text-black/55">
          {ticked.size} of {block.items.length}
        </p>
      </div>
      <ol className="mt-2">
        {block.items.map((item, i) => (
          <li key={item} className="border-t border-black/15 first:border-t-0">
            <button
              type="button"
              role="checkbox"
              aria-checked={ticked.has(i)}
              onClick={() => toggle(i)}
              className="flex w-full items-baseline gap-3 py-2 text-left"
            >
              <span className="mag-didone w-6 shrink-0 text-[17px] leading-none">{String(i + 1).padStart(2, "0")}</span>
              <span
                className={cn(
                  "mag-serif text-[14.5px] leading-snug transition-colors",
                  ticked.has(i) && "text-black/35 line-through decoration-black/30"
                )}
              >
                {item}
              </span>
              <span
                aria-hidden
                className={cn(
                  "ml-auto mt-1 h-3 w-3 shrink-0 rounded-full border border-black transition-colors",
                  ticked.has(i) && "bg-black"
                )}
              />
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Reveal({ block }: { block: Extract<Block, { type: "reveal" }> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="my-4 border-l border-black pl-4">
      <p className="mag-didone text-[18px] italic leading-snug">{block.prompt}</p>
      {open ? (
        <p className="mag-serif mt-2 text-[14px] leading-relaxed animate-rise">{block.answer}</p>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="mag-caps mt-2 text-[9px] underline underline-offset-4">
          Reveal the answer
        </button>
      )}
    </div>
  );
}

/** One block, magazine styled. `drop` gives a paragraph a Didone drop cap. */
export function BlockView({ block, drop }: { block: Block; drop?: boolean }) {
  switch (block.type) {
    case "p":
      return <p className={drop ? "mag-drop" : undefined}>{block.text}</p>;
    case "h":
      return <h3 className="mag-caps mb-2 mt-5 text-[10.5px] font-semibold tracking-[0.24em]">{block.text}</h3>;
    case "list":
      return (
        <ul className="mb-4 mt-1">
          {block.items.map((it) => (
            <li key={it} className="mag-serif relative mb-1.5 pl-5 text-[15px] leading-snug">
              <span className="absolute left-0 top-[0.62em] h-px w-2.5 bg-black" />
              {it}
            </li>
          ))}
        </ul>
      );
    case "pull":
      return (
        <blockquote className="my-6 text-center">
          <span className="mag-didone block text-[44px] leading-[0.4]">&ldquo;</span>
          <p className="mag-didone mt-3 text-[25px] italic leading-[1.12]">{block.text}</p>
          <span className="mx-auto mt-4 block h-px w-10 bg-black" />
        </blockquote>
      );
    case "callout":
      return (
        <aside className="my-5 bg-black px-5 py-4 text-white">
          <p className="mag-caps text-[9px] text-white/60">{block.title}</p>
          <p className="mag-serif mt-2 text-[14px] leading-relaxed text-white/90">{block.text}</p>
        </aside>
      );
    case "checklist":
      return <Checklist block={block} />;
    case "quiz":
      return <Quiz block={block} />;
    case "reveal":
      return <Reveal block={block} />;
  }
}

/** Kept for any flowing (non-paginated) use. */
export function Blocks({ blocks, dropCap = false }: { blocks: Block[]; dropCap?: boolean }) {
  const capIndex = dropCap ? blocks.findIndex((b) => b.type === "p") : -1;
  return (
    <div className="mag-body">
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} drop={i === capIndex} />
      ))}
    </div>
  );
}
