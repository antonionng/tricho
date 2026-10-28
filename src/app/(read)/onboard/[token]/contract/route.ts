import { prisma } from "@/lib/prisma";
import { signedUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * The signed agreement, for whoever holds the private onboarding link: the brand that signed it
 * and the team. Anyone else gets a 404, exactly as for an unknown link.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const offer = token.length >= 16 ? await prisma.partnerOffer.findUnique({ where: { token }, select: { contractFileId: true } }) : null;
  const file = offer?.contractFileId ? await prisma.storedFile.findUnique({ where: { id: offer.contractFileId } }) : null;
  if (!file) return new Response("Not found", { status: 404 });

  if (file.driver === "supabase") {
    const url = await signedUrl(file);
    return url ? Response.redirect(url, 302) : new Response("Not found", { status: 404 });
  }
  if (!file.data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
      "Content-Disposition": `inline; filename="${(file.name ?? "Agreement.pdf").replace(/[^\w.\- ]/g, "")}"`,
    },
  });
}
