import { prisma } from "@/lib/prisma";
import { audit, getStaff } from "@/lib/staff";
import { buildOrgWhere, organisationsCsv, parseCrmFilters } from "@/lib/crm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const staff = await getStaff();
  if (!staff?.perms.has("crm.edit")) {
    return new Response("Your role does not include exporting the business CRM.", { status: 403 });
  }

  const filters = parseCrmFilters(Object.fromEntries(new URL(request.url).searchParams));
  const [rows, team] = await Promise.all([
    prisma.organisation.findMany({
      where: buildOrgWhere(filters),
      orderBy: { createdAt: "asc" },
      take: 20000,
      include: { contacts: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], take: 1, select: { name: true, email: true } } },
    }),
    prisma.user.findMany({ where: { staffRole: { not: null } }, select: { id: true, name: true, email: true } }),
  ]);
  const owner = new Map(team.map((t) => [t.id, t.name ?? t.email]));

  const described = [
    filters.q && `matching "${filters.q}"`,
    filters.stage && `stage ${filters.stage}`,
    filters.kind && `kind ${filters.kind}`,
    filters.tag && `tag ${filters.tag}`,
    filters.owner && "one owner",
    filters.due && "follow-up due",
  ]
    .filter(Boolean)
    .join(", ");
  await audit(staff, {
    action: "crm.export",
    targetType: "organisation",
    summary: `Downloaded ${rows.length} businesses as a spreadsheet${described ? ` (${described})` : ""}.`,
    after: { filters, count: rows.length },
  });

  const csv = organisationsCsv(
    rows.map((o) => ({
      ...o,
      owner: o.ownerStaffId ? (owner.get(o.ownerStaffId) ?? null) : null,
      primaryName: o.contacts[0]?.name ?? null,
      primaryEmail: o.contacts[0]?.email ?? null,
    }))
  );
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="trichollective-businesses-${date}.csv"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
