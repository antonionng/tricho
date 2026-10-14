"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Edition, Page, PartnerEntry } from "@/content/gazette";
import { Kicker } from "./Prose";
import { Rise } from "./Parallax";
import { cn } from "@/lib/utils";

/** A partner's logo when we hold one, otherwise their name set as a wordmark. */
export function Mark({ entry, large, invert }: { entry: Pick<PartnerEntry, "name" | "logo">; large?: boolean; invert?: boolean }) {
  if (entry.logo)
    return (
      // Partner logos come from anywhere, so a plain img rather than next/image.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={entry.logo}
        alt={entry.name}
        loading="lazy"
        className={cn("object-contain object-left", large ? "max-h-20 max-w-[280px]" : "max-h-12 max-w-[180px]", invert && "brightness-0 invert")}
      />
    );
  return <span className={cn("mag-didone font-medium leading-none tracking-[-0.01em]", large ? "text-[44px] sm:text-[72px]" : "text-[34px]")}>{entry.name}</span>;
}

/** "Brought to you by", with the supporting partner's logo, linking to their partner page or site. */
export function BroughtBy({ by, light }: { by: NonNullable<Edition["supportedBy"]>; light?: boolean }) {
  const body = (
    <>
      <span className={cn("mag-caps text-[9px]", light ? "text-white/75" : "text-black/55")}>Brought to you by</span>
      <span className="flex h-10 items-center [&_img]:max-h-10 [&_span]:text-[28px]">
        <Mark entry={by} />
      </span>
    </>
  );
  const cls = "inline-flex flex-col items-start gap-2 transition-opacity hover:opacity-85";
  return by.href ? (
    <Link href={by.href} className={cls}>
      {body}
    </Link>
  ) : (
    <a href={by.url} target="_blank" rel="noopener" className={cls}>
      {body}
    </a>
  );
}

function host(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function Links({ entry, light }: { entry: PartnerEntry; light?: boolean }) {
  return (
    <div className={cn("mag-caps mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[9px]", light ? "text-white/80" : "text-black/70")}>
      {entry.href && (
        <Link href={entry.href} className="inline-flex items-center gap-1.5 underline underline-offset-4">
          Their partner page <ArrowRight className="h-3 w-3" />
        </Link>
      )}
      <a href={entry.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 underline underline-offset-4">
        {host(entry.url)} <ArrowUpRight className="h-3 w-3" />
      </a>
    </div>
  );
}

/** The sponsor and every exhibitor on one page, with a thank-you to the people who came. */
export function Partners({ page, index }: { page: Extract<Page, { kind: "partners" }>; index: number }) {
  const s = page.sponsor;
  return (
    <section id={`feature-${index}`} className="scroll-mt-14 bg-[#fbfaf7] px-5 py-24 sm:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <Rise className="max-w-4xl">
          <Kicker>{page.kicker}</Kicker>
          <h2 className="mag-didone mt-5 text-[52px] font-medium leading-[0.92] tracking-[-0.02em] sm:text-[80px]">{page.title}</h2>
          <p className="mag-didone mt-6 text-[22px] italic leading-[1.3] text-black/75">{page.intro}</p>
        </Rise>

        <Rise className="mt-14">
          <article className="grid gap-8 bg-[#0a0a0a] p-6 text-white sm:p-12 lg:grid-cols-12 lg:items-center">
            <div className="min-w-0 lg:col-span-5">
              <p className="mag-caps text-[10px] text-white/60">Event sponsor</p>
              <div className={cn("mt-5 inline-flex min-h-20 items-center", s.logo && "rounded-sm bg-white px-5 py-3")}>
                <Mark entry={s} large />
              </div>
            </div>
            <div className="min-w-0 lg:col-span-7">
              <p className="mag-serif text-[18px] leading-[1.65] text-white/85">{s.note}</p>
              <Links entry={s} light />
            </div>
          </article>
        </Rise>

        <p className="mag-caps mt-16 pb-3 text-[10px]">Exhibitors</p>
        <Rise className="grid gap-px border border-black/15 bg-black/15 md:grid-cols-2 lg:grid-cols-3">
          {page.exhibitors.map((e) => (
            <div key={e.name} className="bg-[#fbfaf7]">
              <article className="flex h-full flex-col p-7 sm:p-8">
                <div className="flex h-14 items-center">
                  <Mark entry={e} />
                </div>
                {e.people && <p className="mag-caps mt-5 text-[9px] text-black/50">With {e.people}</p>}
                <p className="mag-serif mt-3 text-[16px] leading-[1.6] text-black/85">{e.note}</p>
                <div className="mt-auto">
                  <Links entry={e} />
                </div>
              </article>
            </div>
          ))}
          <div className="bg-[#efeee9]">
            <Link href="/for-business" className="group flex h-full flex-col justify-between bg-[#efeee9] p-8 transition-colors hover:bg-[#e6e4dc]">
              <p className="mag-caps text-[9px] text-black/55">For brands and clinics</p>
              <p className="mag-didone mt-6 text-[30px] italic leading-[1.08]">Meet the practitioners who recommend products to their clients at our next event.</p>
              <span className="mag-caps mt-6 inline-flex items-center gap-1.5 text-[9px] underline underline-offset-4">
                Partner with Trichollective <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
        </Rise>
      </div>
    </section>
  );
}
