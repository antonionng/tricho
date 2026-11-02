import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Pill } from "@/components/site/primitives";
import { images, img } from "@/content/images";
import { authorOf, categoryName, lastUpdated, readingMinutes, type BlogPost } from "@/content/blog";
import { cn } from "@/lib/utils";

export function postDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

function Meta({ post, className }: { post: BlogPost; className?: string }) {
  return (
    <p className={cn("text-[13px] text-muted-foreground", className)}>
      <time dateTime={lastUpdated(post)}>{postDate(lastUpdated(post))}</time>
      <span className="mx-2" aria-hidden>·</span>
      {readingMinutes(post)} minute read
    </p>
  );
}

/** The lead story on the blog page: a large photograph beside the headline and standfirst. */
export function FeaturePost({ post }: { post: BlogPost }) {
  const photo = images[post.image];
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group grid overflow-hidden rounded-3xl border border-rule bg-card lg:grid-cols-12"
    >
      <div className="relative aspect-[4/3] overflow-hidden lg:col-span-7 lg:aspect-auto lg:min-h-[520px]">
        <Image
          src={img(photo, 1600)}
          alt={photo.alt}
          fill
          priority
          sizes="(min-width: 1024px) 58vw, 100vw"
          className="mag-bw object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex flex-col gap-5 p-7 sm:p-10 lg:col-span-5 lg:justify-center lg:p-12">
        <div className="flex flex-wrap gap-2">
          <Pill tone="ink">Featured</Pill>
          <Pill>{categoryName(post.category)}</Pill>
        </div>
        <h2 className="display text-4xl sm:text-5xl">{post.title}</h2>
        <p className="text-[16px] leading-relaxed text-ink-2">{post.standfirst}</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <Meta post={post} />
          <span className="inline-flex items-center gap-2 text-[15px] font-medium">
            Read the post <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** A post in a grid: photograph, category, headline, description. */
export function PostCard({ post, priority }: { post: BlogPost; priority?: boolean }) {
  const photo = images[post.image];
  return (
    <Link href={`/blog/${post.slug}`} className="group flex h-full flex-col">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-paper-2">
        <Image
          src={img(photo, 900)}
          alt={photo.alt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          className="mag-bw object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      </div>
      <p className="label mt-6 text-muted-foreground">{categoryName(post.category)}</p>
      <h3 className="mt-3 text-[1.5rem] font-semibold leading-tight tracking-tight underline-offset-4 group-hover:underline group-hover:decoration-ink/30">
        {post.title}
      </h3>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-2 line-clamp-3">{post.description}</p>
      <Meta post={post} className="mt-auto pt-4" />
    </Link>
  );
}

/** A compact text-only row, for "more in this category" lists. */
export function PostRow({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group flex flex-col gap-2 py-6">
      <p className="label text-muted-foreground">{categoryName(post.category)}</p>
      <p className="text-xl font-semibold leading-snug tracking-tight underline-offset-4 group-hover:underline group-hover:decoration-ink/30">
        {post.title}
      </p>
      <p className="text-[13px] text-muted-foreground">
        {authorOf(post).name} · {readingMinutes(post)} minute read
      </p>
    </Link>
  );
}
