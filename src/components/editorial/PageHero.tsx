import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Container, Eyebrow } from "@/components/site/primitives";
import { img, type BrandImage } from "@/content/images";
import { cn } from "@/lib/utils";

export type Crumb = { name: string; path: string };

/**
 * Visible breadcrumb trail. Pair it with breadcrumbLd for the structured version.
 * With showCurrent={false} the current page is left off (the headline already names it).
 */
export function Breadcrumbs({
  items,
  className,
  showCurrent = true,
}: {
  items: Crumb[];
  className?: string;
  showCurrent?: boolean;
}) {
  const visible = showCurrent ? items : items.slice(0, -1);
  return (
    <nav aria-label="Breadcrumb" className={cn("text-[13px] text-muted-foreground", className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {visible.map((item, i) => {
          const isCurrent = showCurrent && i === visible.length - 1;
          const isLast = i === visible.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-1.5">
              {isCurrent ? (
                <span aria-current="page" className="text-ink-2">
                  {item.name}
                </span>
              ) : (
                <>
                  <Link href={item.path} className="hover:text-ink transition-colors">
                    {item.name}
                  </Link>
                  {!isLast && <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />}
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * The editorial page opening: tracked eyebrow with the short rule, a display
 * headline fading into grey, a lede and, optionally, one calm photograph.
 */
export function PageHero({
  eyebrow,
  title,
  fade,
  lede,
  image,
  priority = true,
  crumbs,
  children,
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  fade?: React.ReactNode;
  lede?: React.ReactNode;
  image?: BrandImage;
  priority?: boolean;
  crumbs?: Crumb[];
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-b border-rule bg-paper", className)}>
      <Container>
        <div
          className={cn(
            "grid gap-12 py-14 md:py-20 lg:py-24",
            image && "lg:grid-cols-12 lg:items-center lg:gap-16"
          )}
        >
          <div className={cn("flex flex-col gap-7 animate-rise", image ? "lg:col-span-6" : "max-w-4xl")}>
            {crumbs && crumbs.length > 1 && <Breadcrumbs items={crumbs} />}
            <Eyebrow rule>{eyebrow}</Eyebrow>
            <h1 className="display text-[2.75rem] leading-[0.95] sm:text-6xl lg:text-7xl">
              {title}
              {fade && (
                <>
                  <br />
                  <span className="text-fade">{fade}</span>
                </>
              )}
            </h1>
            {lede && <div className="lede max-w-2xl">{lede}</div>}
            {children}
          </div>
          {image && (
            <div className="lg:col-span-6">
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-paper-2 sm:aspect-[4/3] lg:aspect-[4/5]">
                <Image
                  src={img(image, 1200)}
                  alt={image.alt}
                  fill
                  priority={priority}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
