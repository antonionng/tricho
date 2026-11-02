import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/site/primitives";
import { PartnerBadge } from "@/components/partners/PartnerBadge";
import { publishedPremiumPartners, partnerLogoSrc } from "@/lib/partners";

/** Below this many partners the row stands still; from here it scrolls on its own. */
const SCROLL_FROM = 4;

type Card = { id: string; slug: string; name: string; category: string; logoUrl: string | null; isFounding: boolean };

function PartnerCard({ p, hidden = false }: { p: Card; hidden?: boolean }) {
  const logo = partnerLogoSrc(p.logoUrl);
  return (
    <li aria-hidden={hidden || undefined} className="shrink-0">
      <Link
        href={`/partners/${p.slug}`}
        tabIndex={hidden ? -1 : undefined}
        className="group flex w-[248px] flex-col gap-3 rounded-2xl border border-rule bg-card p-4 transition hover:border-ink/40 hover:shadow-[0_18px_40px_-28px_rgba(0,0,0,0.45)]"
      >
        <span className="flex h-20 items-center justify-center overflow-hidden rounded-xl border border-rule bg-white px-4 py-3">
          {logo ? (
            // Partner logos come from anywhere, so a plain img rather than next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="max-h-full max-w-full object-contain" loading="lazy" />
          ) : (
            <span className="text-lg font-semibold">{p.name}</span>
          )}
        </span>
        <PartnerBadge size="sm" founding={p.isFounding} className="self-start" />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[15px] font-semibold tracking-tight text-ink">{p.name}</span>
          <span className="truncate text-xs text-muted-foreground">{p.category}</span>
        </span>
      </Link>
    </li>
  );
}

/**
 * The Premium partners, just under the home page hero. Renders nothing until one exists,
 * and only moves once there are enough of them to fill a row.
 */
export async function PremiumPartnerCarousel() {
  const partners = (await publishedPremiumPartners()).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    logoUrl: p.logoUrl,
    isFounding: p.isFounding,
  }));
  if (!partners.length) return null;
  const scrolls = partners.length >= SCROLL_FROM;

  return (
    <section aria-labelledby="premium-partners-title" className="border-b border-rule bg-paper-2 py-10 md:py-12">
      <Container>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="premium-partners-title" className="label text-muted-foreground">
              Our Premium partners
            </h2>
            <p className="text-[15px] text-ink-2">The brands that teach, write and exhibit with our members.</p>
          </div>
          <Link href="/partners" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:underline">
            Meet our partners <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </Container>

      {scrolls ? (
        <div className="partner-marquee group relative overflow-hidden">
          <ul className="partner-marquee-track flex w-max gap-4 px-4 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]">
            {partners.map((p) => (
              <PartnerCard key={p.id} p={p} />
            ))}
            {/* The same cards again, so the loop has no gap. Hidden from screen readers and the keyboard. */}
            {partners.map((p) => (
              <PartnerCard key={`${p.id}-loop`} p={p} hidden />
            ))}
          </ul>
        </div>
      ) : (
        <Container>
          <ul className="flex flex-wrap justify-center gap-4 sm:justify-start">
            {partners.map((p) => (
              <PartnerCard key={p.id} p={p} />
            ))}
          </ul>
        </Container>
      )}
    </section>
  );
}
