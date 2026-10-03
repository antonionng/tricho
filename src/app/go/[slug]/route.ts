import { prisma } from "@/lib/prisma";
import { safeHttpUrl } from "@/lib/partners";
import { trackPartners } from "@/lib/partner-tracking";

/**
 * A tracked link to a partner's website. It counts the click for the partner's
 * report, then sends the visitor on. With ?perk=1 it counts a perk claim instead,
 * which is how the "Get this offer" button on Member perks works.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(req.url);
  const partner = await prisma.partner
    .findUnique({ where: { slug: slug.slice(0, 120) }, select: { id: true, slug: true, website: true, ownerEmail: true, published: true, hidden: true } })
    .catch(() => null);
  if (!partner || !partner.published || partner.hidden) return Response.redirect(new URL("/partners", url), 302);

  const website = safeHttpUrl(partner.website);
  if (!website) return Response.redirect(new URL(`/partners/${partner.slug}`, url), 302);

  const purpose = `${req.headers.get("sec-purpose") ?? ""} ${req.headers.get("purpose") ?? ""}`;
  if (!/prefetch|prerender/i.test(purpose)) {
    await trackPartners([partner], url.searchParams.get("perk") === "1" ? "perkClaims" : "websiteClicks", req.headers.get("user-agent"));
  }

  return new Response(null, {
    status: 302,
    headers: { Location: website, "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "origin" },
  });
}
