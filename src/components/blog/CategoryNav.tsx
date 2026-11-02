import Link from "next/link";
import { activeCategories, postsIn, type BlogPost } from "@/content/blog";
import { cn } from "@/lib/utils";

/** Topic links across the top of the blog. Real links, so each topic page can be crawled and ranked. */
export function CategoryNav({ posts, current }: { posts: BlogPost[]; current?: string }) {
  const chip = (active: boolean) =>
    cn(
      "inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-[14px] transition-colors",
      active ? "border-ink bg-ink text-paper" : "border-rule bg-card text-ink-2 hover:border-ink/40 hover:text-ink"
    );
  return (
    <nav aria-label="Blog topics" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-2 pb-1 sm:flex-wrap">
        <li>
          <Link href="/blog" className={chip(!current)} aria-current={!current ? "page" : undefined}>
            All posts <span className="opacity-60">{posts.length}</span>
          </Link>
        </li>
        {activeCategories(posts).map((c) => (
          <li key={c.slug}>
            <Link
              href={`/blog/topic/${c.slug}`}
              className={chip(current === c.slug)}
              aria-current={current === c.slug ? "page" : undefined}
            >
              {c.name} <span className="opacity-60">{postsIn(posts, c.slug).length}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
