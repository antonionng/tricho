import { audit, getStaff } from "@/lib/staff";
import { membersCsv, membersForExport, parseMemberFilters } from "@/lib/members-admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const staff = await getStaff();
  if (!staff?.perms.has("members.export")) {
    return new Response("Your role does not include exporting members.", { status: 403 });
  }

  const filters = parseMemberFilters(Object.fromEntries(new URL(request.url).searchParams));
  const rows = await membersForExport(filters);
  const described = [filters.q && `matching "${filters.q}"`, filters.plan && `plan ${filters.plan}`, filters.status && `status ${filters.status}`]
    .filter(Boolean)
    .join(", ");
  await audit(staff, {
    action: "member.export",
    targetType: "user",
    summary: `Downloaded ${rows.length} members as a spreadsheet${described ? ` (${described})` : ""}.`,
    after: { filters, count: rows.length },
  });

  const date = new Date().toISOString().slice(0, 10);
  return new Response(membersCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="trichollective-members-${date}.csv"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
