import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "hero";
  /** Show "ONLINE" beneath, as on the poster. */
  sub?: boolean;
  as?: "span" | "h1" | "div";
};

const sizeClass = {
  xs: "text-[15px]",
  sm: "text-[19px]",
  md: "text-3xl",
  lg: "text-5xl md:text-6xl",
  hero: "text-[13vw] sm:text-7xl lg:text-[5.6rem]",
};

const subClass = {
  xs: "text-[7px] mt-0.5",
  sm: "text-[8px] mt-0.5",
  md: "text-[10px] mt-1",
  lg: "text-xs mt-2",
  hero: "text-sm mt-3",
};

/**
 * The Trichollective wordmark: TRICHO in ink, LLECTIVE. fading to grey.
 * Replace with the SVG logo when it arrives; everything renders through here.
 */
export function BrandMark({ className, size = "md", sub = false, as: Tag = "span" }: BrandMarkProps) {
  return (
    <Tag className={cn("inline-flex flex-col leading-none", className)} aria-label="Trichollective">
      <span
        aria-hidden
        className={cn(
          "display uppercase leading-[0.85] tracking-[-0.06em] font-extrabold whitespace-nowrap",
          sizeClass[size]
        )}
      >
        <span className="text-ink">Tricho</span>
        <span className="text-fade">llective.</span>
      </span>
      {sub && (
        <span aria-hidden className={cn("label text-ink tracking-[0.5em] pl-[0.15em]", subClass[size])}>
          Online
        </span>
      )}
    </Tag>
  );
}
