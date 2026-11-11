import { prisma } from "@/lib/prisma";
import { csvRow } from "@/lib/csv";
import { audit, getStaff } from "@/lib/staff";
import { loadExhibitors } from "@/lib/exhibitors";
import { bookletCsvRows } from "@/lib/packages";
import { absoluteUrl } from "@/lib/mail/layout";

export const dynamic = "force-dynamic";

/**
 * The event booklet as a spreadsheet: one row per paid exhibitor, with their
 * company, package, booklet text and logo URL, biggest packages first.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaff();
  if (!staff?.perms.has("events.view")) {
    return new Response("Your role does not include downloading the exhibitor list.", { status: 403 });
  }
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id }, select: { id: true, slug: true, title: true } });
  if (!event) return new Response("That event could not be found.", { status: 404 });

  const rows = (await loadExhibitors(event.id)).filter((r) => r.status === "paid");
  await audit(staff, {
    action: "event.exhibitors_export",
    targetType: "event",
    targetId: event.id,
    summary: `Downloaded the booklet list of ${rows.length} exhibitors for "${event.title}".`,
  });
  const lines = bookletCsvRows(
    rows.map((r) => ({
      company: r.companyName,
      packageName: r.packageName,
      blurb: r.bookletBlurb,
      logoUrl: r.logoUrl,
      website: r.website,
      standNumber: r.standNumber,
    })),
    absoluteUrl
  ).map(csvRow);
  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="trichollective-booklet-${event.slug.replace(/[^a-z0-9-]/gi, "")}.csv"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
