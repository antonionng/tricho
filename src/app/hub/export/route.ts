import { prisma } from "@/lib/prisma";
import { consumerSession } from "@/lib/consumer-session";
import { consumerExport } from "@/lib/consumer-settings";

/** A download of everything we hold about the signed-in consumer. */
export async function GET() {
  const me = await consumerSession();
  if (!me) return new Response("Please sign in to download your data.", { status: 401 });
  const [saved, enquiries] = await Promise.all([
    prisma.savedListing.findMany({
      where: { userId: me.userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, listing: { select: { name: true, slug: true } } },
    }),
    prisma.enquiry.findMany({
      where: { userId: me.userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, status: true, message: true, listing: { select: { name: true } } },
    }),
  ]);
  const body = JSON.stringify(consumerExport({ user: me.user, profile: me.profile, saved, enquiries }), null, 2);
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="trichollective-my-data.json"',
      "Cache-Control": "no-store",
    },
  });
}
