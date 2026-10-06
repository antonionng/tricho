import { json, withMember } from "@/lib/mobile/api";
import { firstName } from "@/lib/community";
import { prisma } from "@/lib/prisma";
import { getHome } from "@/app/members/_home";

/**
 * The Today screen: getting started, the feed, what's coming up, the latest
 * Trichozette and people to meet nearby. A free account gets { member: false }
 * so the app can show what membership adds.
 */
export const GET = withMember(async (_req, ctx) => {
  if (!ctx.allowed) {
    const user = await prisma.user.findUnique({ where: { id: ctx.session.user.id }, select: { name: true } });
    return json({ member: false as const, name: firstName(user?.name) || null });
  }
  const home = await getHome(ctx, ctx.session.user);
  if (!home) return json({ error: "Please sign in again." }, 401);
  const { user, feed, events, gazette, people, checklist, name } = home;
  return json({
    member: true as const,
    name: name || null,
    user: {
      isFounding: user.isFounding,
      profession: user.profile?.profession ?? null,
      chapter: user.chapter ? { slug: user.chapter.slug, city: user.chapter.city } : null,
    },
    checklist,
    feed,
    events: events.map(({ rsvps, ...e }) => ({ ...e, going: rsvps.length > 0 })),
    gazette,
    people: people.map((p) => ({ id: p.id, name: p.name, image: p.image, profession: p.profile?.profession ?? null })),
  });
});
