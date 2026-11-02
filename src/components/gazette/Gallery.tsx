"use client";

import Image from "next/image";
import { images, img, type BrandImage } from "@/content/images";
import type { Page } from "@/content/gazette";
import { Kicker } from "./Prose";
import { Rise } from "./Parallax";

/** Our own photographs from the day, in black and white, turning to colour as you hover. */
export function Gallery({ page, index }: { page: Extract<Page, { kind: "gallery" }>; index: number }) {
  return (
    <section id={`feature-${index}`} className="scroll-mt-14 bg-[#0a0a0a] px-5 py-24 text-white sm:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <Rise className="grid gap-6 border-b border-white/25 pb-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Kicker light>{page.kicker}</Kicker>
            <h2 className="mag-didone mt-5 text-[52px] font-medium leading-[0.92] tracking-[-0.02em] sm:text-[84px]">{page.title}</h2>
          </div>
          <p className="mag-didone text-[21px] italic leading-[1.35] text-white/75 lg:col-span-5">{page.intro}</p>
        </Rise>
        <div className="mt-12 columns-1 gap-6 sm:columns-2 lg:columns-3">
          {page.photos.map((ph, i) => {
            const im: BrandImage = images[ph.imageKey];
            return (
              <Rise key={ph.imageKey} delay={(i % 3) * 80} className="mb-6 break-inside-avoid">
                <figure>
                  <div className="group overflow-hidden">
                    <Image
                      src={img(im, 1200)}
                      alt={im.alt}
                      width={im.width ?? 1200}
                      height={im.height ?? 1600}
                      sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 100vw"
                      className="mag-bw h-auto w-full transition-[filter,transform] duration-700 group-hover:scale-[1.02] group-hover:[filter:none]"
                    />
                  </div>
                  <figcaption className="mag-serif mt-3 border-l border-white/30 pl-3 text-[15px] leading-[1.5] text-white/80">{ph.caption}</figcaption>
                </figure>
              </Rise>
            );
          })}
        </div>
        <p className="mag-caps mt-6 text-[9px] text-white/45">Photographs Trichollective</p>
      </div>
    </section>
  );
}
