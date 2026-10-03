import { prisma } from "@/lib/prisma";
import { urlForFile } from "@/lib/storage";

/**
 * A partner's logo at a stable address. Logos uploaded since the move to file storage redirect to
 * the stored file; older portal uploads kept in PartnerLogo are still served from here.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const partner = await prisma.partner.findUnique({
    where: { slug },
    select: { hidden: true, logoFileId: true, logo: { select: { data: true, contentType: true } } },
  });
  if (!partner || partner.hidden) return new Response("Not found", { status: 404 });

  if (partner.logoFileId) {
    const url = await urlForFile(partner.logoFileId);
    if (url) return Response.redirect(new URL(url, req.url), 302);
  }
  if (!partner.logo) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(partner.logo.data), {
    headers: {
      "Content-Type": partner.logo.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
