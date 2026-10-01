import Link from "next/link";
import { Container } from "@/components/site/primitives";
import { publishedPremiumPartners, safeHttpUrl } from "@/lib/partners";
import { cn } from "@/lib/utils";

/**
 * "Supported by our partners", with logos of published Premium partners.
 * Renders nothing at all until at least one exists, so it never shows an empty or invented list.
 */
export async function PartnerStrip({ className }: { className?: string }) {
  const partners = await publishedPremiumPartners();
  if (!partners.length) return null;

  return (
    <section aria-labelledby="partner-strip-title" className={cn("border-y border-rule bg-paper py-10", className)}>
      <Container>
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <h2 id="partner-strip-title" className="label shrink-0 text-muted-foreground">
            <Link href="/partners" className="hover:text-ink">
              Supported by our partners
            </Link>
          </h2>
          <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {partners.map((p) => {
              const logo = safeHttpUrl(p.logoUrl);
              return (
                <li key={p.id}>
                  <Link
                    href={`/partners/${p.slug}`}
                    className="flex h-10 items-center opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0"
                  >
                    {logo ? (
                      // Partner logos come from anywhere, so a plain img rather than next/image.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logo} alt={p.name} className="max-h-10 max-w-[140px] object-contain" loading="lazy" />
                    ) : (
                      <span className="text-sm font-semibold tracking-tight text-ink">{p.name}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </section>
  );
}
