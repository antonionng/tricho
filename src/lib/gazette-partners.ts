import "server-only";
import type { Edition, Page, PartnerEntry } from "@/content/gazette";
import { prisma } from "@/lib/prisma";
import { partnerLogoSrc } from "@/lib/partners";

type Found = { logo: string | null; href: string | null };

function slugsIn(pages: Page[]) {
  const slugs = new Set<string>();
  for (const p of pages) {
    if (p.kind === "partners") for (const e of [p.sponsor, ...p.exhibitors]) if (e.slug) slugs.add(e.slug);
    if (p.kind === "partner" && p.partner.slug) slugs.add(p.partner.slug);
  }
  return [...slugs];
}

/**
 * Fills partner logos and partner-page links from the Partner table, so a logo changed in the
 * Studio shows in every edition. A logo written into the edition itself always wins.
 * If the database can't be reached, the edition still renders with wordmarks.
 */
export async function withPartnerLogos(edition: Edition): Promise<Edition> {
  const slugs = slugsIn(edition.pages);
  if (!slugs.length) return edition;
  const rows = await prisma.partner
    .findMany({ where: { slug: { in: slugs }, hidden: false }, select: { slug: true, logoUrl: true, published: true } })
    .catch(() => []);
  const found = new Map<string, Found>(
    rows.map((r) => [r.slug, { logo: partnerLogoSrc(r.logoUrl), href: r.published ? `/partners/${r.slug}` : null }])
  );
  const fill = <T extends Pick<PartnerEntry, "slug" | "logo" | "href">>(e: T): T => {
    const f = e.slug ? found.get(e.slug) : undefined;
    if (!f) return e;
    return { ...e, logo: e.logo ?? f.logo ?? undefined, href: e.href ?? f.href ?? undefined };
  };
  return {
    ...edition,
    pages: edition.pages.map((p) => {
      if (p.kind === "partners") return { ...p, sponsor: fill(p.sponsor), exhibitors: p.exhibitors.map(fill) };
      if (p.kind === "partner") return { ...p, partner: fill(p.partner) };
      return p;
    }),
  };
}
