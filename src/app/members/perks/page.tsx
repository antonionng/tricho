import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Gift } from "lucide-react";
import { Pill } from "@/components/site/primitives";
import { Paywall } from "@/components/members/Paywall";
import { EmptyState, MemberPage, PageHeader } from "@/components/members/MemberPage";
import { getMemberContext } from "@/lib/member";
import { partnerTierLabel, publishedPartners, partnerLogoSrc, safeHttpUrl } from "@/lib/partners";

export const metadata = { title: "Member perks" };

export default async function PerksPage() {
  const ctx = await getMemberContext();
  if (!ctx.session?.user?.id) redirect("/login?next=/members/perks");
  if (!ctx.allowed) {
    return (
      <Paywall
        title="Member perks"
        body="Members save with discounts and trials from our partner brands, device makers and educators."
      />
    );
  }

  const partners = (await publishedPartners()).filter((p) => p.perk);

  return (
    <MemberPage>
      <PageHeader
        label="Perks"
        title="Member perks"
        lede="Offers from the partners who support Trichollective. Every partner is approved by hand, and every offer here is for members only."
      />

      {partners.length === 0 ? (
        <EmptyState
          title="No perks yet"
          body="We are choosing our first partners now, and their offers will appear here as soon as they are agreed. We only list perks from companies we have approved ourselves."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {partners.map((p) => {
            const logo = partnerLogoSrc(p.logoUrl);
            const website = safeHttpUrl(p.website);
            return (
              <li key={p.id} className="flex flex-col gap-4 rounded-2xl border border-rule bg-card p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-h-10 items-center">
                    {logo ? (
                      // Partner logos come from anywhere, so a plain img rather than next/image.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logo} alt={`${p.name} logo`} className="max-h-10 max-w-[140px] object-contain" loading="lazy" />
                    ) : (
                      <Gift className="h-6 w-6 stroke-[1.4]" aria-hidden />
                    )}
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <Pill tone={p.tier === "premium" ? "ink" : "default"}>{partnerTierLabel(p.tier)}</Pill>
                    <Pill>{p.category}</Pill>
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold tracking-tight text-ink">{p.name}</h2>
                  <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-2">{p.perk}</p>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-sm">
                  <Link href={`/partners/${p.slug}`} className="text-ink underline underline-offset-4">
                    About {p.name}
                  </Link>
                  {website && (
                    <a
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="inline-flex items-center gap-1 text-ink underline underline-offset-4"
                    >
                      Visit their website <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  )}
                  <span className="text-muted-foreground">Sponsored</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </MemberPage>
  );
}
