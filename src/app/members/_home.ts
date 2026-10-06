import "server-only";
import { prisma } from "@/lib/prisma";
import { firstName, getTodayFeed, memberDirectoryWhere, rawSpacesFor } from "@/lib/community";
import { profileCompleteness } from "@/lib/profile";
import { isBusinessAccount } from "@/lib/subscription";
import type { MemberContext } from "@/lib/member";
import { loadApplicant } from "./profile/verification/applicant";

/**
 * Everything on the members' Today page, for the website and the app: the
 * getting-started checklist, the feed, upcoming events, the latest Trichozette
 * and people to meet in the member's chapter. Null if the account has gone.
 */
export async function getHome(ctx: MemberContext, me: { id: string; email?: string | null }, now = new Date()) {
  const userId = me.id;

  const [user, feed, events, gazette, following] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        isFounding: true,
        chapter: { select: { id: true, slug: true, city: true } },
        image: true,
        chapterId: true,
        profile: true,
      },
    }),
    getTodayFeed({ userId, professional: ctx.professional, chapterId: ctx.chapterId, profession: ctx.profession }),
    prisma.event.findMany({
      where: { published: true, startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      take: 3,
      select: { id: true, slug: true, title: true, startsAt: true, city: true, online: true, rsvps: { where: { userId }, select: { userId: true } } },
    }),
    prisma.draft.findFirst({
      where: { kind: "gazette_article", status: "published" },
      orderBy: { publishedAt: "desc" },
      select: { id: true, title: true, summary: true, publishedAt: true },
    }),
    prisma.follow.findMany({ where: { followerId: userId }, select: { followeeId: true } }),
  ]);
  if (!user) return null;

  const email = me.email?.toLowerCase() ?? null;
  const [introduced, invited, applicant, businessPage, businessAccount] = await Promise.all([
    prisma.communityPost.count({ where: { authorId: userId, space: { in: rawSpacesFor(["introductions"]) } } }),
    prisma.user.count({ where: { referredById: userId } }),
    loadApplicant(ctx),
    email ? prisma.partner.findUnique({ where: { ownerEmail: email }, select: { id: true } }).catch(() => null) : null,
    email ? isBusinessAccount(email) : false,
  ]);

  const people = user.chapter
    ? await prisma.user.findMany({
        where: {
          AND: [
            memberDirectoryWhere(),
            { chapterId: user.chapter.id, id: { notIn: [userId, ...following.map((f) => f.followeeId)] } },
          ],
        },
        take: 4,
        orderBy: { onboardedAt: "desc" },
        select: { id: true, name: true, image: true, profile: { select: { profession: true } } },
      })
    : [];

  const completeness = profileCompleteness(user.profile, user);
  const checklist = [
    {
      done: completeness.percent === 100,
      label: completeness.percent === 100 ? "Finish your profile" : `Finish your profile (${completeness.percent}% complete)`,
      href: "/members/profile",
    },
    { done: introduced > 0, label: "Introduce yourself in Introductions", href: "/members/community?space=introductions#compose" },
    { done: !!user.chapter, label: "Choose your chapter", href: "/members/profile#about" },
    ...(applicant && (applicant.eligible || applicant.isVerified)
      ? [{ done: applicant.isVerified, label: "Get verified", href: "/members/profile/verification" }]
      : []),
    { done: invited > 0, label: "Invite a colleague", href: "/members/refer" },
    ...(businessPage || businessAccount
      ? [{ done: !!businessPage, label: "Set up your business page", href: "/members/business/setup" }]
      : []),
  ];

  return { user, feed, events, gazette, people, checklist, name: firstName(user.name) };
}
