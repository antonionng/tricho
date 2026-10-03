import { prisma } from "@/lib/prisma";
import { trackPartners } from "@/lib/partner-tracking";

/**
 * Counts each perk a member has been shown on the Member perks page. The page sends
 * the partner ids once from the browser after it has loaded, so prefetches are not counted.
 */
export async function POST(req: Request) {
  if (req.headers.get("sec-fetch-site") === "cross-site") return new Response(null, { status: 204 });
  const body = (await req.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = Array.isArray(body?.ids) ? body.ids.filter((x): x is string => typeof x === "string").slice(0, 100) : [];
  if (ids.length) {
    const partners = await prisma.partner
      .findMany({ where: { id: { in: ids }, published: true, hidden: false, perk: { not: null } }, select: { id: true, ownerEmail: true } })
      .catch(() => []);
    await trackPartners(partners, "perkViews", req.headers.get("user-agent"));
  }
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
