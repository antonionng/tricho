import { cn } from "@/lib/utils";

function initials(name?: string | null) {
  // Letters only, so names such as "Sample (clinic)" give "SC" rather than "S(".
  const parts = (name || "Member").trim().split(/\s+/).map((w) => w.replace(/[^\p{L}]/gu, "")).filter(Boolean);
  if (parts.length === 0) return "M";
  return ((parts[0]?.[0] ?? "M") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name?: string | null;
  /** A photo URL, or several in order of preference: profile photo, listing photo, account image. */
  src?: string | null | (string | null | undefined)[];
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const box = {
    sm: "h-8 w-8 text-[11px]",
    md: "h-10 w-10 text-xs",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-xl",
  }[size];
  const photo = (Array.isArray(src) ? src : [src]).find((s): s is string => !!s);
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photo} alt="" className={cn("shrink-0 rounded-full object-cover", box, className)} />
    );
  }
  return (
    <span
      aria-hidden
      className={cn("grid shrink-0 place-items-center rounded-full bg-paper-3 font-semibold text-ink-2", box, className)}
    >
      {initials(name)}
    </span>
  );
}
