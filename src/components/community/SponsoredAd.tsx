import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { images, img } from "@/content/images";
import type { CommunityAd } from "@/content/community-ads";

/** The LIVDOR banner wordmark: spaced capitals in a hairline box. */
function Wordmark({ name }: { name: string }) {
  return (
    <span className="inline-block border border-white/70 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.42em] text-white">
      {name}
    </span>
  );
}

/**
 * A labelled sponsored card. `side` is a tall poster for the sidebar; `feed` is a wide banner between posts.
 * Dark, with the product glowing out of it. Always carries "Sponsored by".
 */
export function SponsoredAd({ ad, variant }: { ad: CommunityAd; variant: "side" | "feed" }) {
  const image = images[ad.imageKey];
  const feed = variant === "feed";
  return (
    <aside
      aria-label={`Sponsored by ${ad.sponsor}`}
      className="group relative isolate overflow-hidden rounded-3xl bg-[#080b14] text-white shadow-[0_20px_50px_-24px_rgba(255,40,30,0.55)] ring-1 ring-white/10"
    >
      {/* the glow behind the cap */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -z-10 rounded-full bg-[radial-gradient(closest-side,rgba(255,45,35,0.55),rgba(255,45,35,0)_70%)] blur-2xl motion-safe:animate-pulse ${
          feed ? "-right-16 top-1/2 h-[120%] w-[60%] -translate-y-1/2" : "left-1/2 top-4 h-64 w-64 -translate-x-1/2"
        }`}
      />

      <div className={feed ? "grid sm:grid-cols-[1fr_300px]" : "flex flex-col"}>
        {/* photo: sits first in the side poster, last (right) in the banner */}
        <div className={`relative ${feed ? "order-1 aspect-[16/10] sm:order-2 sm:aspect-auto" : "aspect-square"}`}>
          {image && (
            <Image
              src={img(image)}
              alt={ad.imageAlt}
              fill
              sizes={feed ? "(min-width: 640px) 300px, 100vw" : "220px"}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          )}
          <div
            aria-hidden
            className={`absolute inset-0 ${
              feed
                ? "bg-gradient-to-t from-[#080b14] via-transparent to-transparent sm:bg-gradient-to-r sm:from-[#080b14] sm:via-[#080b14]/10 sm:to-transparent"
                : "bg-gradient-to-t from-[#080b14] via-[#080b14]/10 to-transparent"
            }`}
          />
        </div>

        <div className={`relative flex flex-col ${feed ? "order-2 gap-3 p-5 sm:order-1 sm:p-7" : "-mt-10 gap-2.5 px-4 pb-4"}`}>
          <div className="flex items-center justify-between gap-3">
            <Wordmark name={ad.sponsor} />
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-white/55">Sponsored</span>
          </div>
          {ad.kicker && <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#ff6b5e]">{ad.kicker}</p>}
          <h3
            className={`font-semibold tracking-[-0.02em] text-white ${
              feed ? "text-[22px] leading-[1.1] sm:text-[28px]" : "text-[17px] leading-[1.15]"
            }`}
          >
            {ad.headline}
          </h3>
          <p className={`leading-relaxed text-white/70 ${feed ? "max-w-md text-[14px]" : "text-[12.5px]"}`}>{ad.body}</p>
          <Link
            href={ad.href}
            className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-[#080b14] transition-colors hover:bg-[#ffd9d4] after:absolute after:inset-0 after:rounded-3xl"
          >
            {ad.cta} <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
