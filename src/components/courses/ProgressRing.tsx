/** A small circular progress indicator, drawn in the current text colour. */
export function ProgressRing({ percent, size = 56, label }: { percent: number; size?: number; label?: string }) {
  const stroke = Math.max(3, Math.round(size / 14));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(100, Math.max(0, percent));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label ?? `${p}% complete`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - p / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize={size * 0.26} fontWeight={600} fill="currentColor">
        {p}%
      </text>
    </svg>
  );
}
