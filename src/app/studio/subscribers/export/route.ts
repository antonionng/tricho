import { requireAdmin } from "@/lib/member";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function cell(value: string | null | undefined) {
  let v = value ?? "";
  // Stop spreadsheet apps treating a value as a formula.
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return new Response("Studio is for the Trichollective team.", { status: 403 });
  }

  const rows = await prisma.subscriber.findMany({ orderBy: { createdAt: "asc" } });
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
