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

export { parseMemberFilters, memberFilterQuery, accessState, ACCESS_LABEL } from "@/lib/members-filter";
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
  profile: { select: { location: true } },
} as const;

/** One page of members matching the Studio filters, newest first. */
export async function searchMembers(f: {
  q?: string;
  plan?: MemberPlanFilter;
  status?: MemberStatusFilter;
  cursor?: string;
}) {
  const filters: MemberFilters = { q: f.q?.trim() ?? "", plan: f.plan ?? "", status: f.status ?? "" };
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
      _count: { select: { posts: true, comments: true } },
    },
  });
  if (!user || user.email === SYSTEM_USER_EMAIL) return null;

  const [posts, reports, rsvps, notes, activity, membership] = await Promise.all([
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
  ]);

  return { user, posts, reports, rsvps, notes, activity, membership };
}

export type MemberDetail = NonNullable<Awaited<ReturnType<typeof memberDetail>>>;
