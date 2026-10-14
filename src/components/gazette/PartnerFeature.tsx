"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { creditLine, images, img } from "@/content/images";
import type { Page } from "@/content/gazette";
import { Body } from "./Prose";
import { Rise } from "./Parallax";
import { Mark } from "./Partners";
import { cn } from "@/lib/utils";

/** A sans brand face (e.g. Kiera's Inter) for the body, pull quotes and callouts. */
const SANS_BODY =
  "[&_.mag-body_p]:font-[family-name:var(--font-inter)]! [&_.mag-serif]:font-[family-name:var(--font-inter)]! [&_.mag-didone]:font-[family-name:var(--font-inter)] [&_.mag-didone]:not-italic [&_.mag-didone]:font-semibold [&_.mag-didone]:tracking-[-0.02em]";

const DEFAULT = { paper: "#fbfaf7", ink: "#0a0a0a", accent: "#d8d2c4", sans: false };

/**
 * A labelled partner feature, set in the partner's own colours. Every one carries the
 * "Partner feature" label, and any connection to Trichollective is stated beneath it.
 */
export function PartnerFeature({ page, index }: { page: Extract<Page, { kind: "partner" }>; index: number }) {
  const t = { ...DEFAULT, ...page.theme };
  const head = t.sans ? "font-[family-name:var(--font-inter)] font-semibold tracking-[-0.035em]" : "mag-didone font-medium tracking-[-0.02em]";
  const photo = page.imageKey ? images[page.imageKey] : null;
  const p = page.partner;

  return (
    <section
      id={`feature-${index}`}
      className="scroll-mt-14"
      style={{ "--pf-paper": t.paper, "--pf-ink": t.ink, "--pf-accent": t.accent, "--pf-on-accent": t.onAccent ?? t.ink } as React.CSSProperties}
    >
      {/* Opening: the partner's ink, a soft wash of their accent. */}
      <div
        className="relative overflow-hidden bg-[var(--pf-ink)] text-[var(--pf-paper)]"
        style={{ backgroundImage: `radial-gradient(ellipse 70% 60% at 85% 15%, ${t.accent}26, transparent 70%)` }}
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-24 sm:px-10 md:pt-32 lg:grid-cols-12 lg:items-end lg:pb-24">
          <Rise className={cn(photo ? "lg:col-span-7" : "lg:col-span-10")}>
            <div className="flex flex-wrap items-center gap-4">
              <span className="mag-caps rounded-full bg-[var(--pf-accent)] px-3 py-1.5 text-[9px] text-[var(--pf-on-accent)]">Partner feature</span>
              <span className="mag-caps text-[9px] opacity-70">{page.kicker}</span>
            </div>
            <div className="mt-10 flex h-14 items-center">
              <Mark entry={p} invert={p.invertLogo} />
            </div>
            <h2 className={cn("mt-8 leading-[0.95]", head)} style={{ fontSize: "clamp(44px, 7vw, 96px)" }}>
              {page.title}
            </h2>
            <p className={cn("mt-6 max-w-2xl leading-[1.35] opacity-85", t.sans ? "text-[20px] sm:text-[23px]" : "mag-didone text-[22px] italic sm:text-[26px]")}>
              {page.standfirst}
            </p>
          </Rise>
          {photo && (
            <Rise delay={120} className="lg:col-span-5">
              <figure>
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image src={img(photo, 1200)} alt={photo.alt} fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
                </div>
                <figcaption className="mag-caps mt-3 text-[8.5px] opacity-60">{creditLine(photo)}</figcaption>
              </figure>
            </Rise>
          )}
        </div>
      </div>

      {/* The story, on the partner's paper. */}
      <div className="bg-[var(--pf-paper)] px-5 py-20 text-[var(--pf-ink)] sm:px-10 md:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-12">
          <div className={cn("lg:col-span-7", t.sans && SANS_BODY)}>
            <Body blocks={page.blocks} drop={!t.sans} wide />
          </div>
          <aside className="lg:col-span-4 lg:col-start-9">
            <div className="lg:sticky lg:top-24">
              {page.facts && page.facts.length > 0 && (
                <dl className="border-t-2 border-[var(--pf-ink)]">
                  {page.facts.map((f) => (
                    <div key={f.label} className="border-b border-[var(--pf-ink)]/15 py-4">
                      <dt className="mag-caps text-[9px] opacity-60">{f.label}</dt>
                      <dd className={cn("mt-1.5 text-[19px] leading-snug", t.sans ? "font-[family-name:var(--font-inter)] font-medium" : "mag-didone")}>{f.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <div className="mt-8 flex flex-col items-start gap-4">
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--pf-ink)] px-6 text-[14px] font-medium text-[var(--pf-paper)] transition-opacity hover:opacity-90"
                >
                  {p.ctaLabel} <ArrowUpRight className="h-4 w-4" />
                </a>
                {p.href && (
                  <Link href={p.href} className="mag-caps inline-flex items-center gap-1.5 text-[9px] underline underline-offset-4">
                    Their partner page on Trichollective <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
              {page.disclosure && <p className="mag-serif mt-8 border-l-2 border-[var(--pf-accent)] pl-4 text-[14px] italic leading-[1.55] opacity-80">{page.disclosure}</p>}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
