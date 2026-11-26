import type { CSSProperties } from "react";

/**
 * The Christmas dressing for the 12 Days calendar, drawn in Trichollective's own ink,
 * paper and white: a string of fairy lights, a wreath for each door and a snowy tree line.
 * All of it is decoration, so it is hidden from screen readers.
 */

const BULBS = [0.08, 0.26, 0.44, 0.62, 0.8, 0.96];

/** One swag of fairy lights across the top of a door, reaching over the gap to the next one. */
export function Garland({ offset = 0 }: { offset?: number }) {
  return (
    <span className="advent-garland" aria-hidden>
      <svg viewBox="0 0 100 26" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
        <path d="M0,3 Q50,26 100,3" fill="none" stroke="rgba(244,243,240,0.45)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      {BULBS.map((t, i) => (
        <span
          key={t}
          className="advent-bulb"
          style={{ left: `${t * 100}%`, top: `${3 + 46 * t * (1 - t)}px`, animationDelay: `${((i + offset) * 0.37) % 2.2}s` } as CSSProperties}
        />
      ))}
    </span>
  );
}

/** A wreath with a bow, hung on a door that is ready to open. */
export function Wreath({ className }: { className?: string }) {
  const leaves = Array.from({ length: 16 }, (_, i) => i * (360 / 16));
  return (
    <svg viewBox="0 0 48 56" className={className} aria-hidden>
      <g transform="translate(24 24)" fill="currentColor">
        {leaves.map((a) => (
          <g key={a} transform={`rotate(${a})`}>
            <ellipse cx="0" cy="-15" rx="3.1" ry="6.4" transform="rotate(32 0 -15)" />
            <ellipse cx="0" cy="-15" rx="2.2" ry="5" transform="rotate(-38 0 -15)" opacity="0.55" />
          </g>
        ))}
        {[20, 95, 160, 235, 310].map((a) => (
          <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 15} cy={Math.sin((a * Math.PI) / 180) * 15} r="1.7" fill="#fbfaf7" stroke="currentColor" strokeWidth="0.8" />
        ))}
      </g>
      {/* The bow. */}
      <g fill="currentColor">
        <path d="M24 40 L15 35 L15 45 Z" />
        <path d="M24 40 L33 35 L33 45 Z" />
        <path d="M22.5 41 L19 54 L23 51 L24 44 Z" />
        <path d="M25.5 41 L29 54 L25 51 L24 44 Z" />
        <circle cx="24" cy="40" r="2.2" />
      </g>
    </svg>
  );
}

type Tree = { x: number; h: number; tone: "back" | "mid" | "front"; lights?: boolean };

const TREES: Tree[] = [
  { x: 150, h: 110, tone: "back" },
  { x: 235, h: 172, tone: "front", lights: true },
  { x: 330, h: 105, tone: "mid" },
  { x: 410, h: 140, tone: "back" },
  { x: 500, h: 88, tone: "mid" },
  { x: 590, h: 64, tone: "back" },
  { x: 860, h: 70, tone: "back" },
  { x: 945, h: 108, tone: "mid" },
  { x: 1030, h: 146, tone: "back" },
  { x: 1115, h: 98, tone: "mid" },
  { x: 1205, h: 178, tone: "front", lights: true },
  { x: 1295, h: 118, tone: "back" },
];

const TONE = { back: "#2b2b2b", mid: "#55544f", front: "#fbfaf7" } as const;

function Fir({ x, h, tone, lights }: Tree) {
  const base = 196;
  const w = h * 0.52;
  // Three tiers, each a little wider than the one above, and a short trunk.
  const tiers = [0, 0.3, 0.58].map((start, i) => {
    const top = base - h + h * start * 0.9;
    const bottom = base - h + h * (0.46 + i * 0.24);
    const half = (w / 2) * (0.5 + i * 0.25);
    return `M${x},${top} L${x + half},${bottom} L${x - half},${bottom} Z`;
  });
  const dots = lights
    ? [
        [0.12, 0.42],
        [-0.14, 0.56],
        [0.2, 0.68],
        [-0.05, 0.74],
        [-0.26, 0.86],
        [0.3, 0.9],
        [0.04, 0.94],
      ]
    : [];
  return (
    <g>
      <rect x={x - h * 0.03} y={base - 4} width={h * 0.06} height={14} fill={TONE[tone]} />
      {tiers.map((d) => (
        <path key={d} d={d} fill={TONE[tone]} />
      ))}
      {lights && (
        <path
          d={`M${x},${base - h - 13} l3,8 8,1 -6,6 2,8 -7,-4 -7,4 2,-8 -6,-6 8,-1 z`}
          fill="#ffffff"
          className="advent-star"
        />
      )}
      {dots.map(([dx, dy], i) => (
        <circle key={i} cx={x + dx * w} cy={base - h + dy * h} r="2.6" fill="#0b0b0b" className="advent-tree-light" style={{ animationDelay: `${(i * 0.41) % 2}s` }} />
      ))}
    </g>
  );
}

/** A snowy rise with fir trees, along the bottom of the scene. */
export function TreeLine({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 240" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden>
      {TREES.filter((t) => t.tone === "back").map((t) => (
        <Fir key={t.x} {...t} />
      ))}
      <path d="M0,206 C200,180 420,214 720,198 C1000,184 1240,214 1440,190 L1440,240 L0,240 Z" fill="#1c1c1c" />
      {TREES.filter((t) => t.tone !== "back").map((t) => (
        <Fir key={t.x} {...t} />
      ))}
      <path d="M0,214 C240,192 480,226 720,208 C960,192 1200,226 1440,202 L1440,240 L0,240 Z" fill="#fbfaf7" />
    </svg>
  );
}
