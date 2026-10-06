import "server-only";
import { prisma } from "@/lib/prisma";
import { getPosts, memberDirectoryWhere } from "@/lib/community";
import { chapterBySlug } from "@/content/chapters";

/**
 * A chapter's page, for the website and the app: its posts, members, member
 * count and upcoming local events. Null if there is no such chapter.
 */
export async function getChapter(slug: string, viewer: { userId: string; professional: boolean; chapterId: string | null }) {
  const chapter = await prisma.chapter.findUnique({ where: { slug } });
  if (!chapter) return null;

  const { userId } = viewer;
  const [posts, members, memberCount, events] = await Promise.all([
    getPosts({ userId, professional: viewer.professional, chapterId: chapter.id }),
    prisma.user.findMany({
      where: { AND: [memberDirectoryWhere(), { chapterId: chapter.id }] },
      orderBy: { onboardedAt: "desc" },
      take: 12,
      select: { id: true, name: true, image: true, profile: { select: { profession: true } } },
    }),
    prisma.user.count({ where: { AND: [memberDirectoryWhere(), { chapterId: chapter.id }] } }),
    prisma.event.findMany({
      where: {
        published: true,
        startsAt: { gte: new Date() },
        OR: [{ chapterId: chapter.id }, { city: { equals: chapter.city, mode: "insensitive" } }],
      },
      orderBy: { startsAt: "asc" },
      take: 5,
      select: { id: true, slug: true, title: true, startsAt: true, city: true, online: true, rsvps: { where: { userId }, select: { userId: true } } },
    }),
  ]);

  return {
    chapter,
    isMine: viewer.chapterId === chapter.id,
    blurb: chapter.blurb || chapterBySlug(chapter.slug)?.blurb || null,
    posts,
    members,
    memberCount,
    events,
  };
}
