"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { img, type BrandImage } from "@/content/images";
import { editionLabel, pageKicker, pageTitle, type Block, type Edition, type Page } from "@/content/gazette";
import type { NewsItem } from "@/content/news";
import { BlockView } from "./Blocks";
import { Cover } from "./Cover";
import { artFor, coverImage } from "./art";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Geometry: pages are laid out at A4 (96dpi) and scaled to fit.       */
/* ------------------------------------------------------------------ */
export type Geo = {
  key: string;
  W: number;
  H: number;
  padX: number;
  padTop: number;
  padBottom: number;
  gap: number;
  cols: 1 | 2;
  colW: number;
  bodyH: number;
  fullW: number;
  pocket: boolean;
};

/** A4 at 96dpi, two columns: the printed magazine. */
export const PRINT: Geo = (() => {
  const W = 794, H = 1123, padX = 58, padTop = 78, padBottom = 76, gap = 30;
  return { key: "print", W, H, padX, padTop, padBottom, gap, cols: 2, colW: (W - padX * 2 - gap) / 2, bodyH: H - padTop - padBottom, fullW: W - padX * 2, pocket: false };
})();

/** Phones: one column, the screen's own shape, larger type. Same design language. */
export function pocketGeo(aspect: number): Geo {
  const W = 560;
  const H = Math.max(820, Math.round((W * aspect) / 20) * 20);
  const padX = 34, padTop = 70, padBottom = 64;
  return { key: `pocket-${H}`, W, H, padX, padTop, padBottom, gap: 0, cols: 1, colW: W - padX * 2, bodyH: H - padTop - padBottom, fullW: W - padX * 2, pocket: true };
}

/* ------------------------------------------------------------------ */
/* Units: the smallest things we place in a column.                    */
/* ------------------------------------------------------------------ */
type Unit =
  | { t: "block"; block: Block; drop?: boolean }
  | { t: "sub"; label: string; heading: string }
  | { t: "glance"; label: string; value: string }
  | { t: "news"; item: NewsItem }
  | { t: "signoff"; text: string };

type Header = { kicker: string; title: string; standfirst?: string; tone: "article" | "section" | "letter" };

export type Sheet =
  | { k: "cover" }
  | { k: "contents" }
  | { k: "opener"; page: Extract<Page, { kind: "article" }>; image: BrandImage }
  | { k: "image"; page: Extract<Page, { kind: "image" }> }
  | { k: "flow"; header?: Header; cols: Unit[][]; running: string }
  | { k: "gate" };

/** Split long paragraphs at sentence boundaries so columns pack tightly. */
function splitParagraph(text: string, max = 62): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) ?? [text];
  const out: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + s).split(/\s+/).length > max && cur) {
      out.push(cur.trim());
      cur = s;
    } else cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function blocksToUnits(blocks: Block[], drop = true): Unit[] {
  const units: Unit[] = [];
  let dropped = !drop;
  for (const b of blocks) {
    if (b.type === "p") {
      splitParagraph(b.text).forEach((chunk, i) => {
        units.push({ t: "block", block: { type: "p", text: chunk }, drop: !dropped && i === 0 });
      });
      dropped = true;
    } else units.push({ t: "block", block: b });
  }
  return units;
}

type Plan = { opener?: Sheet; header?: Header; units: Unit[]; single?: Sheet; running: string };

function planPage(edition: Edition, page: Page, index: number): Plan {
  const running = pageKicker(page);
  switch (page.kind) {
    case "image":
      return { single: { k: "image", page }, units: [], running };
    case "article": {
      return { opener: { k: "opener", page, image: artFor(edition, page, index) }, units: blocksToUnits(page.blocks), running };
    }
    case "letter":
      return {
        header: { kicker: "From the editors", title: page.title, tone: "letter" },
        units: [...blocksToUnits(page.blocks), { t: "signoff", text: page.signoff }],
        running: "Letter",
      };
    case "interactive":
      return { header: { kicker: page.kicker, title: page.title, standfirst: page.intro, tone: "section" }, units: blocksToUnits(page.blocks, false), running };
    case "glance":
      return { header: { kicker: page.kicker, title: page.title, tone: "section" }, units: page.rows.map((r) => ({ t: "glance", label: r.label, value: r.value })), running };
    case "news":
      return { header: { kicker: page.kicker, title: page.title, standfirst: page.intro, tone: "section" }, units: page.items.map((item) => ({ t: "news", item })), running };
    case "perspectives": {
      const label = { cosmetic: "Cosmetic", clinical: "Clinical · Trichology", medical: "Medical" } as const;
      return {
        header: { kicker: page.kicker, title: page.title, standfirst: page.intro, tone: "section" },
        units: page.views.flatMap((v) => [{ t: "sub" as const, label: label[v.discipline], heading: v.heading }, ...blocksToUnits(v.blocks, false)]),
        running,
      };
    }
  }
}

/* ------------------------------------------------------------------ */
/* Rendering pieces                                                    */
/* ------------------------------------------------------------------ */
function UnitView({ unit }: { unit: Unit }) {
  switch (unit.t) {
    case "block":
      return <BlockView block={unit.block} drop={unit.drop} />;
    case "sub":
      return (
        <div className="mb-3 mt-2 border-t border-black pt-3">
          <p className="mag-caps text-[9.5px]">{unit.label}</p>
          <p className="mag-didone mt-1.5 text-[24px] italic leading-[1.08]">{unit.heading}</p>
        </div>
      );
    case "glance":
      return (
        <div className="border-t border-black/20 py-3">
          <p className="mag-caps text-[9px] text-black/55">{unit.label}</p>
          <p className="mag-serif mt-1.5 text-[15px] leading-snug">{unit.value}</p>
        </div>
      );
    case "news":
      return (
        <article className="mb-5 border-t border-black pt-3">
          <p className="mag-caps text-[8.5px] text-black/55">
            {unit.item.date.split("-").reverse().join(".")} · {unit.item.source}
          </p>
          <p className="mag-didone mt-2 text-[20px] leading-[1.12]">{unit.item.headline}</p>
          <p className="mag-serif mt-2 text-[13.5px] leading-[1.55] text-justify">{unit.item.summary}</p>
          <p className="mag-serif mt-2 text-[13.5px] italic leading-[1.5]">{unit.item.whyItMatters}</p>
          <a href={unit.item.url} target="_blank" rel="noopener nofollow" className="mag-caps mt-2 inline-block text-[8.5px] underline underline-offset-4">
            Read the source
          </a>
        </article>
      );
    case "signoff":
      return <p className="mag-didone mt-4 text-right text-[19px] italic">{unit.text}</p>;
  }
}

function HeaderView({ h, pocket }: { h: Header; pocket?: boolean }) {
  if (h.tone === "article") {
    return (
      <header className="mb-7">
        <p className="mag-caps text-[10px]">{h.kicker}</p>
        <h2 className={cn("mag-didone mt-4 font-medium leading-[0.92] tracking-[-0.02em]", pocket ? "text-[52px]" : "text-[70px]")}>{h.title}</h2>
        {h.standfirst && <p className="mag-didone mt-5 max-w-[560px] text-[21px] italic leading-[1.3]">{h.standfirst}</p>}
        <p className="mag-caps mt-5 text-[8.5px] text-black/55">Words by the Trichollective editorial team</p>
        <span className="mt-6 block h-px w-full bg-black" />
      </header>
    );
  }
  if (h.tone === "letter") {
    return (
      <header className="mb-8 text-center">
        <p className="mag-caps text-[10px]">{h.kicker}</p>
        <h2 className={cn("mag-didone mt-5 italic leading-[0.95]", pocket ? "text-[50px]" : "text-[62px]")}>{h.title}</h2>
        <span className="mx-auto mt-7 block h-px w-16 bg-black" />
      </header>
    );
  }
  return (
    <header className="mb-7">
      <div className="flex items-baseline justify-between border-b border-black pb-3">
        <p className="mag-caps text-[10px]">{h.kicker}</p>
        <p className="mag-didone text-[13px] italic">Trichozette</p>
      </div>
      <h2 className={cn("mag-didone mt-6 font-medium leading-[0.95] tracking-[-0.015em]", pocket ? "text-[44px]" : "text-[54px]")}>{h.title}</h2>
      {h.standfirst && <p className="mag-didone mt-4 max-w-[600px] text-[19px] italic leading-[1.3] text-black/80">{h.standfirst}</p>}
    </header>
  );
}

function Frame({
  children,
  folio,
  running,
  side,
  edition,
  dark,
  geo,
}: {
  children: React.ReactNode;
  folio?: number;
  running?: string;
  side: "left" | "right";
  edition: Edition;
  dark?: boolean;
  geo: Geo;
}) {
  return (
    <div className={cn("relative h-full w-full", dark ? "bg-[#0a0a0a] text-white" : "bg-[#fbfaf7]", geo.pocket && "mag-pocket")}>
      {running && (
        <div
          className={cn(
            "absolute top-[34px] flex items-center justify-between mag-caps",
            geo.pocket ? "text-[11px]" : "text-[8.5px]",
            dark ? "text-white/60" : "text-black/55"
          )}
          style={{ left: geo.padX, right: geo.padX }}
        >
          {side === "left" ? (
            <>
              <span>Trichozette</span>
              <span>{running}</span>
            </>
          ) : (
            <>
              <span>{running}</span>
              <span>{editionLabel(edition)}</span>
            </>
          )}
        </div>
      )}
      {children}
      {folio !== undefined && (
        <p
          className={cn("absolute bottom-[30px] mag-didone", geo.pocket ? "text-[17px]" : "text-[13px]", dark ? "text-white/70" : "text-black/70")}
          style={side === "left" ? { left: geo.padX } : { right: geo.padX }}
        >
          {folio}
        </p>
      )}
    </div>
  );
}

export function SheetView({
  sheet,
  edition,
  folio,
  side,
  contents,
  onJump,
  lockedTitles,
  signedIn,
  coverLines,
  geo,
}: {
  geo: Geo;
  sheet: Sheet;
  edition: Edition;
  folio: number;
  side: "left" | "right";
  contents: { kicker: string; title: string; sheet: number | null }[];
  onJump: (i: number) => void;
  lockedTitles: { kicker: string; title: string }[];
  signedIn: boolean;
  coverLines: string[];
}) {
  switch (sheet.k) {
    case "cover":
      return <Cover edition={edition} lines={coverLines} priority sizes="50vw" className="h-full" />;

    case "contents": {
      const image = coverImage(edition);
      return (
        <Frame side={side} edition={edition} folio={folio} geo={geo}>
          <div className="absolute inset-x-0 top-0" style={{ height: Math.round(geo.H * 0.36) }}>
            <Image src={img(image, 1200)} alt="" fill sizes="50vw" className="mag-bw object-cover" />
          </div>
          <div className="absolute bottom-[80px] flex flex-col" style={{ left: geo.padX, right: geo.padX, top: Math.round(geo.H * 0.36) + 30 }}>
            <div className="flex items-end justify-between border-b border-black pb-3">
              <p className="mag-didone text-[64px] font-medium leading-[0.8] tracking-[-0.02em]">Contents</p>
              <p className="mag-caps text-[9px]">{editionLabel(edition)} · {edition.theme}</p>
            </div>
            <ol className="mt-4 flex flex-col">
              {contents.map((c, i) => (
                <li key={i} className="border-b border-black/15">
                  <button
                    type="button"
                    onClick={() => c.sheet !== null && onJump(c.sheet)}
                    className="group flex w-full items-baseline gap-4 py-[9px] text-left"
                  >
                    <span className="mag-didone w-9 shrink-0 text-[26px] leading-none">{c.sheet === null ? "—" : c.sheet + 1}</span>
                    {!geo.pocket && <span className="mag-caps w-36 shrink-0 text-[8.5px] text-black/55">{c.kicker}</span>}
                    <span className={cn("mag-didone flex-1 leading-tight group-hover:italic", geo.pocket ? "text-[21px]" : "text-[18px]")}>{c.title}</span>
                    {c.sheet === null && <span className="mag-caps text-[8px] text-black/50">Members</span>}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </Frame>
      );
    }

    case "opener":
      return (
        <Frame side={side} edition={edition} folio={folio} geo={geo}>
          <div className="absolute inset-x-0 top-0" style={{ height: Math.round(geo.H * 0.62) }}>
            <Image src={img(sheet.image, 1400)} alt={sheet.image.alt} fill sizes="50vw" className="mag-bw object-cover" />
            <p className="absolute top-[34px] mag-caps text-[8.5px] text-white/85" style={{ left: geo.padX }}>{sheet.page.kicker}</p>
          </div>
          <div className="absolute" style={{ left: geo.padX, right: geo.padX, top: Math.round(geo.H * 0.62) + 30 }}>
            <h2 className={cn("mag-didone font-medium leading-[0.92] tracking-[-0.02em]", geo.pocket ? "text-[52px]" : "text-[62px]")}>{sheet.page.title}</h2>
            <p className="mag-didone mt-4 text-[20px] italic leading-[1.3] text-black/85">{sheet.page.standfirst}</p>
            <p className="mag-caps mt-5 text-[8.5px] text-black/55">
              Words by the Trichollective editorial team · Photograph {sheet.image.credit}
            </p>
          </div>
        </Frame>
      );

    case "image": {
      const im = artFor(edition, sheet.page, edition.pages.indexOf(sheet.page));
      return (
        <div className="relative h-full w-full bg-black">
          <Image src={img(im, 1600)} alt={im.alt} fill sizes="50vw" className="mag-bw object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pb-[46px] pt-[160px] text-white" style={{ paddingLeft: geo.padX, paddingRight: geo.padX }}>
            <span className="mb-4 block h-px w-12 bg-white" />
            <p className="mag-didone max-w-[560px] text-[28px] italic leading-[1.2]">{sheet.page.caption}</p>
            <p className="mag-caps mt-4 text-[8px] text-white/60">Photograph {im.credit} / Unsplash</p>
          </div>
        </div>
      );
    }

    case "flow":
      return (
        <Frame side={side} edition={edition} folio={folio} running={sheet.running} geo={geo}>
          <div className="absolute" style={{ left: geo.padX, right: geo.padX, top: geo.padTop, height: geo.bodyH }}>
            {sheet.header && <HeaderView h={sheet.header} pocket={geo.pocket} />}
            <div className="mag-body flex" style={{ gap: geo.gap }}>
              {sheet.cols.map((col, ci) => (
                <div key={ci} style={{ width: geo.colW }} className={cn(ci === 1 && "border-l border-black/10 -ml-[15px] pl-[15px]")}>
                  {col.map((u, ui) => (
                    <div key={ui} className="flow-root">
                      <UnitView unit={u} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Frame>
      );

    case "gate":
      return (
        <Frame side={side} edition={edition} dark geo={geo}>
          <div className="absolute top-[110px] bottom-[80px] flex flex-col" style={{ left: geo.padX + 6, right: geo.padX + 6 }}>
            <p className="mag-caps text-[10px] text-white/60">Members only</p>
            <p className={cn("mag-didone mt-6 font-medium leading-[0.9] tracking-[-0.02em]", geo.pocket ? "text-[62px]" : "text-[76px]")}>
              The story
              <br />
              <span className="italic font-normal">continues.</span>
            </p>
            <p className="mag-serif mt-8 max-w-[520px] text-[18px] leading-[1.55] text-white/80">
              Members read every edition of Trichozette in full, with a new edition each month, Karley&apos;s
              column and the news that matters to your practice.
            </p>
            <ol className="mt-8 flex flex-col border-t border-white/25">
              {lockedTitles.slice(0, 7).map((l) => (
                <li key={l.title} className="flex items-baseline gap-4 border-b border-white/15 py-2.5">
                  {!geo.pocket && <span className="mag-caps w-36 shrink-0 text-[8.5px] text-white/50">{l.kicker}</span>}
                  <span className="mag-didone text-[18px] italic">{l.title}</span>
                </li>
              ))}
            </ol>
            <div className="mt-auto flex items-center gap-6">
              <Link href="/founding" className="inline-flex h-14 items-center gap-2 rounded-full bg-white px-8 text-[15px] font-medium text-black">
                Become a founding member <ArrowRight className="h-4 w-4" />
              </Link>
              {!signedIn && (
                <Link href={`/login?next=/trichozette/${edition.slug}`} className="mag-caps text-[10px] underline underline-offset-4">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </Frame>
      );
  }
}

/* ------------------------------------------------------------------ */
/* Pagination: measure every unit at column width, then pack.          */
/* ------------------------------------------------------------------ */
export function usePagination(edition: Edition, hasGate: boolean, geo: Geo | null) {
  const [result, setResult] = useState<{ sheets: Sheet[]; starts: number[] } | null>(null);
  const measurer = useRef<HTMLDivElement>(null);
  const plans = edition.pages.map((p, i) => planPage(edition, p, i));

  useLayoutEffect(() => {
    let cancelled = false;
    const run = async () => {
      await document.fonts.ready;
      const root = measurer.current;
      if (!root || cancelled || !geo) return;
      const heightOf = (sel: string) => (root.querySelector(sel) as HTMLElement | null)?.getBoundingClientRect().height ?? 0;

      const sheets: Sheet[] = [{ k: "cover" }, { k: "contents" }];
      const starts: number[] = [];
      plans.forEach((plan, pi) => {
        starts.push(sheets.length);
        if (plan.single) {
          sheets.push(plan.single);
          return;
        }
        if (plan.opener) sheets.push(plan.opener);
        const heights = plan.units.map((_, ui) => heightOf(`[data-u="${pi}-${ui}"]`));
        let header = plan.header;
        let capacity = geo.bodyH - (header ? heightOf(`[data-h="${pi}"]`) : 0) - 8;
        const empty = () => Array.from({ length: geo.cols }, () => [] as Unit[]);
        let cols = empty();
        let col = 0;
        let used = 0;
        const flush = () => {
          sheets.push({ k: "flow", header, cols, running: plan.running });
          header = undefined;
          capacity = geo.bodyH - 8;
          cols = empty();
          col = 0;
          used = 0;
        };
        plan.units.forEach((u, ui) => {
          const h = heights[ui];
          if (used + h > capacity && cols[col].length) {
            if (col < geo.cols - 1) {
              col += 1;
              used = 0;
            } else flush();
          }
          cols[col].push(u);
          used += h;
        });
        if (cols[0].length || header) flush();
      });
      if (hasGate) sheets.push({ k: "gate" });
      if (!cancelled) setResult({ sheets, starts });
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edition.slug, edition.pages.length, hasGate, geo?.key]);

  const measure = geo && (
    <div
      ref={measurer}
      aria-hidden
      className={cn("mag pointer-events-none invisible fixed left-[-10000px] top-0 text-black", geo.pocket && "mag-pocket")}
      style={{ width: geo.fullW }}
    >
      {plans.map((plan, pi) => (
        <div key={pi}>
          {plan.header && (
            <div data-h={pi} className="flow-root" style={{ width: geo.fullW }}>
              <HeaderView h={plan.header} pocket={geo.pocket} />
            </div>
          )}
          <div className="mag-body" style={{ width: geo.colW }}>
            {plan.units.map((u, ui) => (
              <div key={ui} data-u={`${pi}-${ui}`} className="flow-root">
                <UnitView unit={u} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return { result, measure, plans };
}

export { pageKicker, pageTitle };
