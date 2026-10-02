import { prisma } from "@/lib/prisma";

/** Serves a logo uploaded in the brand portal. The ?v= in the link changes on every upload. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const partner = await prisma.partner.findUnique({
    where: { slug },
    select: { published: true, hidden: true, logo: { select: { data: true, contentType: true } } },
  });
  if (!partner?.logo || partner.hidden) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(partner.logo.data), {
    headers: {
      "Content-Type": partner.logo.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
