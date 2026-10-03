import { prisma } from "@/lib/prisma";
import { trackPartners } from "@/lib/partner-tracking";

/**
 * Counts a view of a public partner page. The page calls this once from the browser
 * after it has loaded, so link prefetches and crawlers that do not run scripts are not counted.
 */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (isPrefetch(req)) return new Response(null, { status: 204 });
  const partner = await prisma.partner
    .findUnique({ where: { slug: slug.slice(0, 120) }, select: { id: true, ownerEmail: true, published: true, hidden: true } })
    .catch(() => null);
  if (partner?.published && !partner.hidden) {
    await trackPartners([partner], "views", req.headers.get("user-agent"));
  }
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

function isPrefetch(req: Request) {
  const purpose = `${req.headers.get("sec-purpose") ?? ""} ${req.headers.get("purpose") ?? ""}`;
  return /prefetch|prerender/i.test(purpose) || req.headers.get("sec-fetch-site") === "cross-site";
}
