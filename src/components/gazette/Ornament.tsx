import { cn } from "@/lib/utils";

/**
 * Fine line-drawn Christmas ornaments, in the magazine's black-and-white hand:
 * a single stroke weight, no fills, drawn on a 48 unit square.
 */
const SHAPES: { name: string; d: React.ReactNode }[] = [
  {
    name: "star",
    d: <path d="M24 6l4.9 11.6 12.6 1.1-9.6 8.3 2.9 12.3L24 33l-10.8 6.3 2.9-12.3-9.6-8.3 12.6-1.1z" />,
  },
  {
    name: "bauble",
    d: (
      <>
        <path d="M24 4c3 0 3 5 0 5" />
        <rect x="20.5" y="9" width="7" height="4" rx="1" />
        <circle cx="24" cy="28" r="15" />
        <path d="M9.6 24c4.8 3 24 3 28.8 0M9.6 32c4.8-3 24-3 28.8 0" />
      </>
    ),
  },
  {
    name: "snowflake",
    d: (
      <>
        <path d="M24 5v38M7.5 14.5l33 19M7.5 33.5l33-19" />
        <path d="M20 8l4 4 4-4M20 40l4-4 4 4M9 19.5l5.5-1.5L13 12.5M39 28.5L33.5 30 35 35.5M9 28.5l5.5 1.5-1.5 5.5M39 19.5L33.5 18l1.5-5.5" />
      </>
    ),
  },
  {
    name: "tree",
    d: (
      <>
        <path d="M24 5l8 11h-4l9 12h-5l9 11H7l9-11h-5l9-12h-4z" />
        <path d="M21 39v5h6v-5" />
      </>
    ),
  },
  {
    name: "bell",
    d: (
      <>
        <path d="M24 7c-7 0-11 6-11 13v8l-4 6h30l-4-6v-8c0-7-4-13-11-13z" />
        <path d="M20 38a4 4 0 008 0M24 4v3" />
      </>
    ),
  },
  {
    name: "holly",
    d: (
      <>
        <path d="M24 26c-3-7-10-11-18-10 2 2 1 5 3 6-2 1-1 4-3 5 6 2 13 1 18-1z" />
        <path d="M24 26c3-7 10-11 18-10-2 2-1 5-3 6 2 1 1 4 3 5-6 2-13 1-18-1z" />
        <circle cx="21" cy="31" r="3" />
        <circle cx="27" cy="31" r="3" />
        <circle cx="24" cy="36" r="3" />
      </>
    ),
  },
  {
    name: "candle",
    d: (
      <>
        <rect x="18" y="20" width="12" height="22" rx="1" />
        <path d="M24 20v-4" />
        <path d="M24 4c3 4 4 6 4 8a4 4 0 01-8 0c0-2 1-4 4-8z" />
        <path d="M13 44h22" />
      </>
    ),
  },
  {
    name: "gift",
    d: (
      <>
        <rect x="8" y="19" width="32" height="24" />
        <rect x="6" y="13" width="36" height="6" />
        <path d="M24 13v30" />
        <path d="M24 13c-3-6-11-8-11-3 0 3 6 3 11 3zM24 13c3-6 11-8 11-3 0 3-6 3-11 3z" />
      </>
    ),
  },
  {
    name: "comb",
    // A nod to the craft: a fine-tooth comb tied with a bow.
    d: (
      <>
        <rect x="6" y="18" width="36" height="7" rx="2" />
        <path d="M10 25v13M14 25v13M18 25v13M22 25v13M26 25v13M30 25v13M34 25v13M38 25v13" />
        <path d="M24 18c-3-5-9-6-9-2 0 2 5 2 9 2zM24 18c3-5 9-6 9-2 0 2-5 2-9 2z" />
      </>
    ),
  },
  {
    name: "scissors",
    d: (
      <>
        <circle cx="13" cy="37" r="6" />
        <circle cx="35" cy="37" r="6" />
        <path d="M17 32.5L34 6M31 32.5L14 6" />
        <circle cx="24" cy="18.5" r="1" />
      </>
    ),
  },
  {
    name: "wreath",
    d: (
      <>
        <circle cx="24" cy="24" r="14" />
        <circle cx="24" cy="24" r="9" />
        <path d="M14 14l3 2M34 14l-3 2M10 26l3-1M38 26l-3-1M17 35l2-3M31 35l-2-3" />
        <path d="M24 38c-3 2-6 6-4 7 2 0 3-3 4-7zM24 38c3 2 6 6 4 7-2 0-3-3-4-7z" />
      </>
    ),
  },
  {
    name: "moon",
    d: (
      <>
        <path d="M30 8a16 16 0 1010 26A13 13 0 0130 8z" />
        <path d="M38 10l1 3 3 1-3 1-1 3-1-3-3-1 3-1zM12 8l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
      </>
    ),
  },
];

export function Ornament({ index, className }: { index: number; className?: string }) {
  const shape = SHAPES[index % SHAPES.length];
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden
      className={cn("fill-none stroke-current", className)}
      strokeWidth={1.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
    >
      {shape.d}
    </svg>
  );
}
