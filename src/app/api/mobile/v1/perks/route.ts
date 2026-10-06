import { json, withMember } from "@/lib/mobile/api";
import { partnerLogoSrc, partnerTierLabel, safeHttpUrl } from "@/lib/partners";
import { perkCode } from "@/lib/perk-code";
import { partnersWithPerks } from "@/app/members/perks/_data";

/** Member perks from approved partners, with any discount code picked out so the app can copy it. */
export const GET = withMember(
  async () => {
    const partners = await partnersWithPerks();
    return json({
      perks: partners.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        logo: partnerLogoSrc(p.logoUrl),
        tier: p.tier,
        tierLabel: partnerTierLabel(p.tier, p.kind),
        category: p.category,
        perk: p.perk,
        code: perkCode(p.perk),
        // The tracked link, as on the website, which counts the claim and opens the partner's site.
        offerPath: safeHttpUrl(p.website) ? `/go/${p.slug}?perk=1` : null,
        aboutPath: `/partners/${p.slug}`,
      })),
    });
  },
  { members: true }
);
