import { prisma } from "@/lib/prisma";
import { csvCell as cell } from "@/lib/csv";
import { audit, getStaff } from "@/lib/staff";

export const dynamic = "force-dynamic";

export async function GET() {
  const staff = await getStaff();
  if (!staff?.perms.has("subscribers.export")) {
    return new Response("Your role does not include exporting subscribers.", { status: 403 });
  }

  const rows = await prisma.subscriber.findMany({ orderBy: { createdAt: "asc" } });
  await audit(staff, {
    action: "subscribers.export",
    targetType: "subscriber",
    summary: `Downloaded ${rows.length} subscribers as a spreadsheet.`,
  });
  const lines = [
    ["email", "source", "utm_source", "utm_campaign", "signed_up", "unsubscribed"].join(","),
    ...rows.map((s) =>
      [
        cell(s.email),
        cell(s.source),
        cell(s.utmSource),
        cell(s.utmCampaign),
        s.createdAt.toISOString(),
        s.unsubscribedAt ? s.unsubscribedAt.toISOString() : "",
      ].join(",")
    ),
  ];
  const date = new Date().toISOString().slice(0, 10);
  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="trichollective-subscribers-${date}.csv"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
