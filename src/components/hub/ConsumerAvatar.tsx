import { cn } from "@/lib/utils";

const PALETTE = ["#1f2a24", "#5b6b5f", "#a3876a", "#d9c7b0", "#3b4a5a", "#8a9a8c", "#c96f4a", "#e7dccd"];

/** A number from the seed, so the same seed always draws the same avatar. */
function hash(seed: string, salt: number) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * A generated avatar drawn from a random seed, so consumers never need to upload a
 * photo and the picture says nothing about who they are.
 */
export function ConsumerAvatar({ seed, size = 48, className }: { seed: string; size?: number; className?: string }) {
  const bgIndex = hash(seed, 1) % PALETTE.length;
  const fgIndex = (bgIndex + 1 + (hash(seed, 2) % (PALETTE.length - 1))) % PALETTE.length;
  // A 5 by 5 grid, mirrored left to right, so it reads as a shape rather than noise.
  const cells: [number, number][] = [];
  for (let i = 0; i < 15; i++) {
    if ((hash(seed, 10 + i) & 1) === 0) continue;
    const x = i % 3;
    const y = Math.floor(i / 3);
    cells.push([x, y]);
    if (x < 2) cells.push([4 - x, y]);
  }
  return (
    <svg
      viewBox="-1 -1 7 7"
      width={size}
      height={size}
      aria-hidden
      className={cn("shrink-0 rounded-full", className)}
      style={{ background: PALETTE[bgIndex] }}
    >
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={PALETTE[fgIndex]} />
      ))}
    </svg>
  );
}
