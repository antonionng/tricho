import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "hero";
  as?: "span" | "h1";
};

const sizeClass = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl md:text-5xl",
  hero: "text-[14vw] sm:text-7xl md:text-[9vw] lg:text-[10vw]",
};

export function BrandMark({ className, size = "md", as: Tag = "span" }: BrandMarkProps) {
  return (
    <Tag
      className={cn(
        "font-sans font-extrabold uppercase tracking-tighter leading-[0.9] inline-flex items-baseline",
        sizeClass[size],
        className
      )}
    >
      <span className="text-foreground">Tricho</span>
      <span className="text-secondary">llective</span>
      <span className="text-secondary">.</span>
    </Tag>
  );
}
