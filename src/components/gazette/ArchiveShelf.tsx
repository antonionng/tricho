import Link from "next/link";
import { Lock } from "lucide-react";
import { FOCUS_LABEL, PUBLIC_PREVIEW_PAGES, type Edition } from "@/content/gazette";
import { Cover } from "./Cover";
import { gazetteFonts } from "./fonts";
import { cn } from "@/lib/utils";

const FIELDS = [
  { id: "", label: "Every field" },
  { id: "review", label: "Year in review" },
  { id: "cosmetic", label: "Cosmetic" },
  { id: "clinical", label: "Clinical" },
  { id: "medical", label: "Medical" },
] as const;

/**
 * "Four years in review": the look-back archive, grouped by year.
 * Public visitors see what's inside; members read everything.
 */
export function ArchiveShelf({
  archive,
  field,
  member,
  basePath = "/trichozette",
}: {
  archive: Edition[];
  field?: string;
  member: boolean;
  basePath?: string;
}) {
  const years = [...new Set(archive.map((e) => e.period!))].sort().reverse();
  const shown = field ? archive.filter((e) => e.focus === field) : archive;

  return (
    <section id="archive" className={cn("mag scroll-mt-20 bg-[#0a0a0a] text-white", gazetteFonts)}>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="mag-caps text-[10px] text-white/55">The archive</p>
            <h2 className="mag-didone mt-5 text-[56px] font-medium leading-[0.88] tracking-[-0.02em] sm:text-[92px]">
              Four years
              <br />
              <span className="italic font-normal">in review.</span>
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pt-6">
            <p className="mag-didone text-[22px] italic leading-[1.35] text-white/85">
              What really changed between 2023 and 2026, in the salon, the trichology clinic and the consulting
              room, and what it means for your practice.
            </p>
            <p className="mag-serif mt-4 text-[16px] leading-[1.6] text-white/60">
              A retrospective series published in 2026. Every fact is sourced. The opening pages of each edition
              are free to read; members have the full library, with quizzes and practical education throughout.
            </p>
          </div>
        </div>

        <nav className="mt-12 flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0" aria-label="Filter the archive by field">
          {FIELDS.map((f) => (
            <Link
              key={f.id || "all"}
              href={f.id ? `${basePath}?field=${f.id}#archive` : `${basePath}#archive`}
              scroll={false}
              className={cn(
                "mag-caps shrink-0 rounded-full border px-4 py-2.5 text-[9.5px]",
                (field ?? "") === f.id ? "border-white bg-white text-black" : "border-white/25 text-white/75 hover:border-white/60"
              )}
            >
              {f.label}
            </Link>
          ))}
        </nav>

        <div className="mt-14 flex flex-col gap-16">
          {years.map((year) => {
            const items = shown.filter((e) => e.period === year).sort((a, b) => a.number - b.number);
            if (!items.length) return null;
            return (
              <div key={year} className="grid gap-8 border-t border-white/20 pt-8 lg:grid-cols-12">
                <p className="mag-didone text-[72px] leading-[0.8] text-white/90 lg:col-span-2">{year}</p>
                <ul className="grid grid-cols-2 gap-5 sm:grid-cols-4 lg:col-span-10">
                  {items.map((e) => (
                    <li key={e.slug}>
                      <Link href={`${basePath}/${e.slug}`} className="group block">
                        <div className="transition-transform duration-700 group-hover:-translate-y-1.5">
                          <Cover edition={e} className="shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)]" sizes="(min-width:1024px) 18vw, 45vw" />
                        </div>
                        <p className="mag-caps mt-4 text-[9px] text-white/50">{FOCUS_LABEL[e.focus ?? "review"]}</p>
                        <p className="mag-didone mt-1.5 text-[20px] leading-tight">{e.title}</p>
                        <p className="mag-serif mt-2 inline-flex items-center gap-1.5 text-[13px] text-white/55">
                          {member ? (
                            <>{e.pages.length} features</>
                          ) : (
                            <>
                              <Lock className="h-3 w-3" /> {PUBLIC_PREVIEW_PAGES} free, {e.pages.length - PUBLIC_PREVIEW_PAGES} for members
                            </>
                          )}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
