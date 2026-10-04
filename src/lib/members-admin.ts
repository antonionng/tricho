import "server-only";
import { prisma } from "@/lib/prisma";
import { SYSTEM_USER_EMAIL } from "@/agents/publish";
import { getMembershipByEmail } from "@/lib/subscription";
import {
  buildMemberWhere,
  membersCsv as toCsv,
  type MemberCsvSource,
  type MemberFilters,
  type MemberPlanFilter,
  type MemberStatusFilter,
} from "@/lib/members-filter";

export {
  parseMemberFilters,
  memberFilterQuery,
  accessState,
  ACCESS_LABEL,
  sourceKey,
  sourceLabel,
  isIrelandSource,
  startOfToday,
} from "@/lib/members-filter";
export type { MemberFilters } from "@/lib/members-filter";

const PAGE = 50;

const listSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  staffRole: true,
  plan: true,
  compPlan: true,
  compUntil: true,
  isFounding: true,
  stripeCurrentPeriodEnd: true,
  accessStatus: true,
  accessUntil: true,
  mutedUntil: true,
  onboardedAt: true,
  signupSource: true,
  createdAt: true,
  tags: true,
  crmOwnerId: true,
  profile: { select: { location: true, city: true, country: true } },
} as const;

/** One page of members matching the Studio filters, newest first. */
export async function searchMembers(f: {
  q?: string;
  plan?: MemberPlanFilter;
  status?: MemberStatusFilter;
  tag?: string;
  owner?: string;
  joined?: "today";
  cursor?: string;
}) {
  const filters: MemberFilters = {
    q: f.q?.trim() ?? "",
    plan: f.plan ?? "",
    status: f.status ?? "",
    tag: f.tag,
    owner: f.owner,
    joined: f.joined,
  };
  const where = buildMemberWhere(filters, new Date(), SYSTEM_USER_EMAIL);
  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: PAGE + 1,
      ...(f.cursor ? { cursor: { id: f.cursor }, skip: 1 } : {}),
      select: listSelect,
    }),
    prisma.user.count({ where }),
  ]);
  const more = rows.length > PAGE;
  const page = more ? rows.slice(0, PAGE) : rows;
  return { rows: page, total, nextCursor: more ? page[page.length - 1].id : null };
}

export type MemberRow = Awaited<ReturnType<typeof searchMembers>>["rows"][number];

/** Everyone matching the filters, for the spreadsheet download. */
export async function membersForExport(filters: MemberFilters) {
  return prisma.user.findMany({
    where: buildMemberWhere(filters, new Date(), SYSTEM_USER_EMAIL),
    orderBy: { createdAt: "asc" },
    take: 20000,
    select: {
      name: true,
      email: true,
      plan: true,
      compPlan: true,
      compUntil: true,
      stripeCurrentPeriodEnd: true,
      isFounding: true,
      role: true,
      staffRole: true,
      accessStatus: true,
      accessUntil: true,
      mutedUntil: true,
      createdAt: true,
      signupSource: true,
    },
  });
}

export function membersCsv(rows: MemberCsvSource[]) {
  return toCsv(rows);
}

/** Everything Studio shows on one member's page. */
export async function memberDetail(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      listings: { orderBy: { createdAt: "desc" }, select: { id: true, name: true, slug: true, status: true, city: true, createdAt: true } },
      _count: { select: { posts: true, comments: true, referralsSent: true, referralsIn: true } },
    },
  });
  if (!user || user.email === SYSTEM_USER_EMAIL) return null;

  const [posts, reports, rsvps, notes, activity, membership, organisations, enquiries, team] = await Promise.all([
    prisma.communityPost.findMany({
      where: { authorId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true, content: true, space: true, hiddenAt: true, createdAt: true, _count: { select: { comments: true } } },
    }),
    prisma.report.findMany({
      where: { OR: [{ post: { authorId: id }, commentId: null }, { comment: { authorId: id } }] },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        reason: true,
        source: true,
        resolution: true,
        resolvedAt: true,
        createdAt: true,
        postId: true,
        commentId: true,
        post: { select: { title: true, content: true } },
      },
    }),
    prisma.eventRsvp.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { createdAt: true, event: { select: { id: true, title: true, slug: true, startsAt: true } } },
    }),
    prisma.memberNote.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      select: { id: true, body: true, createdAt: true, author: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.findMany({
      where: { targetType: "user", targetId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, action: true, summary: true, actorEmail: true, createdAt: true },
    }),
    getMembershipByEmail(user.email),
    // The businesses they are a contact for, matched by account or by email.
    prisma.organisationContact.findMany({
      where: {
        OR: [{ userId: id }, ...(user.email ? [{ email: { equals: user.email, mode: "insensitive" as const } }] : [])],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        isPrimary: true,
        organisation: { select: { id: true, name: true, stage: true, kind: true } },
      },
    }),
    // Client enquiries sent to their directory listings.
    prisma.enquiry.findMany({
      where: { listing: { userId: id } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, name: true, message: true, status: true, createdAt: true, listing: { select: { name: true } } },
    }),
    studioTeam(),
  ]);

  return { user, posts, reports, rsvps, notes, activity, membership, organisations, enquiries, team };
}

export type MemberDetail = NonNullable<Awaited<ReturnType<typeof memberDetail>>>;

/** Every CRM tag in use on member accounts, most used first. */
export async function memberTags() {
  const rows = await prisma.user.findMany({ where: { tags: { isEmpty: false } }, select: { tags: true } });
  const counts = new Map<string, number>();
  for (const r of rows) for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
}

/** Everyone on the Studio team, for the "looked after by" filter and select. */
export async function studioTeam() {
  const rows = await prisma.user.findMany({
    where: { staffRole: { not: null } },
    orderBy: [{ name: "asc" }, { email: "asc" }],
    select: { id: true, name: true, email: true },
  });
  return rows.map((u) => ({ id: u.id, name: u.name ?? u.email ?? "Team member" }));
}
