import { TriangleAlert } from "lucide-react";
import { Container, Eyebrow } from "@/components/site/primitives";
import { Breadcrumbs, type Crumb } from "@/components/editorial/PageHero";

/** Long-form legal document layout: draft notice, contents and readable prose. */
export function LegalPage({
  eyebrow,
  title,
  intro,
  updated,
  crumbs,
  sections,
  draft = true,
}: {
  eyebrow: string;
  title: string;
  intro: React.ReactNode;
  updated: string;
  crumbs: Crumb[];
  sections: { id: string; heading: string; body: React.ReactNode }[];
  draft?: boolean;
}) {
  return (
    <article className="bg-paper">
      <Container className="py-14 md:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <header className="lg:col-span-12 flex flex-col gap-7 max-w-3xl animate-rise">
            <Breadcrumbs items={crumbs} />
            {draft && (
              <p
                role="note"
                className="flex items-start gap-3 rounded-2xl border border-ink/25 bg-paper-2 px-5 py-4 text-[15px] font-medium text-ink"
              >
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                Draft — to be reviewed by a solicitor before launch.
              </p>
            )}
            <Eyebrow rule>{eyebrow}</Eyebrow>
            <h1 className="display text-5xl sm:text-6xl">{title}</h1>
            <div className="lede">{intro}</div>
            <p className="text-[13px] text-muted-foreground">Last updated {updated}</p>
          </header>

          <nav aria-label="Contents" className="lg:col-span-4 lg:order-2">
            <div className="rounded-3xl border border-rule bg-card p-6 lg:sticky lg:top-24">
              <p className="label text-muted-foreground">Contents</p>
              <ol className="mt-4 flex flex-col gap-2.5 text-[14px]">
                {sections.map((s, i) => (
                  <li key={s.id} className="flex gap-3">
                    <span className="w-5 shrink-0 tabular-nums text-muted-foreground">{i + 1}.</span>
                    <a href={`#${s.id}`} className="text-ink-2 hover:text-ink hover:underline underline-offset-4">
                      {s.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <div className="lg:col-span-8 lg:order-1 prose-tricho max-w-3xl">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24 [&>*+*]:mt-[1.1em]">
                <h2 className={i === 0 ? "mt-0!" : undefined}>
                  {i + 1}. {s.heading}
                </h2>
                {s.body}
              </section>
            ))}
          </div>
        </div>
      </Container>
    </article>
  );
}
