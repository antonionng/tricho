import { images } from "@/content/images";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { Container, Section, SectionHeader } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { Cover } from "@/components/gazette/Cover";
import { TiltCover } from "@/components/gazette/TiltCover";
import { archive, editionLabel, editions, PUBLIC_PREVIEW_PAGES } from "@/content/gazette";
import { ArchiveShelf } from "@/components/gazette/ArchiveShelf";
import { getMemberContext } from "@/lib/member";
import { breadcrumbLd, JsonLd, pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = pageMetadata({
  title: "Trichozette: the Trichollective magazine",
  description:
    "Trichozette is Trichollective's magazine for hair and scalp professionals: practical, interactive editions on head spa, hair loss, devices, business and more. Preview any edition free.",
  path: "/trichozette",
    og: { title: "Trichozette", sub: "Interactive editions for hair professionals.", eyebrow: "The Trichollective magazine", img: images.hairDetail.src, variant: "cover" },
});

export default async function GazettePage({ searchParams }: { searchParams: Promise<{ theme?: string; field?: string }> }) {
  const { theme, field } = await searchParams;
  const ctx = await getMemberContext();
  const [latest, ...rest] = editions;
  const themes = [...new Set(editions.map((e) => e.theme))];
  const shown = theme ? editions.filter((e) => e.theme === theme) : rest;

  if (!latest) return null;

  return (
    <>
      {/* Latest edition */}
      <section className="relative overflow-hidden border-b border-rule">
        <Container className="py-14 md:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6 flex flex-col gap-7 animate-rise">
              <p className="label text-muted-foreground">Trichozette · Latest edition</p>
              <h1 className="display text-5xl sm:text-6xl lg:text-7xl">
                {latest.title}
                <br />
                <span className="text-fade">{latest.fade}</span>
              </h1>
              <p className="lede max-w-xl">{latest.standfirst}</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="xl">
                  <Link href={`/trichozette/${latest.slug}`}>
                    {ctx.allowed ? "Read the edition" : "Preview the edition"} <ArrowRight />
                  </Link>
                </Button>
                {!ctx.allowed && (
                  <p className="text-sm text-muted-foreground">
                    Read the opening pages free. Members read every edition in full.
                  </p>
                )}
              </div>
            </div>
            <div className="lg:col-span-5 lg:col-start-8">
              <Link href={`/trichozette/${latest.slug}`} aria-label={`Open ${latest.title}`} className="block">
                <TiltCover>
                  <Cover edition={latest} size="lg" priority className="shadow-[0_50px_100px_-45px_rgba(0,0,0,0.55)]" />
                </TiltCover>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Archive */}
      <Section>
        <Container>
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <SectionHeader
              eyebrow="Every edition"
              title="Every edition stays in the library,"
              fade="ready whenever you want to return to it."
              body="Each edition mixes long reads with quizzes, checklists and questions you can test yourself on. Open any of them to read the first pages."
            />
          </div>
          <nav className="mt-10 flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0" aria-label="Filter by theme">
            <Link
              href="/trichozette"
              className={cn("shrink-0 rounded-full border px-4 py-2 text-sm", !theme ? "border-ink bg-ink text-paper" : "border-rule bg-card text-ink-2 hover:border-ink/40")}
            >
              All editions
            </Link>
            {themes.map((t) => (
              <Link
                key={t}
                href={`/trichozette?theme=${encodeURIComponent(t)}`}
                className={cn("shrink-0 rounded-full border px-4 py-2 text-sm", theme === t ? "border-ink bg-ink text-paper" : "border-rule bg-card text-ink-2 hover:border-ink/40")}
              >
                {t}
              </Link>
            ))}
          </nav>
          <ul className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
            {shown.map((e) => (
              <li key={e.slug}>
                <Link href={`/trichozette/${e.slug}`} className="group block">
                  <div className="transition-transform duration-500 group-hover:-translate-y-1.5">
                    <Cover edition={e} className="shadow-[0_30px_60px_-35px_rgba(0,0,0,0.5)] transition-shadow group-hover:shadow-[0_40px_70px_-35px_rgba(0,0,0,0.6)]" />
                  </div>
                  <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    {editionLabel(e)} · {e.theme}
                  </p>
                  <p className="mt-1 font-semibold leading-snug">{e.title}</p>
                  <p className="mt-1 text-sm text-ink-2 line-clamp-2">{e.standfirst}</p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    {ctx.allowed ? (
                      <>{e.pages.length + 2} pages</>
                    ) : (
                      <>
                        <Lock className="h-3 w-3" /> {PUBLIC_PREVIEW_PAGES + 2} free pages · {e.pages.length - PUBLIC_PREVIEW_PAGES} for members
                      </>
                    )}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <ArchiveShelf archive={archive} field={field} member={ctx.allowed} />

      {!ctx.allowed && (
        <section className="bg-ink text-paper">
          <Container className="grid gap-12 py-20 md:py-24 lg:grid-cols-12">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <p className="label text-paper/60">Membership</p>
              <h2 className="display text-4xl sm:text-5xl">
                Read every edition in full.
                <br />
                <span className="opacity-60">A new one every month.</span>
              </h2>
              <p className="text-lg leading-relaxed text-paper/75">
                Membership includes the whole Trichozette library, each new monthly edition, the community, live
                masterclasses and member prices on courses and conferences.
              </p>
              <div>
                <Button asChild size="lg" variant="paper">
                  <Link href="/founding">
                    Become a founding member <ArrowRight />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="lg:col-span-4 lg:col-start-9 flex flex-col justify-end gap-4">
              <p className="font-semibold">Not ready to join?</p>
              <p className="text-sm text-paper/70">Get a sample edition and the monthly newsletter by email.</p>
              <NewsletterForm source="gazette" tone="ink" cta="Send it" />
            </div>
          </Container>
        </section>
      )}
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Trichozette", path: "/trichozette" }])} />
    </>
  );
}
