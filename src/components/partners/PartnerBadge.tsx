import { cn } from "@/lib/utils";

/** A rosette: a scalloped seal with a star, in gold. Drawn once here so every badge matches. */
function scallopPath(cx: number, cy: number, r: number, bumps: number, depth: number) {
  const steps = bumps * 8;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2 - Math.PI / 2;
    const rr = r - depth * (0.5 - 0.5 * Math.cos(a * bumps));
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}

function starPath(cx: number, cy: number, outer: number, inner: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}

const SEAL = scallopPath(12, 12, 11.5, 14, 1.6);
const STAR = starPath(12, 12, 5.2, 2.3);

export function PremiumSeal({ className, id = "seal" }: { className?: string; id?: string }) {
  const g = `${id}-gold`;
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F4DE9A" />
          <stop offset="0.5" stopColor="#D4AF55" />
          <stop offset="1" stopColor="#A9802B" />
        </linearGradient>
      </defs>
      <path d={SEAL} fill={`url(#${g})`} />
      <circle cx="12" cy="12" r="8.1" fill="none" stroke="#0B0B0B" strokeOpacity="0.35" strokeWidth="0.6" />
      <path d={STAR} fill="#0B0B0B" />
    </svg>
  );
}

/**
 * The Premium partner badge: a gold seal and the label, on ink, with a "Founding" mark for the
 * founding partners. sm = cards, md = lists, lg = the top of a partner page.
 */
export function PartnerBadge({
  founding = false,
  size = "md",
  label = "Premium partner",
  className,
}: {
  founding?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}) {
  const id = `pb-${size}-${founding ? "f" : "p"}`;
  if (size === "lg") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-3 whitespace-nowrap rounded-full bg-[#0B0B0B] py-1.5 pl-1.5 pr-5 text-white shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)] ring-1 ring-[#D4AF55]/50",
          className
        )}
      >
        <PremiumSeal id={id} className="h-9 w-9 shrink-0 drop-shadow" />
        <span className="flex flex-col items-start leading-none">
          {founding && <span className="mb-1 text-[9px] font-semibold uppercase tracking-[0.28em] text-[#E2C477]">Founding</span>}
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">{label}</span>
        </span>
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full bg-[#0B0B0B] font-semibold uppercase text-white ring-1 ring-[#D4AF55]/45",
        size === "sm" ? "gap-1.5 py-0.5 pl-0.5 pr-2.5 text-[9px] tracking-[0.12em]" : "gap-1.5 py-0.5 pl-0.5 pr-2.5 text-[9.5px] tracking-[0.12em]",
        className
      )}
    >
      <PremiumSeal id={id} className={size === "sm" ? "h-[18px] w-[18px] shrink-0" : "h-5 w-5 shrink-0"} />
      {founding && (
        <>
          <span className="text-[#E2C477]">Founding</span>
          <span aria-hidden className="h-2.5 w-px bg-white/30" />
        </>
      )}
      <span>{label}</span>
    </span>
  );
}
