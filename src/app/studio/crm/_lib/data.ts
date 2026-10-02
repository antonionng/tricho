import "server-only";
import { prisma } from "@/lib/prisma";

export type TeamMember = { id: string; name: string };

/** Everyone on the Studio team, for "looked after by" selects. */
export async function teamMembers(): Promise<TeamMember[]> {
  const rows = await prisma.user.findMany({
    where: { staffRole: { not: null } },
    orderBy: [{ name: "asc" }, { email: "asc" }],
    select: { id: true, name: true, email: true },
  });
  return rows.map((u) => ({ id: u.id, name: u.name ?? u.email ?? "Team member" }));
}

/** Every tag in use on businesses, most used first. */
export async function organisationTags() {
  const rows = await prisma.organisation.findMany({ where: { tags: { isEmpty: false } }, select: { tags: true } });
  return countTags(rows);
}

export function countTags(rows: { tags: string[] }[]) {
  const counts = new Map<string, number>();
  for (const r of rows) for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([tag]) => tag);
}
