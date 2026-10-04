import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { Container } from "@/components/site/primitives";
import { partnerLogoSrc, publishedCharities } from "@/lib/partners";
import { safeHex } from "@/lib/showcase";
import { cn } from "@/lib/utils";

/**
 * "Proud supporters of", with each charity we support free of charge, in its own colours.
 * Renders nothing until a charity is published, so it never shows an empty or invented list.
 */
export async function ProudSupporters({ className }: { className?: string }) {
  const list = await publishedCharities();
  if (!list.length) return null;

  return (
    <section aria-labelledby="proud-supporters-title" className={cn("bg-[#FFF1F7] py-14 md:py-16", className)}>
      <Container>
        <h2
          id="proud-supporters-title"
          className="label flex items-center justify-center gap-2 text-center text-[#76146C] md:justify-start"
        >
          <Heart className="h-3.5 w-3.5 fill-current" aria-hidden /> Proud supporters of
        </h2>
        <ul className="mt-6 flex flex-col gap-5">
          {list.map((c) => {
            const logo = partnerLogoSrc(c.logoUrl);
            const accent = safeHex(c.accentColor, "#D4007A");
            const mission = c.tagline || c.blurb.split(/\n/)[0];
            return (
              <li key={c.id}>
                <Link
                  href={`/partners/${c.slug}`}
                  className="group flex flex-col items-center gap-6 rounded-[28px] border-2 border-[#FCBEDA] bg-white p-6 text-center transition hover:border-[var(--c-hot)] md:flex-row md:gap-10 md:p-8 md:text-left"
                  style={{ "--c-hot": accent } as React.CSSProperties}
                >
                  <div className="flex h-24 w-40 shrink-0 items-center justify-center">
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logo} alt={`${c.name} logo`} className="max-h-24 max-w-[160px] object-contain" loading="lazy" />
                    ) : (
                      <span className="display text-2xl">{c.name}</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <p className="text-xl font-semibold leading-snug tracking-tight text-ink md:text-2xl">
                      We are proud to support {c.name}.
                    </p>
                    <p className="text-[15px] leading-relaxed text-ink-2">{mission}</p>
                  </div>
                  <span className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[var(--c-hot)] px-5 text-[15px] font-semibold text-white">
                    Meet the charity
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
