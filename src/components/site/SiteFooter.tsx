import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";
import { Container } from "@/components/site/primitives";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { footerNav, site } from "@/config/site";
import { CHAPTERS } from "@/content/chapters";

export function SiteFooter() {
  return (
    <footer className="bg-paper-2 border-t border-rule">
      <Container className="py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4 flex flex-col gap-6">
            <BrandMark size="md" sub />
            <p className="text-[15px] leading-relaxed text-ink-2 max-w-sm">
              One newsletter a month: what members are talking about, what&apos;s on, and the best of the
              Trichozette. Useful, never noisy.
            </p>
            <NewsletterForm source="footer" className="max-w-sm" />
          </div>
          <nav className="lg:col-span-8 grid grid-cols-2 gap-10 sm:grid-cols-4" aria-label="Footer">
            {footerNav.map((col) => (
              <div key={col.title}>
                <p className="label text-muted-foreground mb-5">{col.title}</p>
                <ul className="flex flex-col gap-3">
                  {col.items.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="text-[15px] text-ink-2 hover:text-ink">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-16 border-t border-rule pt-8">
          <p className="label text-muted-foreground mb-4">Chapters</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {CHAPTERS.map((c) => (
              <li key={c.slug}>
                <Link href={`/chapters/${c.slug}`} className="text-[15px] text-ink-2 hover:text-ink">
                  {c.city}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-rule pt-8 md:flex-row md:items-center md:justify-between">
          <p className="label text-ink">Trichollective Online</p>
          <span className="hidden md:block rule-short text-ink" aria-hidden />
          <p className="label text-muted-foreground">{site.tagline}.</p>
        </div>
        <div className="mt-8 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Trichollective. Founded at {site.originPlace}.</p>
          <ul className="flex gap-5">
            <li><Link href="/privacy" className="hover:text-ink">Privacy</Link></li>
            <li><Link href="/terms" className="hover:text-ink">Terms</Link></li>
            <li><a href={`mailto:${site.contactEmail}`} className="hover:text-ink">Contact</a></li>
          </ul>
        </div>
      </Container>
    </footer>
  );
}
