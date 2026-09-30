"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, BookOpen, Lock } from "lucide-react";
import { editionLabel, pageKicker, pageTitle, type Block, type Edition, type Page } from "@/content/gazette";
import { BlockView } from "./Blocks";
import { ParallaxImage, Rise } from "./Parallax";
import { artFor, coverImage, img } from "./art";
import { gazetteFonts } from "./fonts";
import { cn } from "@/lib/utils";

const DISCIPLINE = { cosmetic: "Cosmetic", clinical: "Clinical · Trichology", medical: "Medical" } as const;

/* ------------------------------------------------------------------ */
/* Body copy                                                           */
/* ------------------------------------------------------------------ */
function Body({ blocks, drop = true, wide = false }: { blocks: Block[]; drop?: boolean; wide?: boolean }) {
  const capIndex = drop ? blocks.findIndex((b) => b.type === "p") : -1;
  return (
    <div className="mag-body mag-web">
      {blocks.map((b, i) =>
        b.type === "pull" ? (
          <Rise key={i} className={cn("my-14", wide ? "" : "md:-mx-24 lg:-mx-40")}>
            <blockquote className="text-center">
              <span className="mag-didone block text-[72px] leading-[0.4]">&ldquo;</span>
              <p className="mag-didone mt-4 text-[34px] italic leading-[1.08] tracking-[-0.01em] sm:text-[46px]">{b.text}</p>
              <span className="mx-auto mt-6 block h-px w-14 bg-black" />
            </blockquote>
          </Rise>
        ) : (
          <div key={i} className="flow-root">
            <BlockView block={b} drop={i === capIndex} />
          </div>
        )
      )}
    </div>
  );
}

function Kicker({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return <p className={cn("mag-caps text-[10px] sm:text-[11px]", light ? "text-white/80" : "text-black/60")}>{children}</p>;
}

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */
function ArticleHero({ edition, page, index }: { edition: Edition; page: Extract<Page, { kind: "article" }>; index: number }) {
  const art = artFor(edition, page, index);
  return (
    <section id={`feature-${index}`} className="scroll-mt-14">
      <ParallaxImage src={img(art, 2000)} alt={art.alt} className="h-[100svh]" priority={index === 0}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/80" />
        <div className="absolute inset-x-0 bottom-0 px-5 pb-14 text-white sm:px-10 lg:px-16 lg:pb-20">
          <Rise>
            <Kicker light>{page.kicker}</Kicker>
          </Rise>
          <Rise delay={80}>
            <h2
              className="mag-didone mt-5 max-w-5xl font-medium leading-[0.88] tracking-[-0.025em]"
              style={{ fontSize: "clamp(44px, min(9vw, 10svh), 132px)" }}
            >
              {page.title}
            </h2>
          </Rise>
          <Rise delay={160}>
            <p className="mag-didone mt-6 max-w-2xl italic leading-[1.3] text-white/85" style={{ fontSize: "clamp(19px, 3svh, 26px)" }}>
              {page.standfirst}
            </p>
          </Rise>
          <p className="mag-caps mt-8 text-[9px] text-white/55">Photograph {art.credit} / Unsplash</p>
        </div>
      </ParallaxImage>
      <div className="bg-[#fbfaf7] px-5 py-20 sm:px-10 md:py-28">
        <div className="mx-auto max-w-[680px]">
          <p className="mag-caps mb-10 text-[9px] text-black/50">Words by the Trichollective editorial team</p>
          <Body blocks={page.blocks} />
        </div>
      </div>
    </section>
  );
}

function ArticleSplit({ edition, page, index }: { edition: Edition; page: Extract<Page, { kind: "article" }>; index: number }) {
  const art = artFor(edition, page, index);
  return (
    <section id={`feature-${index}`} className="scroll-mt-14 bg-[#fbfaf7]">
      <div className="lg:grid lg:grid-cols-2">
        {/* The photograph stays put while the story scrolls past it. */}
        <div className="relative h-[80svh] lg:sticky lg:top-0 lg:h-[100svh]">
          <Image src={img(art, 1600)} alt={art.alt} fill sizes="(min-width:1024px) 50vw, 100vw" className="mag-bw object-cover" />
          <p className="mag-caps absolute bottom-6 left-6 text-[9px] text-white/70">Photograph {art.credit} / Unsplash</p>
        </div>
        <div className="px-5 py-16 sm:px-10 lg:px-16 lg:py-28">
          <Rise>
            <Kicker>{page.kicker}</Kicker>
          </Rise>
          <Rise delay={80}>
            <h2 className="mag-didone mt-5 text-[52px] font-medium leading-[0.92] tracking-[-0.02em] sm:text-[68px]">{page.title}</h2>
          </Rise>
          <Rise delay={140}>
            <p className="mag-didone mt-6 text-[22px] italic leading-[1.3] text-black/80">{page.standfirst}</p>
          </Rise>
          <span className="my-10 block h-px w-14 bg-black" />
          <div className="max-w-[620px]">
            <Body blocks={page.blocks} wide />
          </div>
        </div>
      </div>
    </section>
  );
}

function Letter({ page, index }: { page: Extract<Page, { kind: "letter" }>; index: number }) {
  return (
    <section id={`feature-${index}`} className="scroll-mt-14 bg-[#fbfaf7] px-5 py-24 sm:px-10 md:py-36">
      <div className="mx-auto max-w-[680px]">
        <Rise className="text-center">
          <Kicker>From the editors</Kicker>
          <h2 className="mag-didone mt-6 text-[54px] italic leading-[0.95] sm:text-[76px]">{page.title}</h2>
          <span className="mx-auto mt-10 block h-px w-14 bg-black" />
        </Rise>
        <div className="mt-12">
          <Body blocks={page.blocks} />
          <p className="mag-didone mt-8 text-right text-[24px] italic">{page.signoff}</p>
        </div>
      </div>
    </section>
  );
}

function Spread({ edition, page, index }: { edition: Edition; page: Extract<Page, { kind: "image" }>; index: number }) {
  const art = artFor(edition, page, index);
  return (
    <section id={`feature-${index}`} className="scroll-mt-14">
      <ParallaxImage src={img(art, 2000)} alt={art.alt} className="h-[92svh]" strength={0.22}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <Rise className="absolute inset-x-0 bottom-0 px-5 pb-14 text-white sm:px-10 lg:px-16">
          <span className="mb-6 block h-px w-14 bg-white" />
          <p className="mag-didone max-w-4xl text-[30px] italic leading-[1.15] sm:text-[44px]">{page.caption}</p>
          <p className="mag-caps mt-6 text-[9px] text-white/55">Photograph {art.credit} / Unsplash</p>
        </Rise>
      </ParallaxImage>
    </section>
  );
}

function Glance({ page, index }: { page: Extract<Page, { kind: "glance" }>; index: number }) {
  return (
    <section id={`feature-${index}`} className="scroll-mt-14 bg-[#0a0a0a] px-5 py-24 text-white sm:px-10 md:py-32">
      <div className="mx-auto max-w-6xl">
        <Rise>
          <Kicker light>{page.kicker}</Kicker>
          <h2 className="mag-didone mt-5 max-w-4xl text-[48px] font-medium leading-[0.95] tracking-[-0.02em] sm:text-[72px]">{page.title}</h2>
        </Rise>
        <ol className="mt-16 border-t border-white/25">
          {page.rows.map((r, i) => (
            <Rise key={r.label} delay={i * 50}>
              <li className="grid gap-3 border-b border-white/15 py-7 md:grid-cols-12 md:gap-8">
                <span className="mag-didone text-[44px] leading-none text-white/35 md:col-span-1">{String(i + 1).padStart(2, "0")}</span>
                <p className="mag-caps text-[10px] text-white/60 md:col-span-3 md:pt-3">{r.label}</p>
                <p className="mag-serif text-[19px] leading-[1.55] text-white/90 md:col-span-8 md:pt-1">{r.value}</p>
              </li>
            </Rise>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Interactive({ page, index }: { page: Extract<Page, { kind: "interactive" }>; index: number }) {
  return (
    <section id={`feature-${index}`} className="scroll-mt-14 bg-[#efeee9] px-5 py-24 sm:px-10 md:py-32">
      <div className="mx-auto max-w-[760px]">
        <Rise className="text-center">
          <Kicker>{page.kicker}</Kicker>
          <h2 className="mag-didone mt-5 text-[52px] font-medium leading-[0.95] tracking-[-0.02em] sm:text-[72px]">{page.title}</h2>
          <p className="mag-didone mx-auto mt-6 max-w-xl text-[22px] italic leading-[1.3] text-black/75">{page.intro}</p>
        </Rise>
        <div className="mt-14">
          <Body blocks={page.blocks} drop={false} />
        </div>
      </div>
    </section>
  );
}

function Perspectives({ edition, page, index }: { edition: Edition; page: Extract<Page, { kind: "perspectives" }>; index: number }) {
  return (
    <section id={`feature-${index}`} className="scroll-mt-14 bg-[#fbfaf7] px-5 py-24 sm:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <Rise className="max-w-4xl">
          <Kicker>{page.kicker}</Kicker>
          <h2 className="mag-didone mt-5 text-[52px] font-medium leading-[0.92] tracking-[-0.02em] sm:text-[80px]">{page.title}</h2>
          <p className="mag-didone mt-6 text-[22px] italic leading-[1.3] text-black/75">{page.intro}</p>
        </Rise>
        <div className="mt-16 grid gap-12 lg:grid-cols-3 lg:gap-10">
          {page.views.map((v, vi) => {
            const art = artFor(edition, page, index * 3 + vi + 11);
            return (
              <Rise key={v.discipline} delay={vi * 100}>
                <article>
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <Image src={img(art, 900)} alt={art.alt} fill sizes="(min-width:1024px) 30vw, 100vw" className="mag-bw object-cover transition-transform duration-[1.2s] hover:scale-[1.04]" />
                    <p className="mag-caps absolute left-4 top-4 bg-[#fbfaf7] px-2.5 py-1.5 text-[9px]">{DISCIPLINE[v.discipline]}</p>
                  </div>
                  <h3 className="mag-didone mt-6 text-[30px] italic leading-[1.05]">{v.heading}</h3>
                  <div className="mt-4">
                    <Body blocks={v.blocks} drop={false} wide />
                  </div>
                </article>
              </Rise>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Dispatches({ page, index }: { page: Extract<Page, { kind: "news" }>; index: number }) {
  return (
    <section id={`feature-${index}`} className="scroll-mt-14 bg-[#fbfaf7] px-5 py-24 sm:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <Rise className="flex flex-col gap-4 border-b-2 border-black pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Kicker>{page.kicker}</Kicker>
            <h2 className="mag-didone mt-4 text-[56px] font-medium leading-[0.9] tracking-[-0.02em] sm:text-[88px]">Dispatches</h2>
          </div>
          <p className="mag-didone max-w-md text-[19px] italic leading-snug text-black/70">{page.intro}</p>
        </Rise>
        <div className="grid md:grid-cols-2 lg:grid-cols-3">
          {page.items.map((n, i) => (
            <Rise key={n.id} delay={i * 60}>
              <article className={cn("h-full border-b border-black/20 py-8 md:px-6", i % 3 !== 0 && "lg:border-l", i % 2 !== 0 && "md:border-l lg:border-l-0", i % 3 !== 0 && "lg:border-l")}>
                <p className="mag-caps text-[9px] text-black/50">
                  {n.date.split("-").reverse().join(".")} · {n.source}
                </p>
                <h3 className="mag-didone mt-3 text-[26px] leading-[1.08]">{n.headline}</h3>
                <p className="mag-serif mt-4 text-[16px] leading-[1.6] text-black/80">{n.summary}</p>
                <p className="mag-serif mt-4 border-l border-black pl-4 text-[15px] italic leading-[1.55]">{n.whyItMatters}</p>
                <a href={n.url} target="_blank" rel="noopener nofollow" className="mag-caps mt-5 inline-flex items-center gap-1.5 text-[9px] underline underline-offset-4">
                  Read the source <ArrowRight className="h-3 w-3" />
                </a>
              </article>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  );
}

function Section({ edition, page, index, articleCount }: { edition: Edition; page: Page; index: number; articleCount: number }) {
  switch (page.kind) {
    case "article":
      return articleCount % 2 === 0 ? <ArticleHero edition={edition} page={page} index={index} /> : <ArticleSplit edition={edition} page={page} index={index} />;
    case "letter":
      return <Letter page={page} index={index} />;
    case "image":
      return <Spread edition={edition} page={page} index={index} />;
    case "glance":
      return <Glance page={page} index={index} />;
    case "interactive":
      return <Interactive page={page} index={index} />;
    case "perspectives":
      return <Perspectives edition={edition} page={page} index={index} />;
    case "news":
      return <Dispatches page={page} index={index} />;
  }
}

/* ------------------------------------------------------------------ */
/* The edition                                                         */
/* ------------------------------------------------------------------ */
export function ScrollEdition({
  edition,
  lockedTitles,
  signedIn,
  coverLines,
  nextEdition,
  onPrint,
}: {
  edition: Edition;
  lockedTitles: { kicker: string; title: string }[];
  signedIn: boolean;
  coverLines: string[];
  nextEdition?: Edition;
  onPrint?: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
      setSolid(window.scrollY > window.innerHeight * 0.85);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cover = coverImage(edition);
  const published = new Date(edition.published).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  let articles = 0;

  return (
    <div className={cn("mag bg-[#fbfaf7] text-black", gazetteFonts)}>
      {/* Top bar */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
          solid ? "bg-[#fbfaf7]/92 text-black backdrop-blur-xl" : "bg-transparent text-white"
        )}
      >
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-8">
          <Link href="/trichozette" className="mag-caps inline-flex items-center gap-2 text-[10px]">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Trichozette</span>
          </Link>
          <p className={cn("mag-didone truncate text-[18px] italic transition-opacity", solid ? "opacity-100" : "opacity-0")}>{edition.title}</p>
          <div className="flex items-center gap-5">
            {onPrint && (
              <button type="button" onClick={onPrint} className="mag-caps hidden items-center gap-2 text-[10px] lg:inline-flex">
                <BookOpen className="h-4 w-4" /> Print edition
              </button>
            )}
            <Link href="/" className="mag-caps text-[10px]">Trichollective</Link>
          </div>
        </div>
        <div className="h-px bg-current/15">
          <div className="h-px bg-current" style={{ width: `${progress * 100}%` }} />
        </div>
      </header>

      {/* Cover */}
      <ParallaxImage src={img(cover, 2200)} alt={cover.alt} className="h-[100svh]" priority strength={0.12}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/5 to-black/70" />
        <div className="absolute inset-x-0 top-16 flex justify-between px-5 mag-caps text-[9px] text-white/80 sm:px-10 sm:text-[10px]">
          <span>{editionLabel(edition)}</span>
          <span>{published}</span>
          <span className="hidden sm:inline">Trichollective</span>
        </div>
        <h1
          className="mag-didone absolute inset-x-0 top-[5.5rem] animate-rise text-center font-medium uppercase leading-[0.8] tracking-[-0.02em] text-white"
          style={{ fontSize: "min(13.6vw, 17svh)" }}
        >
          Trichozette
        </h1>
        <div className="absolute left-5 top-[48%] hidden w-[30vw] max-w-sm flex-col gap-6 text-white sm:flex sm:left-10">
          {coverLines.map((l, i) => (
            <div key={l} className="animate-rise" style={{ animationDelay: `${300 + i * 120}ms` }}>
              <p className="mag-caps text-[10px] text-white/70">{i === 0 ? "Inside" : "Plus"}</p>
              <p className="mag-didone mt-1.5 text-[26px] italic leading-[1.05]">{l}</p>
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 px-5 pb-10 text-white sm:px-10 sm:pb-14">
          <p className="mag-caps text-[10px] text-white/75">{edition.theme}</p>
          <p className="mag-didone mt-3 font-medium leading-[0.86] tracking-[-0.025em]" style={{ fontSize: "min(14vw, 11svh)" }}>
            {edition.title}
          </p>
          <div className="mt-4 flex items-end justify-between gap-6">
            <p className="mag-didone max-w-2xl italic leading-[1.2] text-white/85" style={{ fontSize: "clamp(20px, 3.4svh, 32px)" }}>
              {edition.fade}
            </p>
            <a href="#contents" className="mag-caps hidden shrink-0 items-center gap-2 text-[10px] text-white/80 sm:inline-flex">
              Scroll to read <ArrowDown className="h-4 w-4 animate-bounce" />
            </a>
          </div>
        </div>
      </ParallaxImage>

      {/* Contents */}
      <section id="contents" className="scroll-mt-14 border-b border-black px-5 py-20 sm:px-10 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-12">
            <Rise className="lg:col-span-4">
              <h2 className="mag-didone text-[64px] font-medium leading-[0.85] tracking-[-0.02em] sm:text-[96px]">Contents</h2>
              <p className="mag-didone mt-6 text-[21px] italic leading-[1.35] text-black/75">{edition.standfirst}</p>
            </Rise>
            <ol className="lg:col-span-8">
              {[...edition.pages.map((p, i) => ({ kicker: pageKicker(p), title: pageTitle(p), href: `#feature-${i}`, locked: false })), ...lockedTitles.map((l) => ({ ...l, href: "#members", locked: true }))].map((c, i) => (
                <li key={i} className="border-t border-black/15 last:border-b">
                  <a href={c.href} className="group grid grid-cols-12 items-baseline gap-3 py-4">
                    <span className="mag-didone col-span-2 text-[32px] leading-none sm:col-span-1">{String(i + 1).padStart(2, "0")}</span>
                    <span className="mag-caps col-span-10 text-[9px] text-black/50 sm:col-span-3">{c.kicker}</span>
                    <span className="mag-didone col-span-12 text-[24px] leading-tight transition-all group-hover:italic sm:col-span-7">{c.title}</span>
                    <span className="col-span-12 sm:col-span-1 sm:text-right">
                      {c.locked ? <Lock className="inline h-3.5 w-3.5 text-black/40" /> : <ArrowRight className="inline h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Features */}
      {edition.pages.map((page, i) => {
        const n = page.kind === "article" ? articles++ : articles;
        return <Section key={i} edition={edition} page={page} index={i} articleCount={n} />;
      })}

      {/* Members gate */}
      {lockedTitles.length > 0 && (
        <section id="members" className="relative scroll-mt-14 bg-[#0a0a0a] text-white">
          <div className="pointer-events-none absolute inset-x-0 -top-64 h-64 bg-gradient-to-b from-transparent to-[#0a0a0a]" />
          <div className="mx-auto grid max-w-7xl gap-14 px-5 py-28 sm:px-10 md:py-36 lg:grid-cols-12">
            <Rise className="lg:col-span-6">
              <Kicker light>Members only</Kicker>
              <h2 className="mag-didone mt-6 text-[64px] font-medium leading-[0.88] tracking-[-0.02em] sm:text-[104px]">
                The story
                <br />
                <span className="font-normal italic">continues.</span>
              </h2>
              <p className="mag-serif mt-8 max-w-lg text-[19px] leading-[1.6] text-white/75">
                Members read every edition of Trichozette in full, with a new edition each month, Karley&apos;s column,
                the Three Perspectives and the news that matters to your practice.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <Link href="/founding" className="inline-flex h-14 items-center gap-2 rounded-full bg-white px-8 text-[15px] font-medium text-black transition-opacity hover:opacity-90">
                  Become a founding member <ArrowRight className="h-4 w-4" />
                </Link>
                {!signedIn && (
                  <Link href={`/login?next=/trichozette/${edition.slug}`} className="mag-caps text-[10px] underline underline-offset-4">
                    Sign in
                  </Link>
                )}
              </div>
            </Rise>
            <ol className="lg:col-span-5 lg:col-start-8 border-t border-white/25">
              {lockedTitles.map((l, i) => (
                <Rise key={l.title} delay={i * 50}>
                  <li className="flex items-baseline gap-4 border-b border-white/15 py-4">
                    <Lock className="h-3.5 w-3.5 shrink-0 translate-y-0.5 text-white/40" />
                    <span>
                      <span className="mag-caps block text-[9px] text-white/45">{l.kicker}</span>
                      <span className="mag-didone mt-1 block text-[24px] italic leading-tight">{l.title}</span>
                    </span>
                  </li>
                </Rise>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Next edition */}
      {nextEdition && (
        <Link href={`/trichozette/${nextEdition.slug}`} className="group block">
          <ParallaxImage src={img(coverImage(nextEdition), 2000)} alt="" className="h-[70svh]" strength={0.15}>
            <div className="absolute inset-0 bg-black/45 transition-colors group-hover:bg-black/35" />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center text-white">
              <p className="mag-caps text-[10px] text-white/75">Next · {editionLabel(nextEdition)}</p>
              <p className="mag-didone mt-5 text-[14vw] font-medium leading-[0.88] tracking-[-0.02em] sm:text-[8vw]">{nextEdition.title}</p>
              <p className="mag-didone mt-4 text-[22px] italic text-white/85 sm:text-[28px]">{nextEdition.fade}</p>
            </div>
          </ParallaxImage>
        </Link>
      )}
    </div>
  );
}
